const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');
const {
    buildBookingIdValues,
    buildEventIdQuery,
    normalizeIdentifier,
    parsePositiveInteger
} = require('../utils/eventValidation');

class TicketError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

const applySession = (query, session) => {
    if (session && query && typeof query.session === 'function') {
        return query.session(session);
    }
    return query;
};

const withTicketTransaction = async (operation) => {
    if (process.env.MONGO_TRANSACTIONS !== 'true') {
        return operation(null, false);
    }

    const session = await mongoose.startSession();
    try {
        let result;
        await session.withTransaction(async () => {
            result = await operation(session, true);
        });
        return result;
    } finally {
        await session.endSession();
    }
};

const validatePurchaseInput = ({ eventId, ticketQuantity, bookingId }) => {
    const query = buildEventIdQuery(eventId);
    const quantity = parsePositiveInteger(ticketQuantity);
    const normalizedBookingId = normalizeIdentifier(bookingId);
    const bookingIdValues = buildBookingIdValues(bookingId);

    if (!query || !quantity || !normalizedBookingId || !bookingIdValues) {
        throw new TicketError('A valid event ID, booking ID, and positive ticket quantity are required.', 400);
    }

    return { query, quantity, normalizedBookingId, bookingIdValues };
};

const purchaseTickets = async ({ eventId, ticketQuantity, bookingId, userId }) => withTicketTransaction(async (session, transactional) => {
    const { query, quantity, normalizedBookingId, bookingIdValues } = validatePurchaseInput({ eventId, ticketQuantity, bookingId });
    const event = await applySession(Event.findOne(query), session);

    if (!event) {
        throw new TicketError('Event not found', 404);
    }

    const updatedEvent = await applySession(Event.findOneAndUpdate(
        {
            $and: [
                query,
                {
                    $expr: {
                        $lte: [
                            { $add: [{ $ifNull: ['$attendees', 0] }, quantity] },
                            { $ifNull: ['$maxCapacity', 1000] }
                        ]
                    }
                }
            ]
        },
        { $inc: { attendees: quantity } },
        { new: true, runValidators: false }
    ), session);

    if (!updatedEvent) {
        throw new TicketError('Not enough available spots for this event.', 400);
    }

    const eventPrice = Number(String(event.price || '').replace(/[^0-9.]/g, '')) || 0;
    const canonicalEventId = String(event.id || event._id);
    const eventIdValues = [...new Set([event.id, event._id].map(normalizeIdentifier).filter(Boolean))];
    const booking = {
        bookingId: normalizedBookingId,
        userId: String(userId),
        eventId: canonicalEventId,
        eventTitle: event.title,
        eventImage: event.image,
        eventDate: `${event.date?.month || ''} ${event.date?.day || ''} ${event.date?.year || ''}`.trim(),
        quantity,
        totalPaid: (eventPrice * quantity).toFixed(2)
    };

    let mergedBooking;
    try {
        const updatedUser = await applySession(User.findOneAndUpdate(
            {
                _id: userId,
                bookedTickets: { $not: { $elemMatch: { bookingId: { $in: bookingIdValues } } } }
            },
            [{
                $set: {
                    bookedTickets: {
                        $let: {
                            vars: { tickets: { $ifNull: ['$bookedTickets', []] } },
                            in: {
                                $let: {
                                    vars: {
                                        matching: {
                                            $filter: {
                                                input: '$$tickets',
                                                as: 'ticket',
                                                cond: { $in: ['$$ticket.eventId', eventIdValues] }
                                            }
                                        }
                                    },
                                    in: {
                                        $cond: [
                                            { $gt: [{ $size: '$$matching' }, 0] },
                                            {
                                                $concatArrays: [
                                                    {
                                                        $filter: {
                                                            input: '$$tickets',
                                                            as: 'ticket',
                                                            cond: { $not: [{ $in: ['$$ticket.eventId', eventIdValues] }] }
                                                        }
                                                    },
                                                    [{
                                                        $mergeObjects: [
                                                            { $arrayElemAt: ['$$matching', 0] },
                                                            {
                                                                quantity: {
                                                                    $add: [
                                                                        {
                                                                            $sum: {
                                                                                $map: {
                                                                                    input: '$$matching',
                                                                                    as: 'ticket',
                                                                                    in: {
                                                                                        $convert: {
                                                                                            input: '$$ticket.quantity',
                                                                                            to: 'int',
                                                                                            onError: 0,
                                                                                            onNull: 0
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        },
                                                                        quantity
                                                                    ]
                                                                },
                                                                totalPaid: {
                                                                    $round: [
                                                                        {
                                                                            $add: [
                                                                                {
                                                                                    $sum: {
                                                                                        $map: {
                                                                                            input: '$$matching',
                                                                                            as: 'ticket',
                                                                                            in: {
                                                                                                $convert: {
                                                                                                    input: '$$ticket.totalPaid',
                                                                                                    to: 'double',
                                                                                                    onError: 0,
                                                                                                    onNull: 0
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                },
                                                                                eventPrice * quantity
                                                                            ]
                                                                        },
                                                                        2
                                                                    ]
                                                                }
                                                            }
                                                        ]
                                                    }]
                                                ]
                                            },
                                            { $concatArrays: ['$$tickets', [booking]] }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }],
            { new: true, updatePipeline: true }
        ), session);

        if (!updatedUser) {
            throw new TicketError('The booking could not be saved. No tickets were reserved.', 500);
        }

        mergedBooking = updatedUser.bookedTickets.find(ticket => eventIdValues.includes(String(ticket.eventId)));
        if (!mergedBooking) {
            throw new TicketError('The booking could not be saved. No tickets were reserved.', 500);
        }
    } catch (error) {
        if (!transactional) {
            await Event.findOneAndUpdate(
                { _id: updatedEvent._id, attendees: { $gte: quantity } },
                { $inc: { attendees: -quantity } }
            );
        }
        throw error;
    }

    return { event: updatedEvent, booking: mergedBooking };
});

const cancelTickets = async ({ eventId, ticketQuantity, bookingId, userId }) => withTicketTransaction(async (session, transactional) => {
    const query = buildEventIdQuery(eventId);
    const normalizedEventId = normalizeIdentifier(eventId);
    const quantity = parsePositiveInteger(ticketQuantity);
    const bookingIdValues = buildBookingIdValues(bookingId);

    if (!query || !normalizedEventId || !quantity || !bookingIdValues) {
        throw new TicketError('A valid event ID, booking ID, and positive ticket quantity are required.', 400);
    }

    const bookingMatch = {
        bookingId: { $in: bookingIdValues },
        eventId: normalizedEventId
    };
    const user = await applySession(User.findOne({
        _id: userId,
        bookedTickets: { $elemMatch: bookingMatch }
    }), session);
    const booking = user?.bookedTickets?.find(ticket =>
        bookingIdValues.includes(String(ticket.bookingId)) && String(ticket.eventId) === normalizedEventId
    );

    if (!booking) {
        throw new TicketError('Booking not found for the authenticated user.', 404);
    }

    const storedQuantity = parsePositiveInteger(booking.quantity);
    if (!storedQuantity || storedQuantity !== quantity) {
        throw new TicketError('Ticket quantity does not match the stored booking.', 409);
    }

    let removedBooking = false;
    try {
        const removedBookingUser = await applySession(User.findOneAndUpdate(
            { _id: userId, bookedTickets: { $elemMatch: bookingMatch } },
            { $pull: { bookedTickets: bookingMatch } },
            { new: true }
        ), session);
        if (!removedBookingUser) {
            throw new TicketError('Booking not found for the authenticated user.', 404);
        }
        removedBooking = true;

        const event = await applySession(Event.findOneAndUpdate(
            { $and: [query, { attendees: { $gte: quantity } }] },
            { $inc: { attendees: -quantity } },
            { new: true }
        ), session);
        if (!event) {
            throw new TicketError('The event was not found or does not have enough attendees to cancel this booking.', 409);
        }

        return { event };
    } catch (error) {
        if (!transactional && removedBooking) {
            await User.findByIdAndUpdate(userId, { $push: { bookedTickets: booking } });
        }
        throw error;
    }
});

module.exports = { TicketError, cancelTickets, purchaseTickets, withTicketTransaction };
