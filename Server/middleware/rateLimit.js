const rateLimit = require('express-rate-limit');

const createAuthRateLimit = (windowMs, limit, message) => rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message }
});

const registrationLimiter = createAuthRateLimit(
    60 * 60 * 1000,
    5,
    'Too many registration attempts. Please try again later.'
);

const loginLimiter = createAuthRateLimit(
    15 * 60 * 1000,
    5,
    'Too many login attempts. Please try again later.'
);

const verificationLimiter = createAuthRateLimit(
    60 * 60 * 1000,
    10,
    'Too many verification attempts. Please try again later.'
);

const passwordResetRequestLimiter = createAuthRateLimit(
    60 * 60 * 1000,
    5,
    'Too many password reset requests. Please try again later.'
);

const passwordResetLimiter = createAuthRateLimit(
    15 * 60 * 1000,
    10,
    'Too many password reset attempts. Please try again later.'
);

module.exports = {
    loginLimiter,
    registrationLimiter,
    verificationLimiter,
    passwordResetRequestLimiter,
    passwordResetLimiter
};
