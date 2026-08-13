const express = require('express');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Purchase Ticket Route (Increment attendees)
router.post('/purchase', authMiddleware, async (req, res) => {
    try {
        const { eventId, ticketQuantity } = req.body;
        const query = {
            $or: [
                { id: eventId },
                { _id: mongoose.Types.ObjectId.isValid(eventId) ? eventId : null }
            ]
        };
        const event = await Event.findOne(query);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        
        // Check if there is enough space
        if (Number(event.attendees) + Number(ticketQuantity) > Number(event.maxCapacity)) {
            return res.status(400).json({ message: "Not enough available spots for this event." });
        }
        
        const updatedEvent = await Event.findOneAndUpdate(
            query,
            { $inc: { attendees: Number(ticketQuantity) } },
            { new: true, runValidators: false }
        );
        res.json({ message: "Tickets purchased successfully", event: updatedEvent });
    } catch (error) {
        console.error("Purchase Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Cancel Ticket Route
router.post('/cancel', authMiddleware, async (req, res) => {
    try {
        const { eventId, ticketQuantity, userId, bookingId } = req.body;
        
        const query = {
            $or: [
                {id: eventId },
                { _id: mongoose.Types.ObjectId.isValid(eventId) ? eventId : null }
            ]
        };
        const event = await Event.findOneAndUpdate(
            {
                ...query,
                attendees: { $gte: Number(ticketQuantity) }
            }, 
            { $inc: { attendees: -Number(ticketQuantity) } },
            { new: true }
        );
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        if (userId && bookingId) {
            await User.findByIdAndUpdate(userId, {
                $pull: { bookedTickets: { bookingId: bookingId } }
            });
        }
        res.json({ message: "Booking cancelled successfully", event });
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        const event = await Event.findOne({ id: req.params.id });
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
        const newEvent = new Event({
            ...req.body,
            isUserEvent: true
        });
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete an event from MongoDB
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.body;
        const eventId = req.params.id;

        const event = await Event.findOne({ id: eventId });

        if(!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        if(event.creatorId !== userId) {
            return res.status(403).json({ message: "You are not authorized to delete this event" });
        }
        await Event.findOneAndDelete({ id: eventId });
        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;