const mongoose = require('mongoose');

const parsePositiveInteger = (value) => {
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
        return value;
    }

    if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
        const parsedValue = Number(value);
        return Number.isSafeInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
    }

    return null;
};

const normalizeIdentifier = (value) => {
    if (typeof value !== 'string' && typeof value !== 'number') {
        return null;
    }

    const normalizedValue = String(value).trim();
    return normalizedValue || null;
};

const buildEventIdQuery = (eventId) => {
    const normalizedId = normalizeIdentifier(eventId);
    if (!normalizedId) {
        return null;
    }

    const conditions = [{ id: normalizedId }];
    if (mongoose.Types.ObjectId.isValid(normalizedId)) {
        conditions.push({ _id: normalizedId });
    }

    return { $or: conditions };
};

const buildBookingIdValues = (bookingId) => {
    const normalizedId = normalizeIdentifier(bookingId);
    if (!normalizedId) {
        return null;
    }

    const values = [normalizedId];
    const numericId = Number(normalizedId);
    if (Number.isSafeInteger(numericId)) {
        values.push(numericId);
    }

    return [...new Set(values)];
};

module.exports = {
    buildBookingIdValues,
    buildEventIdQuery,
    normalizeIdentifier,
    parsePositiveInteger
};
