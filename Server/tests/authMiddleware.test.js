const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret';
const authMiddleware = require('../middleware/authMiddleware');

const runMiddleware = (authorization) => {
    let statusCode;
    let payload;
    let nextCalled = false;
    const request = {
        header: () => authorization
    };
    const response = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(body) {
            payload = body;
            return this;
        }
    };

    authMiddleware(request, response, () => {
        nextCalled = true;
    });

    return { nextCalled, payload, request, statusCode };
};

test('auth middleware rejects missing bearer tokens', () => {
    const result = runMiddleware(undefined);
    assert.equal(result.statusCode, 401);
    assert.equal(result.nextCalled, false);
    assert.equal(result.payload.message, 'No token, authorization denied');
});

test('auth middleware rejects malformed or invalid tokens', () => {
    const result = runMiddleware('Basic invalid-token');
    assert.equal(result.statusCode, 401);
    assert.equal(result.nextCalled, false);
    assert.equal(result.payload.message, 'Token is not valid');
});

test('auth middleware attaches the authenticated JWT identity', () => {
    const token = jwt.sign({ id: 'user-123' }, process.env.JWT_SECRET);
    const result = runMiddleware(`Bearer ${token}`);
    assert.equal(result.nextCalled, true);
    assert.deepEqual(result.request.user, { id: 'user-123', iat: result.request.user.iat });
});
