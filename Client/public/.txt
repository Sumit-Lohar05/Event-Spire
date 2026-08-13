const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err.message)
        process.exit(1);
    });

const eventSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    image: String,
    date: { month: String, day: String, year: String },
    title: String,
    location: String,
    price: String,
    attendees: { type: Number, default: 0 },
    category: String,
    description: String,
    maxCapacity: {  type: Number, default: 1000 },
    creatorId: { type: String, required: true },
    isUserEvent: { type: Boolean, default: false }
});
const Event = mongoose.model('Event', eventSchema);

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    favourites: [String],
    bookedTickets: [Object]
});
const User = mongoose.model('User', userSchema);

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// SignUp Route
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if email is already taken
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken' });
        }
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationToken = crypto.randomBytes(32).toString('hex');
        // Create and save user

        const newUser = new User({ username, email, password: hashedPassword, verificationToken });
        await newUser.save();

        // Send verification email
        const verificationURL = `${process.env.BASE_URL}/api/auth/verify/${verificationToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'EventSpire Email Verification',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                    <div style="background-color: #000; padding: 25px; text-align: center;">
                        <img src="cid:eventspirelogo" alt="EventSpire Logo" style="width: 180px; height: auto; display: block; margin: 0 auto;">
                    </div>
                    <div style="padding: 40px; background-color: #fff;">
                        <h2 style="color: #333; margin-top: 0;">Welcome to the community, ${username}!</h2>
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            Thanks for joining EventSpire. We're excited to have you on board! Before you start exploring and hosting amazing events, please verify your email address.
                        </p>
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${verificationURL}" style="background-color: #8b5cf6; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.2);">
                                Verify My Email
                            </a>
                        </div>
                        <p style="color: #999; font-size: 13px; text-align: center; line-height: 1.4;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <a href="${verificationURL}" style="color: #8b5cf6; word-break: break-all;">${verificationURL}</a>
                        </p>
                    </div>
                    <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 12px; margin: 0;">&copy; 2026 EventSpire. All rights reserved.</p>
                    </div>
                </div>
            `,
            attachments: [{
                filename: 'logo.png',
                path: path.join(__dirname, '..', 'client', 'src', 'assets', 'logo1.png'), 
                cid: 'eventspirelogo'
            }]
        };
        try {
            await transporter.sendMail(mailOptions);
            console.log('Verification email sent');
            res.status(201).json({ message: 'User registered! Please check your email to verify.' });
        } catch (mailError) {
            console.error('Mail Error:', mailError);
            // Delete the user if email fails so they can try again
            await User.deleteOne({ _id: newUser._id });
            res.status(500).json({ message: 'Error sending verification email. Please try again.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if(!user) return res.status(400).json({ message: 'User not found' });

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
        
        // Check if email is verified
        if (!user.isVerified) {
        return res.status(403).json({ 
            message: "Please verify your email before logging in." 
        });
    }
        // Create JWT token
        const token = jwt.sign( { id: user._id}, process.env.JWT_SECRET, { expiresIn: '1h' } );

        res.json({
            token,
            user: { id: user._id, 
                    username: user.username, 
                    email: user.email,
                    favourites: user.favourites || [],
                    bookedTickets: user.bookedTickets || []
                }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Email Verification Route
app.get('/api/auth/verify/:token', async (req, res) => {
    try {
        const user = await User.findOne({ verificationToken: req.params.token });
        if(!user) {
            return res.redirect('http://localhost:5173/?verified=false');
        }
        user.isVerified = true;
        user.verificationToken = null;
        await user.save();
        res.redirect('http://localhost:5173/?verified=true');
    } catch (error) {
        res.status(500).redirect('http://localhost:5173/?verified=error');
    }
});

// Purchase Ticket Route (Increment attendees)
app.post('/api/events/purchase', async (req, res) => {
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
            { new: true, runValidators: false } // runValidators: false is the key here
        );
        res.json({ message: "Tickets purchased successfully", event: updatedEvent });
    } catch (error) {
        console.error("Purchase Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Cancel Ticket Route
app.post('/api/events/cancel', async (req, res) => {
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

// Update favourites route
app.patch('/api/users/update-favourites', async (req, res) => {
    try {
        const { favourites, userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ message: "UserId is required" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { favourites },
            { new: true } //return the updated document
        );
        if(!updatedUser) {
            return res.status(400).json({ message: "User not found" });
        }
        res.status(200).json({ message: "Favourites synced successfully", favourites: updatedUser.favourites});
    } catch (error) {
        console.error("Synced Error:", error);
        res.status(500).json({ error: "Internal Server Error"});
    }
});

// Update booked tickets route
app.post('/api/users/book-ticket', async (req, res) => {
    const { userId, booking } = req.body;
    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { $push: { bookedTickets: booking } },
            { new: true }
        );
        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "Ticket saved to account successfully", user});
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error"});
    }
});

// Import and use routes
app.get('/', (req, res) => {
    res.send('EventSpire API is running successfully!');
});

app.get('/api/events', async (req, res) => {
    try {
        const dbEvents = await Event.find();
        res.json(dbEvents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/events/:id', async (req, res) => {
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
app.post('/api/events', async (req, res) => {
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
app.delete('/api/events/:id', async (req, res) => {
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

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

