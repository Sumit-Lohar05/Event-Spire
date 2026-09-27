const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Event = require('../../models/Event');
const User = require('../../models/User');
const { cancelTickets, purchaseTickets } = require('../../services/ticketService');

const testUri = process.env.TEST_MONGO_URI;
const skipReason = testUri ? false : 'TEST_MONGO_URI is not configured; refusing to use the normal database.';

if (testUri && process.env.MONGO_URI && testUri === process.env.MONGO_URI) {
    throw new Error('TEST_MONGO_URI must be different from MONGO_URI.');
}

test('MongoDB purchase and cancellation maintain both documents', { skip: skipReason }, async (t) => {
    await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5000 });
    await Event.deleteMany({ id: /^phase6b-/ });
    await User.deleteMany({ email: /@phase6b\.test$/ });

    const user = await User.create({
        username: `phase6b-${Date.now()}`,
        email: `phase6b-${Date.now()}@phase6b.test`,
        password: 'test-hash',
        isVerified: true
    });
    const event = await Event.create({
        id: `phase6b-${Date.now()}`,
        title: 'Phase 6B Test Event',
        location: 'Test Location',
        category: 'Test',
        description: 'Isolated integration test event',
        price: '10',
        maxCapacity: 2,
        attendees: 0,
        creatorId: String(user._id),
        date: { month: 'Jan', day: '01', year: '2030' }
    });

    try {
        const purchase = await purchaseTickets({
            eventId: event.id,
            ticketQuantity: 1,
            bookingId: `booking-first-${Date.now()}`,
            userId: user._id
        });
        assert.equal(purchase.event.attendees, 1);
        assert.equal((await User.findById(user._id)).bookedTickets.length, 1);

        const repeatPurchase = await purchaseTickets({
            eventId: event.id,
            ticketQuantity: 1,
            bookingId: `booking-second-${Date.now()}`,
            userId: user._id
        });
        const updatedUser = await User.findById(user._id);
        assert.equal(repeatPurchase.event.attendees, 2);
        assert.equal(updatedUser.bookedTickets.length, 1);
        assert.equal(updatedUser.bookedTickets[0].quantity, 2);
        assert.equal(updatedUser.bookedTickets[0].totalPaid, 20);

        const cancellation = await cancelTickets({
            eventId: event.id,
            ticketQuantity: 2,
            bookingId: repeatPurchase.booking.bookingId,
            userId: user._id
        });
        assert.equal(cancellation.event.attendees, 0);
        assert.equal((await User.findById(user._id)).bookedTickets.length, 0);
    } finally {
        await Event.deleteOne({ _id: event._id });
        await User.deleteOne({ _id: user._id });
        await mongoose.disconnect();
    }
});
