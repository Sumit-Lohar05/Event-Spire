const test = require('node:test');
const assert = require('node:assert/strict');
const Event = require('../models/Event');
const User = require('../models/User');
const { cancelTickets, purchaseTickets } = require('../services/ticketService');

process.env.MONGO_TRANSACTIONS = 'false';

test('purchase compensates capacity when booking persistence fails', async () => {
    const originalEventFindOne = Event.findOne;
    const originalEventFindOneAndUpdate = Event.findOneAndUpdate;
    const originalUserFindOne = User.findOne;
    const originalUserFindOneAndUpdate = User.findOneAndUpdate;
    const eventUpdates = [];

    Event.findOne = async () => ({
        _id: 'event-doc',
        id: 'event-123',
        title: 'Test Event',
        price: '10',
        date: { month: 'Jan', day: '01', year: '2030' }
    });
    Event.findOneAndUpdate = async (query, update) => {
        eventUpdates.push({ query, update });
        return eventUpdates.length === 1 ? { _id: 'event-doc', id: 'event-123' } : { acknowledged: true };
    };
    User.findOne = async () => null;
    User.findOneAndUpdate = async () => null;

    try {
        await assert.rejects(
            purchaseTickets({
                eventId: 'event-123',
                ticketQuantity: 2,
                bookingId: 'booking-123',
                userId: 'user-123'
            }),
            /booking could not be saved/
        );
        assert.equal(eventUpdates.length, 2);
        assert.deepEqual(eventUpdates[1].update, { $inc: { attendees: -2 } });
    } finally {
        Event.findOne = originalEventFindOne;
        Event.findOneAndUpdate = originalEventFindOneAndUpdate;
        User.findOne = originalUserFindOne;
        User.findOneAndUpdate = originalUserFindOneAndUpdate;
    }
});

test('repeat purchases atomically merge into one event booking', async () => {
    const originalEventFindOne = Event.findOne;
    const originalEventFindOneAndUpdate = Event.findOneAndUpdate;
    const originalUserFindOneAndUpdate = User.findOneAndUpdate;
    let userUpdate;
    let userUpdateOptions;
    const mergedBooking = {
        bookingId: 'booking-first',
        userId: 'user-123',
        eventId: 'event-123',
        eventTitle: 'Test Event',
        eventImage: 'event.jpg',
        eventDate: 'Jan 01 2030',
        quantity: 3,
        totalPaid: 30
    };

    Event.findOne = async () => ({
        _id: 'event-doc',
        id: 'event-123',
        title: 'Test Event',
        price: '10',
        date: { month: 'Jan', day: '01', year: '2030' }
    });
    Event.findOneAndUpdate = async () => ({ _id: 'event-doc', id: 'event-123', attendees: 3 });
    User.findOneAndUpdate = async (query, update, options) => {
        userUpdate = { query, update };
        userUpdateOptions = options;
        return { bookedTickets: [mergedBooking] };
    };

    try {
        const result = await purchaseTickets({
            eventId: 'event-123',
            ticketQuantity: 1,
            bookingId: 'booking-second',
            userId: 'user-123'
        });

        assert.equal(result.booking, mergedBooking);
        assert.equal(result.booking.quantity, 3);
        assert.equal(result.booking.totalPaid, 30);
        assert.equal(userUpdateOptions.updatePipeline, true);
        assert.equal(userUpdate.update.length, 1);
        assert.ok(userUpdate.update[0].$set.bookedTickets.$let);
        assert.deepEqual(userUpdate.query.bookedTickets.$not.$elemMatch.bookingId.$in, ['booking-second']);
    } finally {
        Event.findOne = originalEventFindOne;
        Event.findOneAndUpdate = originalEventFindOneAndUpdate;
        User.findOneAndUpdate = originalUserFindOneAndUpdate;
    }
});

test('cancellation rejects a quantity that differs from the stored booking', async () => {
    const originalUserFindOne = User.findOne;
    const originalUserFindOneAndUpdate = User.findOneAndUpdate;
    const originalEventFindOneAndUpdate = Event.findOneAndUpdate;
    let writeAttempted = false;

    User.findOne = async () => ({
        bookedTickets: [{ bookingId: 'booking-123', eventId: 'event-123', quantity: 2 }]
    });
    User.findOneAndUpdate = async () => {
        writeAttempted = true;
    };
    Event.findOneAndUpdate = async () => {
        writeAttempted = true;
    };

    try {
        await assert.rejects(
            cancelTickets({
                eventId: 'event-123',
                ticketQuantity: 1,
                bookingId: 'booking-123',
                userId: 'user-123'
            }),
            /does not match/
        );
        assert.equal(writeAttempted, false);
    } finally {
        User.findOne = originalUserFindOne;
        User.findOneAndUpdate = originalUserFindOneAndUpdate;
        Event.findOneAndUpdate = originalEventFindOneAndUpdate;
    }
});
