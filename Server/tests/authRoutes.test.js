const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const authRoutes = require('../routes/authRoutes');

process.env.JWT_SECRET = 'test-secret';
process.env.FRONTEND_URL = 'http://localhost:5173';

const request = async (method, path, body) => {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    const server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    const { port } = server.address();

    try {
        const response = await fetch(`http://127.0.0.1:${port}${path}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return { status: response.status, body: await response.json() };
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
};

test('registration rejects invalid input before database access', async () => {
    const originalFindOne = User.findOne;
    let databaseAccessed = false;
    User.findOne = async () => {
        databaseAccessed = true;
        throw new Error('Database should not be accessed');
    };

    try {
        const result = await request('POST', '/api/auth/register', {
            username: 'x',
            email: 'invalid-email',
            password: 'short'
        });
        assert.equal(result.status, 400);
        assert.equal(databaseAccessed, false);
    } finally {
        User.findOne = originalFindOne;
    }
});

test('unknown and incorrect-password login failures are generic', async () => {
    const originalFindOne = User.findOne;
    const originalCompare = bcrypt.compare;

    try {
        User.findOne = async () => null;
        const unknownUser = await request('POST', '/api/auth/login', {
            email: 'missing@example.com',
            password: 'password-123'
        });

        User.findOne = async () => ({ password: 'hashed-password', isVerified: true });
        bcrypt.compare = async () => false;
        const wrongPassword = await request('POST', '/api/auth/login', {
            email: 'user@example.com',
            password: 'password-123'
        });

        assert.equal(unknownUser.status, 401);
        assert.deepEqual(unknownUser.body, { message: 'Invalid email or password' });
        assert.equal(wrongPassword.status, 401);
        assert.deepEqual(wrongPassword.body, { message: 'Invalid email or password' });
    } finally {
        User.findOne = originalFindOne;
        bcrypt.compare = originalCompare;
    }
});

test('forgot-password returns the same response when the email is unknown', async () => {
    const originalFindOne = User.findOne;
    User.findOne = async () => null;

    try {
        const result = await request('POST', '/api/auth/forgot-password', { email: 'missing@example.com' });
        assert.equal(result.status, 200);
        assert.deepEqual(result.body, {
            message: 'If an account exists for that email, a password reset link will be sent.'
        });
    } finally {
        User.findOne = originalFindOne;
    }
});

test('reset-password hashes and consumes the reset token', async () => {
    const originalFindOne = User.findOne;
    const originalHash = bcrypt.hash;
    const token = 'a'.repeat(64);
    let lookup;
    const user = {
        password: 'old-hash',
        passwordResetToken: 'stored-hash',
        passwordResetTokenExpiresAt: new Date(Date.now() + 60_000),
        async save() {}
    };

    User.findOne = async query => {
        lookup = query;
        return user;
    };
    bcrypt.hash = async password => `hashed:${password}`;

    try {
        const result = await request('POST', '/api/auth/reset-password', {
            token,
            password: 'new-secure-password'
        });

        assert.equal(result.status, 200);
        assert.equal(user.password, 'hashed:new-secure-password');
        assert.equal(user.passwordResetToken, null);
        assert.equal(user.passwordResetTokenExpiresAt, null);
        assert.equal(lookup.passwordResetToken, crypto.createHash('sha256').update(token).digest('hex'));
        assert.notEqual(lookup.passwordResetToken, token);
    } finally {
        User.findOne = originalFindOne;
        bcrypt.hash = originalHash;
    }
});

test('reset-password rejects a weak password before database access', async () => {
    const originalFindOne = User.findOne;
    let databaseAccessed = false;
    User.findOne = async () => {
        databaseAccessed = true;
        return null;
    };

    try {
        const result = await request('POST', '/api/auth/reset-password', {
            token: 'a'.repeat(64),
            password: 'short'
        });
        assert.equal(result.status, 400);
        assert.equal(databaseAccessed, false);
    } finally {
        User.findOne = originalFindOne;
    }
});
