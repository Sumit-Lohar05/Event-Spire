import React, { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Share2, Check } from "lucide-react";
import './EventDetails.css';
import { HashLink } from "react-router-hash-link";
import { getEventDate, getEventPrice, isEventExpired } from "../utils/eventFormat";
import { ApiError, apiFetch } from "../utils/api";
// import { eventsData } from "../data/event";

const getTimeLeft = (event) => {
    if(!event?.date) return {};

    const targetDate = getEventDate(event.date);
    if (!targetDate) return {};
    const difference = targetDate - new Date();
    if (difference <= 0) return {};

    return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
    };
};

const EventDetails = ({events, eventsLoading, onBookTickets, onShowToast, isLoggedIn, onLoginClick}) => {
    const {id} = useParams();
    const [loadedEvent, setLoadedEvent] = useState(null);
    const event = loadedEvent || events.find((item) => (item.id === id || item._id === id));

    useEffect(() => {
        let cancelled = false;
        const listedEvent = events.find((item) => item.id === id || item._id === id);
        if (listedEvent || eventsLoading) {
            setIsFetchingEvent(false);
            return undefined;
        }

        const fetchEvent = async () => {
            setIsFetchingEvent(true);
            try {
                const data = await apiFetch(`/api/events/${id}`);
                if (!cancelled) setLoadedEvent(data);
            } catch (error) {
                console.error("Error fetching event:", error);
                if (!cancelled) setLoadedEvent(null);
            } finally {
                if (!cancelled) setIsFetchingEvent(false);
            }
        };
        fetchEvent();
        return () => { cancelled = true; };
    }, [events, eventsLoading, id]);

    const [isFetchingEvent, setIsFetchingEvent] = useState(false);

    // Event Expiration Check
    const [isCopied, setIsCopied] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPurchased, setIsPurchased] = useState(false);
    const [ticketCount, setTicketCount] = useState(1);

    const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(event));

    useEffect(() => {
        if (!event?.date) return;
        const timer = setInterval(() => {
            setTimeLeft(getTimeLeft(event));
        }, 1000);

        return () => clearInterval(timer);
    }, [event]);

    useEffect(()=>{
        window.scrollTo(0, 0);
    }, []);

    if (eventsLoading || isFetchingEvent || (!event && events.length === 0)) {
        return <div className="loading">Loading event details...</div>;
    }
    if(!event){
        return (
            <div className="error">
                <h1>404 - Page Not Found</h1>
                <p>The requested page could not be found.</p>
                <HashLink smooth to="/#featured">Return to Events</HashLink>
            </div>
        )
    }

    // Safety check for price parsing
    const numericPrice = getEventPrice(event.price);
    const totalPrice = numericPrice * ticketCount; 
    const remainingSpots = event.maxCapacity -  event.attendees;
    const isSoldOut = event.attendees >= event.maxCapacity;
    

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    
    const handleCheckout = () => {
        if (!isLoggedIn) {
            onLoginClick?.();
            return;
        }
        setIsModalOpen(true);
    }

    const handleConfirmPurchase = async () => {
        const bookingId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        try {
            const data = await apiFetch('/api/events/purchase', {
                method: 'POST',
                body: JSON.stringify({
                    eventId: event._id || event.id,
                    ticketQuantity: ticketCount,
                    bookingId
                }),
            });
            setIsPurchased(true); // Show the success state first
            onBookTickets(data.booking, data.event); // Send the server-created booking to App.jsx
            setTimeout(() => {
                setIsModalOpen(false);
                setIsPurchased(false);
                onShowToast(`Booking confirmed for ${event.title}!`);
            }, 2000);
        } catch (error) {
            console.error('Error during purchase:', error);
            if (error instanceof ApiError && error.status === 401) {
                setIsModalOpen(false);
                onLoginClick?.();
                return;
            }
            alert(error instanceof ApiError ? error.message : 'Server error. Please try again later.');
        }    
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsPurchased(false);
    };

    const expired = isEventExpired(event);

    return(
        <div className="event-details-page">
            <div className="details-hero" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.7), #0a0a0a), url(${event.image})` }}>
                <div className="back-navigation">
                    <HashLink smooth to="/#featured" className="back-link" >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        Back to Events
                    </HashLink>
                </div>
                <span className="category-badge">{event.category}</span>
                <h1 className="event-title">{event.title}</h1>
                <div className="share-container">
                    <button className="share-btn" onClick={handleShare}>
                        {isCopied ? (
                            <>
                                <Check size={18} />
                                Copied
                            </>
                        ) : (
                            <>
                                <Share2 size={18} />
                                Share Event
                            </>
                        )}
                    </button>
                </div>
                <div className="meta-info">
                    <span>{event.location}</span>
                    <span>|</span>
                    <span>{event.date.month} {event.date.day} {event.date.year}</span>
                </div>
            </div>
            <div className="details-contents">
                <div className="description-section">
                    <div className="countdown-timer">
                        <h3>{expired ? 'Event Status' : 'Event Starts In:'}</h3>
                        {expired ? (
                            <div className="expired-message">This event has already started or ended.</div>
                        ) : (
                            <div className="timer-grid">
                                <div className="timer-item">
                                    <span>{timeLeft.days || '0'}</span>
                                    <small>Days</small>
                                </div>
                                <div className="timer-item">
                                    <span>{timeLeft.hours || '0'}</span>
                                    <small>Hours</small>
                                </div>
                                <div className="timer-item">
                                    <span>{timeLeft.minutes || '0'}</span>
                                    <small>Minutes</small>
                                </div>
                                <div className="timer-item">
                                    <span>{timeLeft.seconds || '0'}</span>
                                    <small>Seconds</small>
                                </div>
                            </div>
                        )}
                    </div>
                    <h2>About This Event</h2>
                    <p>{event.description || 'Event details will be announced by the organizer.'}</p>
                </div>
                <div className="ticket-card">
                    <h3>Ticket Summary</h3>
                    <div className="quantity-selector">
                        <span>Quantity</span>
                        <div className="counter-controls">
                            <button onClick={() => setTicketCount(Math.max(1, ticketCount-1))}>-</button>
                            <span>{ticketCount}</span>
                            <button onClick={() => setTicketCount(Math.min(remainingSpots, ticketCount+1))} disabled={ticketCount >= remainingSpots}>+</button>
                        </div>
                    </div>
                    <div className="price-row">
                        <span>Standard Entry</span>
                        <span>{numericPrice === 0 ? "Free" : `₹${totalPrice.toFixed(2)}`}</span>
                    </div>
                    <p className="spots-left">
                        {isSoldOut ? "Sold Out" : `${remainingSpots} spots left`}
                    </p>
                    <button 
                        className={`checkout-btn ${(expired || isSoldOut) ? 'disabled' : ''}`} 
                        onClick={handleCheckout} 
                        disabled={expired || isSoldOut}>
                        {expired ? "Event Expired" : isSoldOut ? "Sold Out" : "Proceed to Checkout"}
                    </button>
                    {isModalOpen && (
                        <div className="modal-overlay" onClick={handleCloseModal}>
                            <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
                                {!isPurchased ? (
                                    <>
                                        <h2>Order Summary</h2>
                                        <div className="summary-details">
                                            <p><strong>Event: </strong>{event.title}</p>
                                            <p><strong>Tickets: </strong> {ticketCount}</p>
                                            <p><strong>Total Price: </strong> ₹{totalPrice.toFixed(2)}</p>
                                        </div>
                                        <div className="modal-actions">
                                            <button className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
                                            <button className="confirm-btn" onClick={handleConfirmPurchase}>Confirm Purchase</button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="success-view">
                                        <div className="success-animation">
                                            <Check size={40} color="#10b981" />
                                        </div>
                                        <h2>Purchase Successful!</h2>
                                        <p>Redirecting you back to event details...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default EventDetails;