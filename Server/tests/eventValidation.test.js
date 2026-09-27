const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildBookingIdValues,
    buildEventIdQuery,
    normalizeIdentifier,
    parsePositiveInteger
} = require('../utils/eventValidation');

test('parsePositiveInteger accepts only positive safe integers', () => {
    assert.equal(parsePositiveInteger(1), 1);
    assert.equal(parsePositiveInteger('4'), 4);
    assert.equal(parsePositiveInteger(0), null);
    assert.equal(parsePositiveInteger('-1'), null);
    assert.equal(parsePositiveInteger('1.5'), null);
    assert.equal(parsePositiveInteger('not-a-number'), null);
});

test('buildEventIdQuery supports custom and Mongo identifiers', () => {
    assert.deepEqual(buildEventIdQuery('event-123'), {
        $or: [{ id: 'event-123' }]
    });

    const mongoQuery = buildEventIdQuery('507f1f77bcf86cd799439011');
    assert.deepEqual(mongoQuery, {
        $or: [
            { id: '507f1f77bcf86cd799439011' },
            { _id: '507f1f77bcf86cd799439011' }
        ]
    });

    assert.equal(buildEventIdQuery('   '), null);
});

test('booking identifiers accept legacy numeric and current string values', () => {
    assert.deepEqual(buildBookingIdValues(42), ['42', 42]);
    assert.deepEqual(buildBookingIdValues('booking-42'), ['booking-42']);
    assert.equal(buildBookingIdValues(null), null);
    assert.equal(normalizeIdentifier('  booking-42  '), 'booking-42');
});
