const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeEmail, validateRegistration } = require('../utils/authValidation');

test('normalizeEmail trims and lowercases email addresses', () => {
    assert.equal(normalizeEmail(' User@Example.COM '), 'user@example.com');
});

test('validateRegistration accepts the approved registration policy', () => {
    const result = validateRegistration({
        username: 'Event User',
        email: ' User@Example.COM ',
        password: 'secure-password'
    });

    assert.deepEqual(result.value, {
        username: 'Event User',
        email: 'user@example.com',
        password: 'secure-password'
    });
});

test('validateRegistration rejects invalid server-side input', () => {
    assert.match(validateRegistration({ username: 'x', email: 'valid@example.com', password: 'secure-password' }).error, /Username/);
    assert.match(validateRegistration({ username: 'valid-user', email: 'not-an-email', password: 'secure-password' }).error, /email/);
    assert.match(validateRegistration({ username: 'valid-user', email: 'valid@example.com', password: 'short' }).error, /Password/);
    assert.match(validateRegistration({ username: 'valid<script>', email: 'valid@example.com', password: 'secure-password' }).error, /Username/);
});
