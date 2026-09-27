const requiredVariables = [
    'MONGO_URI',
    'JWT_SECRET',
    'BASE_URL',
    'FRONTEND_URL',
    'EMAIL_USER',
    'EMAIL_PASS'
];

const parseAllowedOrigins = (value) => String(value || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const validateEnv = (environment = process.env) => {
    const missing = requiredVariables.filter(name => !String(environment[name] || '').trim());
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (String(environment.JWT_SECRET).length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long.');
    }

    const allowedOrigins = parseAllowedOrigins(environment.CORS_ORIGINS || environment.FRONTEND_URL);
    if (allowedOrigins.length === 0) {
        throw new Error('CORS_ORIGINS or FRONTEND_URL must define at least one allowed origin.');
    }

    return { allowedOrigins };
};

module.exports = { parseAllowedOrigins, validateEnv };
