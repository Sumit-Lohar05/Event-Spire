import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FeaturedEvents from './components/FeaturedEvents';
import BrowseCategory from './components/Category/BrowseCategory';
import Steps from './components/Steps';
import HostEvent from './components/HostEvent/HostEvent';
import Footer from './components/Footer/Footer';
import EventDetails from './pages/EventDetails';
import { useEffect, useState } from 'react';
import Auth from './components/Auth/Auth';
import HostEventPage from './components/HostEvent/HostEventPage';
import MyTickets from './components/Tickets/MyTickets';
import SavedEvents from './pages/SavedEvents';
import Profile from './pages/Profile';
import { getEventDate, getEventPrice, isEventExpired } from './utils/eventFormat';
import { ApiError, apiFetch } from './utils/api';

const Home = ({ events, loading, error, onRetry, isLoggedIn, onLoginClick, onDeleteEvent, favourites, onToggleFavorite, currentUser }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedDate, setSelectedDate] = useState("");
    const [priceFilter, setPriceFilter] = useState("All");

    const resetFilters = () =>{
        setSearchQuery("");
        setLocationQuery("");
        setSelectedCategory("All");
        setSelectedDate("");
        setPriceFilter("All");
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setSearchQuery("");
        setLocationQuery("");
        setSelectedDate("");
        setPriceFilter("All");
        const featuredSection = document.getElementById("featured");
        if (featuredSection) {
            featuredSection.scrollIntoView({ behavior: "smooth" });
        }
    };

    const filteredEvents = events.filter(event => {
        if (isEventExpired(event)) return false;

        const matchSearch = 
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchLocation = event.location.toLowerCase().includes(locationQuery.toLowerCase());
        const matchCategory = selectedCategory === "All" || event.category === selectedCategory;
        
        // Date filter
        let matchDate = true;
        if (selectedDate) {
            const eventDate = getEventDate(event.date);
            const filterDate = new Date(selectedDate);
            matchDate = eventDate?.toDateString() === filterDate.toDateString();
        }

        // Price filter
        let matchPrice = true;
        const price = getEventPrice(event.price);
        
        if (priceFilter === "Free") {
            matchPrice = price === 0;
        } else if (priceFilter === "Paid") {
            matchPrice = price > 0;
        } else if (priceFilter === "Under 500") {
            matchPrice = price > 0 && price < 500;
        } else if (priceFilter === "500-1000") {
            matchPrice = price >= 500 && price <= 1000;
        } else if (priceFilter === "1000-2000") {
            matchPrice = price > 1000 && price <= 2000;
        } else if (priceFilter === "Over 2000") {
            matchPrice = price > 2000;
        }

        return matchSearch && matchCategory && matchLocation && matchDate && matchPrice;
    });
    return(
        <>
            <Hero 
                onSearch={setSearchQuery} 
                onLocationSearch={setLocationQuery} 
                onDateSearch={setSelectedDate}
                onPriceSearch={setPriceFilter}
                onReset={resetFilters} 
                searchQuery={searchQuery}
                locationQuery={locationQuery}
                dateQuery={selectedDate}
                priceQuery={priceFilter}
                isFiltered={searchQuery || locationQuery || selectedCategory !== "All" || selectedDate || priceFilter !== "All"}
                isLoggedIn={isLoggedIn}
                onLoginClick={onLoginClick}
            />
            <FeaturedEvents 
                events={filteredEvents}
            loading={loading}
                error={error}
                onRetry={onRetry}
                onDeleteEvent={onDeleteEvent}
                favourites={favourites}
                onToggleFavorite={onToggleFavorite}
                currentUser={currentUser}
                title={searchQuery || locationQuery ? `Results for ${searchQuery} ${locationQuery ? `in ${locationQuery}` : ''}` : "Featured Events"} 
            />
            <BrowseCategory 
            onSelectCategory={handleCategorySelect}
                activeCategory={selectedCategory}
            />
            <Steps />
            <HostEvent isLoggedIn={isLoggedIn} onLoginClick={onLoginClick} />
        </>
    )
}
function App() {

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [eventsError, setEventsError] = useState('');

    const loadEvents = async () => {
        setLoading(true);
        setEventsError('');
        try {
            const data = await apiFetch('/api/events');
            setEvents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching events:", error);
            setEventsError('Events could not be loaded. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const [bookedTickets, setBookedTickets] = useState(() => {
        const saved = localStorage.getItem("bookedTickets");
        return saved ? JSON.parse(saved) : [];
    });
    const [isAuthOpen, setIsAuthOpen] = useState(() => new URLSearchParams(window.location.search).has('resetToken'));
    const [authMode, setAuthMode] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authReady, setAuthReady] = useState(false);
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser && savedUser !== "undefined" ? JSON.parse(savedUser) : null;
    });

    const clearAuthState = () => {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setBookedTickets([]);
        setFavourites([]);
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("bookedTickets");
        localStorage.removeItem("favourites");
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            clearAuthState();
            setAuthReady(true);
            return;
        }

        apiFetch('/api/auth/me')
            .then(({ user }) => {
                setCurrentUser(user);
                setIsLoggedIn(true);
                setBookedTickets(user.bookedTickets || []);
                setFavourites(user.favourites || []);
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('user', JSON.stringify(user));
            })
            .catch(error => {
                console.error('Session validation failed:', error);
                clearAuthState();
            })
            .finally(() => setAuthReady(true));
    }, []);

    useEffect(() => {
        let invalidationInProgress = false;
        const handleUnauthorized = () => {
            if (invalidationInProgress) return;
            invalidationInProgress = true;
            clearAuthState();
            window.setTimeout(() => {
                invalidationInProgress = false;
            }, 0);
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, []);

    // Protected Route Component(checks if user is logged in)
    const ProtectedRoute = ({ isLoggedIn, authReady, children }) => {
        if (!authReady) {
            return <div className="loading">Checking your session...</div>;
        }
        if (!isLoggedIn) {
            return <Navigate to="/" replace />;
        }
        return children;
    }

    useEffect(() => {
        localStorage.setItem("bookedTickets", JSON.stringify(bookedTickets));
    }, [bookedTickets]);

    const handleLogin = () => {
        setAuthMode(true);
        setIsAuthOpen(true);
    };
    const handleSignup = () => {
        setAuthMode(false);
        setIsAuthOpen(true);
    };

    const handleAuthSuccess = (userData) => {
        setIsLoggedIn(true);
        setCurrentUser(userData.user);

        // Save basic auth info
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", JSON.stringify(userData.user));
        localStorage.setItem("token", userData.token);

        if(userData.user.bookedTickets){
            setBookedTickets(userData.user.bookedTickets);
            localStorage.setItem("bookedTickets", JSON.stringify(userData.user.bookedTickets));
        }
        if(userData.user.favourites){
            setFavourites(userData.user.favourites);
            localStorage.setItem("favourites", JSON.stringify(userData.user.favourites));
        }
    };

    const handleLogout = () => {
        clearAuthState();
        showToast("Logged out successfully!");
    };

    const [toast, setToast] = useState({ show: false, message: "" });

    const showToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: "" }), 3000);
    };

    const addEvent = async (newEvent) => {
        try {
            const savedEvent = await apiFetch('/api/events', {
                method: 'POST',
                body: JSON.stringify({
                    ...newEvent,
                    id: `event-${Date.now()}`,
                    isUserEvent: true
                })
            });
            setEvents(prevEvents => [savedEvent, ...prevEvents]);
            showToast("Event Published Successfully!");
            return savedEvent;
        } catch (error) {
            console.error("Error adding event:", error);
            showToast("Server error. Try again later.");
        }
        return null;
    };

    const updateEvent = async (eventId, updatedEvent) => {
        try {
            const data = await apiFetch(`/api/events/${eventId}`, {
                method: 'PATCH',
                body: JSON.stringify(updatedEvent)
            });
            setEvents(prevEvents => prevEvents.map(event =>
                String(event._id || event.id) === String(data._id || data.id) ? data : event
            ));
            showToast("Event updated successfully!");
            return data;
        } catch (error) {
            console.error("Error updating event:", error);
            showToast("Server error. Try again later.");
            return null;
        }
    };

    const deleteEvent = async (id) => {
        if(window.confirm("Are you sure you want to delete this event?")){
            try {
                await apiFetch(`/api/events/${id}`, {
                    method: 'DELETE',
                });
                setEvents(prevEvents => prevEvents.filter(event => (event._id || event.id) !== id));
                showToast("Event deleted successfully!");
            } catch (error){
                console.error("Error deleting event:", error);
                showToast("Connection error. Try again later.");
            }
        }
    };

    // Function to handle booking
    const handleBookTickets = (booking, updatedEvent) => {
        if (isLoggedIn && booking && updatedEvent) {
            const eventIds = new Set([booking.eventId, updatedEvent.id, updatedEvent._id].filter(Boolean).map(String));
            setBookedTickets(prev => [
                ...prev.filter(ticket => !eventIds.has(String(ticket.eventId))),
                booking
            ]);
            setEvents(prevEvents => prevEvents.map(event =>
                (event._id === updatedEvent._id || event.id === updatedEvent.id) ? updatedEvent : event
            ));
        }
    };

    const cancelBooking = async (booking) => {
        console.log("Attempting to cancel booking:", booking);
        if (!booking.eventId) {
            console.error("CRITICAL ERROR: This ticket has no eventId attached!");
            showToast("Error: Ticket data is missing the Event ID.");
            return;
        }
        try {
            const data = await apiFetch('/api/events/cancel', {
                method: 'POST',
                body: JSON.stringify({
                    eventId: booking.eventId,
                    ticketQuantity: booking.quantity,
                    bookingId: booking.bookingId
                }),
            });
            setBookedTickets(prev => prev.filter(t => t.bookingId !== booking.bookingId));
            setEvents(prevEvents => prevEvents.map(event => {
                const eventId = String(event._id || event.id);
                const updatedId = String(data.event._id || data.event.id);
                return eventId === updatedId ? data.event : event;
            }));
            showToast("Booking cancelled successfully!");
        } catch (error){
            console.error("Cancellation error:", error);
            showToast("Failed to cancel booking on server. Try again later.");
        }
    };

    // Favorite Events State 
    const [favourites, setFavourites] = useState(() => {
        const saved = localStorage.getItem("favourites");
        return saved ? JSON.parse(saved) : [];
    });
    useEffect(() => {
        localStorage.setItem("favourites", JSON.stringify(favourites));
    }, [favourites]);

    const toggleFavourite = async (eventId) => {
        const isRemoving = favourites.includes(eventId);
        const updatedFavourites = isRemoving 
            ? favourites.filter(id => id !== eventId) 
            : [...favourites, eventId];

        setFavourites(updatedFavourites);

        if(isLoggedIn && currentUser){
            try {
                await apiFetch('/api/users/update-favourites', {
                    method: 'PATCH',
                    body: JSON.stringify({ favourites: updatedFavourites })
                });
            } catch(error) {
                console.error("Database sync failed:", error);
                setFavourites(favourites);
                if (error instanceof ApiError && error.status === 401) clearAuthState();
                showToast("Could not save favourite to account");
            }
        }
    };

    const clearAllFavourites = async () => {
        if(window.confirm("Are you sure you want to clear all saved events?")){
            const previousFavourites = favourites;
            setFavourites([]);
            if (isLoggedIn) {
                try {
                    await apiFetch('/api/users/update-favourites', {
                        method: 'PATCH',
                        body: JSON.stringify({ favourites: [] })
                    });
                } catch {
                    setFavourites(previousFavourites);
                    showToast("Could not clear saved events from your account.");
                    return;
                }
            }
            showToast("All saved events cleared!");
        }
    };

    const handleUpdateProfile = async (updatedData) => {
        // Assuming your backend will have an endpoint at /api/users/update-profile
        try {
            const updatedUser = await apiFetch('/api/users/update-profile', {
                method: 'PATCH',
                body: JSON.stringify(updatedData)
            });
            setCurrentUser(updatedUser.user);
            localStorage.setItem("user", JSON.stringify(updatedUser.user));
            showToast("Profile updated successfully!");
        } catch (error) {
            console.error("Profile update error:", error);
            showToast("Connection error while updating profile.");
        }
    };

    return(
        <Router>
            <div className='app-container'>
                {toast.show && <div className="toast-notification">{toast.message}</div>}
                <Navbar 
                    onLoginClick={handleLogin} 
                    onSignupClick={handleSignup}
                    isLoggedIn={isLoggedIn} 
                    onLogout={handleLogout}
                    favourites={favourites}
                    currentUser={currentUser}
                />
                <Auth key={`${isAuthOpen}-${authMode}`} isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} initialMode={authMode} onAuthSuccess={handleAuthSuccess} />
                <Routes>
                    <Route 
                        path='/' 
                        element={<Home events={events} loading={loading} error={eventsError} onRetry={loadEvents} onDeleteEvent={deleteEvent} isLoggedIn={isLoggedIn} onLoginClick={handleLogin} favourites={favourites} onToggleFavorite={toggleFavourite} currentUser={currentUser} />} />
                    <Route 
                        path='/event/:id' 
                        element={<EventDetails events={events} eventsLoading={loading} onBookTickets={handleBookTickets} onShowToast={showToast} isLoggedIn={isLoggedIn} onLoginClick={handleLogin} />} />
                    <Route
                        path='/host-event'
                        element={<ProtectedRoute isLoggedIn={isLoggedIn} authReady={authReady}><HostEventPage onAddEvent={addEvent} onUpdateEvent={updateEvent} events={events} currentUser={currentUser}/></ProtectedRoute>}
                    />
                    <Route
                        path='/my-tickets'
                        element={<ProtectedRoute isLoggedIn={isLoggedIn} authReady={authReady}><MyTickets bookedTickets={bookedTickets.filter(t => String(t.userId) === String(currentUser?.id || currentUser?._id))} onCancelBooking={cancelBooking} /></ProtectedRoute>}
                    />
                     <Route 
                        path='/saved'
                        element={
                            <ProtectedRoute isLoggedIn={isLoggedIn} authReady={authReady}>
                            <SavedEvents
                                events={events}
                                favourites={favourites}
                                onToggleFavorite={toggleFavourite}
                                onDeleteEvent={deleteEvent}
                                onClearEvents={clearAllFavourites}
                                currentUser={currentUser}
                            />
                            </ProtectedRoute>
                        }
                     />
                     <Route 
                        path='/profile'
                        element={
                            <ProtectedRoute isLoggedIn={isLoggedIn} authReady={authReady}>
                            <Profile
                                currentUser={currentUser}
                                onUpdateProfile={handleUpdateProfile}
                                bookedTickets={bookedTickets.filter(t => String(t.userId) === String(currentUser?.id || currentUser?._id))}
                                favourites={favourites}
                                events={events}
                            />
                            </ProtectedRoute>
                        }
                     />
                </Routes>
                <Footer />
            </div>
        </Router>
    );
}

export default App;