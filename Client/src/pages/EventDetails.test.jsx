import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EventDetails from './EventDetails';
import { ApiError, apiFetch } from '../utils/api';

vi.mock('../utils/api', async (importOriginal) => ({
    ...await importOriginal(),
    apiFetch: vi.fn()
}));

vi.mock('../utils/eventFormat', () => ({
    getEventDate: () => new Date('2099-10-12T00:00:00'),
    getEventPrice: () => 120,
    isEventExpired: () => false
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
});

const event = {
    id: 'event-123',
    title: 'Future Test Event',
    category: 'Tech',
    location: 'Jaipur, India',
    date: { month: 'Oct', day: '12', year: '2099' },
    image: '/event.jpg',
    description: 'A test event.',
    price: '120',
    maxCapacity: 20,
    attendees: 0
};

const renderEventDetails = ({ isLoggedIn = false, onLoginClick = vi.fn() } = {}) => {
    const result = render(
        <MemoryRouter initialEntries={['/event/event-123']}>
            <Routes>
                <Route
                    path="/event/:id"
                    element={
                        <EventDetails
                            events={[event]}
                            eventsLoading={false}
                            isLoggedIn={isLoggedIn}
                            onLoginClick={onLoginClick}
                            onBookTickets={vi.fn()}
                            onShowToast={vi.fn()}
                        />
                    }
                />
            </Routes>
        </MemoryRouter>
    );
    return { ...result, onLoginClick };
};

describe('EventDetails checkout authentication', () => {
    it('opens sign-in instead of checkout for a logged-out user', () => {
        const { onLoginClick } = renderEventDetails();

        fireEvent.click(screen.getByRole('button', { name: 'Proceed to Checkout' }));

        expect(onLoginClick).toHaveBeenCalledOnce();
        expect(screen.queryByText('Order Summary')).not.toBeInTheDocument();
        expect(apiFetch).not.toHaveBeenCalled();
    });

    it('opens sign-in if the session expires during purchase confirmation', async () => {
        const onLoginClick = vi.fn();
        vi.mocked(apiFetch).mockRejectedValue(new ApiError('No token, authorization denied', 401));
        const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
        renderEventDetails({ isLoggedIn: true, onLoginClick });

        fireEvent.click(screen.getByRole('button', { name: 'Proceed to Checkout' }));
        fireEvent.click(screen.getByRole('button', { name: 'Confirm Purchase' }));

        await waitFor(() => expect(onLoginClick).toHaveBeenCalledOnce());
        expect(screen.queryByText('Order Summary')).not.toBeInTheDocument();
        expect(alert).not.toHaveBeenCalled();
    });
});