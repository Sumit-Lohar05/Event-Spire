const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const path = require('path');
const User = require('../models/User');
const { normalizeEmailPassword } = require('../utils/emailConfig');
const { normalizeEmail, validateRegistration } = require('../utils/authValidation');
const authMiddleware = require('../middleware/authMiddleware');
const {
    loginLimiter,
    registrationLimiter,
    verificationLimiter,
    passwordResetRequestLimiter,
    passwordResetLimiter
} = require('../middleware/rateLimit');

const router = express.Router();
const verificationTokenLifetimeMs = 24 * 60 * 60 * 1000;
const passwordResetTokenLifetimeMs = 60 * 60 * 1000;

const hashVerificationToken = (token) => crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

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
router.post('/register', registrationLimiter, async (req, res) => {
    try {
        const validation = validateRegistration(req.body);
        if (validation.error) {
            return res.status(400).json({ message: validation.error });
        }
        const { username, email, password } = validation.value;

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
        const verificationTokenExpiresAt = new Date(Date.now() + verificationTokenLifetimeMs);
        // Create and save user

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            verificationToken: hashVerificationToken(verificationToken),
            verificationTokenExpiresAt
        });
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
                path: path.join(__dirname, '..', '..', 'Client', 'src', 'assets', 'logo1.png'),
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
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || '');
        const invalidCredentials = () => res.status(401).json({ message: 'Invalid email or password' });

        if (!email || !password) {
            return invalidCredentials();
        }

        // Find user by email
        const user = await User.findOne({ email });
        if(!user) return invalidCredentials();

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return invalidCredentials();
        
        // Check if email is verified
        if (!user.isVerified) return invalidCredentials();
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

router.post('/forgot-password', passwordResetRequestLimiter, async (req, res) => {
    const responseMessage = 'If an account exists for that email, a password reset link will be sent.';

    try {
        const email = normalizeEmail(req.body.email);
        if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.json({ message: responseMessage });
        }

        const user = await User.findOne({ email });
        if (user) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            user.passwordResetToken = hashVerificationToken(resetToken);
            user.passwordResetTokenExpiresAt = new Date(Date.now() + passwordResetTokenLifetimeMs);
            await user.save();

            const frontendURL = String(process.env.FRONTEND_URL || '').replace(/\/+$/, '');
            const resetURL = `${frontendURL}/?resetToken=${encodeURIComponent(resetToken)}`;
            try {
                await transporter.sendMail({
                    from: emailUser,
                    to: email,
                    subject: 'Reset your EventSpire password',
                    text: `Use this link to reset your EventSpire password. It expires in one hour: ${resetURL}`,
                    html: `<p>Use the link below to reset your EventSpire password. It expires in one hour.</p><p><a href="${resetURL}">Reset password</a></p>`
                });
            } catch (mailError) {
                console.error('Password reset email could not be sent:', mailError?.message || mailError);
            }
        }

        res.json({ message: responseMessage });
    } catch (error) {
        console.error('Password reset request failed:', error?.message || error);
        res.json({ message: responseMessage });
    }
});

router.post('/reset-password', passwordResetLimiter, async (req, res) => {
    const token = String(req.body.token || '');
    const password = String(req.body.password || '');

    if (password.length < 8 || password.length > 128) {
        return res.status(400).json({ message: 'Password must be between 8 and 128 characters.' });
    }
    if (!/^[a-f0-9]{64}$/i.test(token)) {
        return res.status(400).json({ message: 'Invalid or expired password reset link.' });
    }

    try {
        const user = await User.findOne({
            passwordResetToken: hashVerificationToken(token),
            passwordResetTokenExpiresAt: { $gt: new Date() }
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired password reset link.' });
        }

        user.password = await bcrypt.hash(password, 10);
        user.passwordResetToken = null;
        user.passwordResetTokenExpiresAt = null;
        await user.save();
        res.json({ message: 'Password updated. You can now sign in.' });
    } catch (error) {
        res.status(500).json({ message: 'Could not reset password. Please try again later.' });
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password -verificationToken -verificationTokenExpiresAt -passwordResetToken -passwordResetTokenExpiresAt');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Email Verification Route
router.get('/verify/:token', verificationLimiter, async (req, res) => {
    try {
        const hashedToken = hashVerificationToken(req.params.token);
        const user = await User.findOne({
            verificationToken: hashedToken,
            verificationTokenExpiresAt: { $gt: new Date() },
            isVerified: false
        });
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL}/?verified=false`);
        }
        user.isVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpiresAt = null;
        await user.save();
        res.redirect(`${process.env.FRONTEND_URL}/?verified=true`);
    } catch (error) {
        res.status(500).redirect(`${process.env.FRONTEND_URL}/?verified=error`);
    }
});

module.exports = router;