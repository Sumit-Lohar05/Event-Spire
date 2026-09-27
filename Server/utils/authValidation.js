const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[A-Za-z0-9_ -]+$/;

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const validateRegistration = ({ username, email, password } = {}) => {
    const normalizedUsername = String(username || '').trim();
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = String(password || '');

    if (normalizedUsername.length < 3 || normalizedUsername.length > 30 || !usernamePattern.test(normalizedUsername)) {
        return { error: 'Username must be 3-30 characters and contain only letters, numbers, spaces, underscores, or hyphens.' };
    }
    if (normalizedEmail.length > 254 || !emailPattern.test(normalizedEmail)) {
        return { error: 'A valid email address is required.' };
    }
    if (normalizedPassword.length < 8 || normalizedPassword.length > 128) {
        return { error: 'Password must be between 8 and 128 characters.' };
    }

    return {
        value: {
            username: normalizedUsername,
            email: normalizedEmail,
            password: normalizedPassword
        }
    };
};

module.exports = { normalizeEmail, validateRegistration };
