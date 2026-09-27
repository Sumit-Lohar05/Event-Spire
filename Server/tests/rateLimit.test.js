const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { loginLimiter } = require('../middleware/rateLimit');

test('login limiter rejects requests after the configured threshold', async () => {
    const app = express();
    app.use('/login', loginLimiter, (req, res) => res.json({ ok: true }));
    const server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    const { port } = server.address();

    try {
        const responses = [];
        for (let attempt = 0; attempt < 6; attempt += 1) {
            responses.push(await fetch(`http://127.0.0.1:${port}/login`));
        }
        assert.deepEqual(responses.slice(0, 5).map(response => response.status), [200, 200, 200, 200, 200]);
        assert.equal(responses[5].status, 429);
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
});
