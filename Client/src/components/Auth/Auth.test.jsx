import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Auth from './Auth';
import { ApiError, apiFetch } from '../../utils/api';

vi.mock('../../utils/api', async (importOriginal) => ({
    ...await importOriginal(),
    apiFetch: vi.fn()
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
});

describe('Auth', () => {
    it('shows client-side validation before submitting invalid login input', async () => {
        render(<Auth isOpen initialMode onClose={vi.fn()} onAuthSuccess={vi.fn()} />);
        fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'user@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'short' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        expect(await screen.findByText('Password must be at least 6 characters.')).toBeInTheDocument();
        expect(apiFetch).not.toHaveBeenCalled();
    });

    it('submits valid login credentials and reports success', async () => {
        vi.mocked(apiFetch).mockResolvedValue({
            token: 'test-token',
            user: { id: 'user-1', email: 'user@example.com' }
        });
        const onAuthSuccess = vi.fn();
        const onClose = vi.fn();
        vi.useFakeTimers();
        render(<Auth isOpen initialMode onClose={onClose} onAuthSuccess={onAuthSuccess} />);

        fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'user@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'valid-password' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await act(async () => {
            await Promise.resolve();
        });
        expect(screen.getByText('Login Successful!')).toBeInTheDocument();
        await act(async () => {
            vi.advanceTimersByTime(2000);
        });
        expect(onAuthSuccess).toHaveBeenCalledOnce();
        expect(onClose).toHaveBeenCalledOnce();
        vi.useRealTimers();
    });

    it('shows the server message when login is rejected', async () => {
        vi.mocked(apiFetch).mockRejectedValue(new ApiError('Invalid email or password', 401));
        render(<Auth isOpen initialMode onClose={vi.fn()} onAuthSuccess={vi.fn()} />);

        fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'user@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'valid-password' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
        expect(screen.queryByText('Could not connect to the server. Please try again later.')).not.toBeInTheDocument();
    });

    it('shows the connection message when the request cannot reach the server', async () => {
        vi.mocked(apiFetch).mockRejectedValue(new TypeError('Failed to fetch'));
        render(<Auth isOpen initialMode onClose={vi.fn()} onAuthSuccess={vi.fn()} />);

        fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'user@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'valid-password' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        expect(await screen.findByText('Could not connect to the server. Please try again later.')).toBeInTheDocument();
    });

    it('submits a forgot-password request without revealing whether the email exists', async () => {
        vi.mocked(apiFetch).mockResolvedValue({
            message: 'If an account exists for that email, a password reset link will be sent.'
        });
        render(<Auth isOpen initialMode onClose={vi.fn()} onAuthSuccess={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: /forgot password/i }));
        fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'user@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

        expect(await screen.findByRole('status')).toHaveTextContent('If an account exists');
        expect(apiFetch).toHaveBeenCalledWith('/api/auth/forgot-password', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ email: 'user@example.com' })
        }));
    });

    it('opens the reset form from a reset-token link and submits the new password', async () => {
        const previousUrl = window.location.href;
        window.history.replaceState({}, '', '/?resetToken=' + 'a'.repeat(64));
        vi.mocked(apiFetch).mockResolvedValue({ message: 'Password updated. You can now sign in.' });
        render(<Auth isOpen initialMode onClose={vi.fn()} onAuthSuccess={vi.fn()} />);

        fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: 'new-secure-password' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'new-secure-password' } });
        fireEvent.click(screen.getByRole('button', { name: /update password/i }));

        expect(await screen.findByRole('status')).toHaveTextContent('Password updated');
        expect(apiFetch).toHaveBeenCalledWith('/api/auth/reset-password', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ token: 'a'.repeat(64), password: 'new-secure-password' })
        }));
        expect(window.location.search).toBe('');
        window.history.replaceState({}, '', previousUrl);
    });

    it('clears the reset token when closing the auth modal', () => {
        const previousUrl = window.location.href;
        const onClose = vi.fn();
        window.history.replaceState({}, '', '/?resetToken=' + 'b'.repeat(64));
        render(<Auth isOpen initialMode onClose={onClose} onAuthSuccess={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Close authentication dialog' }));

        expect(window.location.search).toBe('');
        expect(onClose).toHaveBeenCalledOnce();
        window.history.replaceState({}, '', previousUrl);
    });
});
