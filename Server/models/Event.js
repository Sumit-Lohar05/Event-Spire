const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    image: String,
    date: {
        month: String,
        day: String,
        year: String,
        startAt: Date,
        endAt: Date
    },
    title: String,
    location: String,
    price: { type: String, default: '0' },
    attendees: { type: Number, default: 0 },
    category: String,
    description: String,
    maxCapacity: {  type: Number, default: 1000 },
    creatorId: { type: String, required: true },
    isUserEvent: { type: Boolean, default: false }
});

module.exports = mongoose.model('Event', eventSchema);
