const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const Event = require('../models/Event');
const User = require('../models/User');
const eventRoutes = require('../routes/eventRoutes');

process.env.JWT_SECRET = 'test-secret';

const request = async (method, path, body, token) => {
    const app = express();
    app.use(express.json());
    app.use('/api/events', eventRoutes);
    const server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    const { port } = server.address();

    try {
        const response = await fetch(`http://127.0.0.1:${port}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        return { status: response.status, body: await response.json() };
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
};

test('purchase rejects invalid quantity before accessing the database', async () => {
    const originalFindOne = Event.findOne;
    let databaseAccessed = false;
    Event.findOne = async () => {
        databaseAccessed = true;
        throw new Error('Database should not be accessed');
    };

    try {
        const token = jwt.sign({ id: 'user-123' }, process.env.JWT_SECRET);
        const result = await request('POST', '/api/events/purchase', {
            eventId: 'event-123',
            ticketQuantity: -1,
            bookingId: 'booking-123'
        }, token);
        assert.equal(result.status, 400);
        assert.equal(databaseAccessed, false);
    } finally {
        Event.findOne = originalFindOne;
    }
});

test('event deletion rejects a non-owner using the JWT identity', async () => {
    const originalFindOne = Event.findOne;
    const originalFindOneAndDelete = Event.findOneAndDelete;
    let deleteCalled = false;
    Event.findOne = async () => ({
        _id: 'mongo-event-id',
        id: 'event-123',
        creatorId: 'owner-123'
    });
    Event.findOneAndDelete = async () => {
        deleteCalled = true;
    };

    try {
        const token = jwt.sign({ id: 'different-user' }, process.env.JWT_SECRET);
        const result = await request('DELETE', '/api/events/event-123', {}, token);
        assert.equal(result.status, 403);
        assert.equal(result.body.message, 'You are not authorized to delete this event');
        assert.equal(deleteCalled, false);
    } finally {
        Event.findOne = originalFindOne;
        Event.findOneAndDelete = originalFindOneAndDelete;
    }
});

test('ticket cancellation rejects a booking not owned by the JWT user', async () => {
    const originalUserFindOne = User.findOne;
    const originalEventFindOneAndUpdate = Event.findOneAndUpdate;
    let eventUpdateCalled = false;
    User.findOne = async () => null;
    Event.findOneAndUpdate = async () => {
        eventUpdateCalled = true;
    };

    try {
        const token = jwt.sign({ id: 'user-123' }, process.env.JWT_SECRET);
        const result = await request('POST', '/api/events/cancel', {
            eventId: 'event-123',
            ticketQuantity: 1,
            bookingId: 'booking-owned-by-someone-else'
        }, token);
        assert.equal(result.status, 404);
        assert.equal(result.body.message, 'Booking not found for the authenticated user.');
        assert.equal(eventUpdateCalled, false);
    } finally {
        User.findOne = originalUserFindOne;
        Event.findOneAndUpdate = originalEventFindOneAndUpdate;
    }
});
