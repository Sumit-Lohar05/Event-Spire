const test = require('node:test');
const assert = require('node:assert/strict');

const { parseAllowedOrigins, validateEnv } = require('../config/env');

test('parseAllowedOrigins trims and removes empty values', () => {
    assert.deepEqual(parseAllowedOrigins(' https://app.example.com, ,http://localhost:5173 '), [
        'https://app.example.com',
        'http://localhost:5173'
    ]);
});

test('validateEnv rejects missing or weak deployment configuration', () => {
    assert.throws(
        () => validateEnv({}),
        /Missing required environment variables/
    );

    assert.throws(
        () => validateEnv({
            MONGO_URI: 'mongodb://example',
            JWT_SECRET: 'short',
            BASE_URL: 'https://api.example.com',
            FRONTEND_URL: 'https://app.example.com',
            EMAIL_USER: 'mail@example.com',
            EMAIL_PASS: 'app-password'
        }),
        /JWT_SECRET must be at least 32 characters/
    );
});

test('validateEnv returns configured CORS origins', () => {
    const result = validateEnv({
        MONGO_URI: 'mongodb://example',
        JWT_SECRET: 'a'.repeat(32),
        BASE_URL: 'https://api.example.com',
        FRONTEND_URL: 'https://app.example.com',
        CORS_ORIGINS: 'https://app.example.com,https://admin.example.com',
        EMAIL_USER: 'mail@example.com',
        EMAIL_PASS: 'app-password'
    });

    assert.deepEqual(result.allowedOrigins, [
        'https://app.example.com',
        'https://admin.example.com'
    ]);
});
