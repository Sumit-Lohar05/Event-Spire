const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// PATCH /api/users/update-profile
router.patch('/update-profile', authMiddleware, async (req, res) => {
    try {
        const { userId, bio, profilePicture, socialLinks } = req.body;

        // Security check: safely convert both to strings to ensure matching types
        if (String(req.user.id) !== String(userId)) {
            return res.status(403).json({ message: 'Unauthorized: You can only update your own profile' });
        }

        // Find user by ID and update the fields
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { bio, profilePicture, socialLinks } },
            { new: true, runValidators: true }
        ).select('-password -verificationToken');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: error.message || 'Server error while updating profile' });
    }
});

// POST /api/users/book-ticket
router.post('/book-ticket', authMiddleware, async (req, res) => {
    try {
        const { userId, booking } = req.body;

        if (String(req.user.id) !== String(userId)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $push: { bookedTickets: booking } },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Ticket booked successfully', user: updatedUser });
    } catch (error) {
        console.error('Error booking ticket:', error);
        res.status(500).json({ message: error.message });
    }
});

// PATCH /api/users/update-favourites
router.patch('/update-favourites', authMiddleware, async (req, res) => {
    try {
        const { userId, favourites } = req.body;

        if (String(req.user.id) !== String(userId)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { favourites: favourites } },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Favourites updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating favourites:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
