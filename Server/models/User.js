const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    favourites: [String],
    bookedTickets: [Object],
    bio: { type: String, default: "" },
    profilePicture: { type: String, default: "https://via.placeholder.com/150" },
    socialLinks: {
        facebook: { type: String, default: "" },
        twitter: { type: String, default: "" },
        instagram: { type: String, default: "" }
    }
});

module.exports = mongoose.model('User', userSchema);
