const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// PATCH /api/users/update-profile
router.patch('/update-profile', authMiddleware, async (req, res) => {
    try {
        const { bio, profilePicture, socialLinks } = req.body;
        const userId = req.user.id;

        // Find user by ID and update the fields
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { bio, profilePicture, socialLinks } },
            { new: true, runValidators: true }
        ).select('-password -verificationToken -passwordResetToken -passwordResetTokenExpiresAt');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: error.message || 'Server error while updating profile' });
    }
});

// PATCH /api/users/update-favourites
router.patch('/update-favourites', authMiddleware, async (req, res) => {
    try {
        const { favourites } = req.body;
        const userId = req.user.id;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { favourites: favourites } },
            { new: true }
        ).select('-password -passwordResetToken -passwordResetTokenExpiresAt');

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
