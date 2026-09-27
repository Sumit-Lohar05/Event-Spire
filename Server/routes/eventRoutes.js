const express = require('express');
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');
const { buildEventIdQuery, normalizeIdentifier } = require('../utils/eventValidation');
const { TicketError, cancelTickets, purchaseTickets } = require('../services/ticketService');

const router = express.Router();

const parseNonNegativePrice = (value) => {
    const normalizedValue = String(value ?? '').trim();
    if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
        return null;
    }

    const price = Number(normalizedValue);
    return Number.isFinite(price) && price >= 0 ? normalizedValue : null;
};

const parseEventPayload = (body, existingEvent = {}) => {
    const title = String(body.title ?? '').trim();
    const location = String(body.location ?? '').trim();
    const category = String(body.category ?? '').trim();
    const description = String(body.description ?? '').trim();
    const price = parseNonNegativePrice(body.price);
    const maxCapacity = Number(body.maxCapacity);

    if (!title || !location || !category || !description || price === null ||
        !Number.isInteger(maxCapacity) || maxCapacity < 1) {
        return { error: 'Title, location, category, description, price, and a positive integer capacity are required.' };
    }

    const dateInput = body.date;
    const date = dateInput && typeof dateInput === 'object'
        ? { ...existingEvent.date?.toObject?.(), ...dateInput }
        : existingEvent.date?.toObject?.() || existingEvent.date;

    if (!date?.year || !date?.month || !date?.day) {
        return { error: 'A valid event date is required.' };
    }

    const startAt = body.startAt || date.startAt;
    const endAt = body.endAt || date.endAt;
    if (startAt && Number.isNaN(new Date(startAt).getTime())) {
        return { error: 'The event start time is invalid.' };
    }
    if (endAt && Number.isNaN(new Date(endAt).getTime())) {
        return { error: 'The event end time is invalid.' };
    }
    if (startAt && endAt && new Date(endAt) <= new Date(startAt)) {
        return { error: 'The event end time must be after the start time.' };
    }

    return {
        value: {
            title,
            location,
            category,
            description,
            price,
            maxCapacity,
            image: body.image || existingEvent.image,
            date: {
                month: String(date.month),
                day: String(date.day),
                year: String(date.year),
                ...(startAt ? { startAt: new Date(startAt) } : {}),
                ...(endAt ? { endAt: new Date(endAt) } : {})
            }
        }
    };
};

// Purchase Ticket Route (Increment attendees)
router.post('/purchase', authMiddleware, async (req, res) => {
    try {
        const result = await purchaseTickets({ ...req.body, userId: req.user.id });
        res.json({ message: "Tickets purchased successfully", ...result });
    } catch (error) {
        const status = error instanceof TicketError ? error.status : 500;
        if (!(error instanceof TicketError)) {
            console.error("Purchase Error:", error);
        }
        res.status(status).json({ message: error.message });
    }
});

// Cancel Ticket Route
router.post('/cancel', authMiddleware, async (req, res) => {
    try {
        const result = await cancelTickets({ ...req.body, userId: req.user.id });
        res.json({ message: "Booking cancelled successfully", ...result });
    } catch (error) {
        const status = error instanceof TicketError ? error.status : 500;
        res.status(status).json({ message: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const dbEvents = await Event.find();
        res.json(dbEvents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const query = buildEventIdQuery(req.params.id);
        if (!query) {
            return res.status(400).json({ message: "A valid event ID is required" });
        }
        const event = await Event.findOne(query);
        if(event){
            res.json(event); 
        } else {
            res.status(404).json({ message: "Event not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a new event to MongoDB
router.post('/', authMiddleware, async (req, res) => {
    try {
        const parsedEvent = parseEventPayload(req.body);
        if (parsedEvent.error) {
            return res.status(400).json({ message: parsedEvent.error });
        }

        const newEvent = new Event({
            ...parsedEvent.value,
            id: normalizeIdentifier(req.body.id) || `event-${Date.now()}`,
            creatorId: String(req.user.id),
            attendees: 0,
            isUserEvent: true
        });
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update an existing event owned by the authenticated organizer.
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        const query = buildEventIdQuery(req.params.id);
        if (!query) {
            return res.status(400).json({ message: 'A valid event ID is required.' });
        }

        const event = await Event.findOne(query);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        if (String(event.creatorId) !== String(req.user.id)) {
            return res.status(403).json({ message: 'You are not authorized to update this event.' });
        }

        const parsedEvent = parseEventPayload(req.body, event);
        if (parsedEvent.error) {
            return res.status(400).json({ message: parsedEvent.error });
        }
        if (parsedEvent.value.maxCapacity < Number(event.attendees || 0)) {
            return res.status(400).json({ message: 'Capacity cannot be lower than current attendance.' });
        }

        Object.assign(event, parsedEvent.value);
        await event.save();
        res.json(event);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete an event from MongoDB
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const query = buildEventIdQuery(req.params.id);
        if (!query) {
            return res.status(400).json({ message: "A valid event ID is required" });
        }

        const event = await Event.findOne(query);

        if(!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        if(String(event.creatorId) !== String(req.user.id)) {
            return res.status(403).json({ message: "You are not authorized to delete this event" });
        }
        await Event.findOneAndDelete({ _id: event._id });
        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;