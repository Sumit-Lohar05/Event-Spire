import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, ApiError } from './api';

afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
});

describe('apiFetch authentication behavior', () => {
    it('dispatches one unauthorized event for a 401 response', async () => {
        const unauthorized = vi.fn();
        window.addEventListener('auth:unauthorized', unauthorized);
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
            JSON.stringify({ message: 'Expired token' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        ));

        await expect(apiFetch('/api/protected')).rejects.toBeInstanceOf(ApiError);
        expect(unauthorized).toHaveBeenCalledTimes(1);
        window.removeEventListener('auth:unauthorized', unauthorized);
    });

    it('does not dispatch unauthorized for 403 or 500 responses', async () => {
        const unauthorized = vi.fn();
        window.addEventListener('auth:unauthorized', unauthorized);
        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(new Response('{}', { status: 403 }))
            .mockResolvedValueOnce(new Response('{}', { status: 500 }));

        await expect(apiFetch('/api/forbidden')).rejects.toBeInstanceOf(ApiError);
        await expect(apiFetch('/api/server-error')).rejects.toBeInstanceOf(ApiError);
        expect(unauthorized).not.toHaveBeenCalled();
        window.removeEventListener('auth:unauthorized', unauthorized);
    });

    it('does not dispatch unauthorized for network errors', async () => {
        const unauthorized = vi.fn();
        window.addEventListener('auth:unauthorized', unauthorized);
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network unavailable'));

        await expect(apiFetch('/api/unavailable')).rejects.toThrow('Network unavailable');
        expect(unauthorized).not.toHaveBeenCalled();
        window.removeEventListener('auth:unauthorized', unauthorized);
    });
});
