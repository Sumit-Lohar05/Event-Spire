const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const path = require('path');
const User = require('../models/User');
const { normalizeEmailPassword } = require('../utils/emailConfig');

const router = express.Router();

const emailUser = (process.env.EMAIL_USER || '').trim();
const emailPassword = normalizeEmailPassword(process.env.EMAIL_PASS);

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: emailUser,
        pass: emailPassword
    }
});

// SignUp Route
router.post('/register', async (req, res) => {
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
                // We added an extra '..' because this file is now nested inside the 'routes' folder
                path: path.join(__dirname, '..', '..', 'client', 'src', 'assets', 'logo1.png'), 
                cid: 'eventspirelogo'
            }]
        };
        try {
            await transporter.sendMail(mailOptions);
            console.log('Verification email sent');
            res.status(201).json({ message: 'User registered! Please check your email to verify.' });
        } catch (mailError) {
            const mailMessage = mailError?.response || mailError?.message || 'Unknown mail error';
            console.error('Mail Error:', mailMessage);
            // Delete the user if email fails so they can try again
            await User.deleteOne({ _id: newUser._id });
            res.status(500).json({
                message: 'Verification email could not be sent. Check the Gmail app password in the server .env file.'
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login Route
router.post('/login', async (req, res) => {
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
        const token = jwt.sign( { id: user._id}, process.env.JWT_SECRET, { expiresIn: '3d' } );

        res.json({
            token,
            user: { id: user._id, 
                    username: user.username, 
                    email: user.email,
                    favourites: user.favourites || [],
                    bookedTickets: user.bookedTickets || [],
                    bio: user.bio || '',
                    profilePicture: user.profilePicture || '',
                    socialLinks: user.socialLinks || {}
                }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Email Verification Route
router.get('/verify/:token', async (req, res) => {
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

module.exports = router;