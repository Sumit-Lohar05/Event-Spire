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

const Home = ({ events, loading, isLoggedIn, onLoginClick, onDeleteEvent, favourites, onToggleFavorite, currentUser }) => {
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

    const filteredEvents = events.filter(event =>{
        const matchSearch = 
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchLocation = event.location.toLowerCase().includes(locationQuery.toLowerCase());
        const matchCategory = selectedCategory === "All" || event.category === selectedCategory;
        
        // Date filter
        let matchDate = true;
        if (selectedDate) {
            const eventDate = new Date(`${event.date.month} ${event.date.day}, ${event.date.year}`);
            const filterDate = new Date(selectedDate);
            matchDate = eventDate.toDateString() === filterDate.toDateString();
        }

        // Price filter
        let matchPrice = true;
        const price = typeof event.price === 'number' ? event.price : 
                      (event.price === "Free" || !event.price ? 0 : parseInt(event.price.replace(/[^0-9.]/g, '')) || 0);
        
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

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/events');
                const data = await response.json();
                setEvents(data);
            } catch (error){
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const [bookedTickets, setBookedTickets] = useState(() => {
        const saved = localStorage.getItem("bookedTickets");
        return saved ? JSON.parse(saved) : [];
    });
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return localStorage.getItem("isLoggedIn") === "true";
    });
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser && savedUser !== "undefined" ? JSON.parse(savedUser) : null;
    });

    // Protected Route Component(checks if user is logged in)
    const ProtectedRoute = ({ isLoggedIn, children }) => {
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
        setIsLoggedIn(false);
        setCurrentUser(null);
        setBookedTickets([]);
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("bookedTickets");
        localStorage.removeItem("favourites");
        showToast("Logged out successfully!");
    };

    const [toast, setToast] = useState({ show: false, message: "" });

    const showToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: "" }), 3000);
    };

    const addEvent = async (newEvent) => {
        try {
            const response = await fetch('http://localhost:5000/api/events', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...newEvent,
                    id: `event-${Date.now()}`,
                    isUserEvent: true
                })
            });
            if(response.ok){
                const savedEvent = await response.json();
                setEvents([savedEvent, ...events]);
                showToast("Event Published Successfully!");
            } else {
                showToast("Failed to publish event. Please try again.");
            }
        } catch (error) {
            console.error("Error adding event:", error);
            showToast("Server error. Try again later.");
        }
    };

    const deleteEvent = async (id) => {
        if(window.confirm("Are you sure you want to delete this event?")){
            try {
                const response = await fetch(`http://localhost:5000/api/events/${id}`, {
                    method: 'DELETE',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ userId: currentUser?.id || currentUser?._id })
                });
                if(response.ok){
                    setEvents(events.filter(event => (event._id || event.id) !== id));
                    showToast("Event deleted successfully!");
                } else {
                    showToast("Could not delete event. Please try again.");
                }
            } catch (error){
                console.error("Error deleting event:", error);
                showToast("Connection error. Try again later.");
            }
        }
    };

    // Function to handle booking
    const handleBookTickets = async (bookingInfo, updatedEvent) => {
        const personalizedBooking = {
            ...bookingInfo,
            userId: currentUser?.id || currentUser?._id
        };
        if(isLoggedIn){
            try { 
                const response = await fetch('http://localhost:5000/api/users/book-ticket', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        userId: personalizedBooking.userId,
                        booking: personalizedBooking
                    })
                });
                if(response.ok){
                    setBookedTickets(prev => [...prev, personalizedBooking]);
                    setEvents(prevEvents => prevEvents.map(event => 
                        (event._id === updatedEvent._id || event.id === updatedEvent.id) ? updatedEvent : event
                    ));
                } 
            } catch (error){
                console.error("Booking synced failed:", error);
                showToast("Failed to save ticket to your account.");
            }
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
            const response = await fetch('http://localhost:5000/api/events/cancel', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    eventId: booking.eventId,
                    ticketQuantity: booking.quantity,
                    userId: currentUser?.id || currentUser?._id,
                    bookingId: booking.bookingId
                }),
            });
            if(response.ok){
                const data = await response.json();
                setBookedTickets(prev => prev.filter(t => t.bookingId !== booking.bookingId));
                setEvents(prevEvents => prevEvents.map(event => {
                    const eventId = String(event._id || event.id);
                    const updatedId = String(data.event._id || data.event.id);
                    
                    return eventId === updatedId ? data.event : event;
                }));
                showToast("Booking cancelled successfully!");
            }
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
                const response = await fetch('http://localhost:5000/api/users/update-favourites',{
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        userId: currentUser.id || currentUser._id,
                        favourites: updatedFavourites
                    })
                });
                if(!response.ok){
                    throw new Error("Failed to sync favourites");
                }      
            } catch(error) {
                console.error("Database sync failed:", error);
                showToast("Could not save favourite to account");
            }
        }
    };

    const clearAllFavourites = () => {
        if(window.confirm("Are you sure you want to clear all saved events?")){
            setFavourites([]);
            showToast("All saved events cleared!");
        }
    };

    const handleUpdateProfile = async (updatedData) => {
        // Assuming your backend will have an endpoint at /api/users/update-profile
        try {
            const response = await fetch('http://localhost:5000/api/users/update-profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ userId: currentUser?.id || currentUser?._id, ...updatedData })
            });
            if (response.ok) {
                const updatedUser = await response.json();
                setCurrentUser(updatedUser.user);
                localStorage.setItem("user", JSON.stringify(updatedUser.user));
                showToast("Profile updated successfully!");
            } else {
                const errorData = await response.json().catch(() => ({}));
                showToast(`Failed to update: ${errorData.message || 'Server error'}`);
            }
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
                <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} initialMode={authMode} onAuthSuccess={handleAuthSuccess} />
                <Routes>
                    <Route 
                        path='/' 
                        element={<Home events={events} loading={loading} onDeleteEvent={deleteEvent} isLoggedIn={isLoggedIn} onLoginClick={handleLogin} favourites={favourites} onToggleFavorite={toggleFavourite} currentUser={currentUser} />} />
                    <Route 
                        path='/event/:id' 
                        element={<EventDetails events={events} onBookTickets={handleBookTickets} onShowToast={showToast} currentUser={currentUser} />} />
                    <Route
                        path='/host-event'
                        element={<ProtectedRoute isLoggedIn={isLoggedIn}><HostEventPage onAddEvent={addEvent} currentUser={currentUser}/></ProtectedRoute>}
                    />
                    <Route
                        path='/my-tickets'
                        element={<ProtectedRoute isLoggedIn={isLoggedIn}><MyTickets bookedTickets={bookedTickets.filter(t => String(t.userId) === String(currentUser?.id || currentUser?._id))} onCancelBooking={cancelBooking} /></ProtectedRoute>}
                    />
                     <Route 
                        path='/saved'
                        element={
                            <ProtectedRoute isLoggedIn={isLoggedIn}>
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
                            <ProtectedRoute isLoggedIn={isLoggedIn}>
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