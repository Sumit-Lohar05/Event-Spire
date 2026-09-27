import { describe, expect, it } from 'vitest';
import { isEventExpired } from './eventFormat';

describe('isEventExpired', () => {
    const now = new Date('2026-09-27T12:00:00');

    it('expires an event after its explicit end time', () => {
        expect(isEventExpired({ date: { endAt: '2026-09-27T11:59:00' } }, now)).toBe(true);
        expect(isEventExpired({ date: { endAt: '2026-09-27T12:01:00' } }, now)).toBe(false);
    });

    it('keeps a date-only event discoverable until its calendar day ends', () => {
        const event = { date: { month: 'Sep', day: '27', year: '2026' } };

        expect(isEventExpired(event, new Date('2026-09-27T23:59:59'))).toBe(false);
        expect(isEventExpired(event, new Date('2026-09-28T00:00:00'))).toBe(true);
    });

    it('does not hide events with missing or invalid dates', () => {
        expect(isEventExpired({}, now)).toBe(false);
        expect(isEventExpired({ date: { month: 'Unknown', day: 'x', year: '2026' } }, now)).toBe(false);
    });
});