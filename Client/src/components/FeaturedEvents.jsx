import { useState, useMemo } from "react";
import EventCard from "./EventCard/EventCard";
import "./FeaturedEvents.css";
import { getEventDate } from "../utils/eventFormat";

function FeaturedEvents({events, loading, error, onRetry, title, onDeleteEvent, favourites, onToggleFavorite, currentUser}) {
    const [showAll, setShowAll] = useState(false);

    // Sort the events by date using useMemo to avoid unnecessary sorting on every render
    const sortedEvents = useMemo(() => {
        return [...events].sort((a, b) => {
            const dateA = getEventDate(a.date);
            const dateB = getEventDate(b.date);

            // If date parsing fails, default to 0 (no move)
            if (!dateA || !dateB) return 0;
            return dateA - dateB;
        });
    }, [events]);

    const visibleEvents = showAll ? sortedEvents : sortedEvents.slice(0,6);
    return (
        <section id="featured" className="featured-section">
            <div className="section-header">
                <h1>{title || "Featured Events"}</h1>
                <p>Check out our featured events happening this month!</p>
            </div>
            <div className="events-grid">
            {loading ? (
                <div className="loading-spinner-container">
                    <div className="spinner"></div>
                    <p>Loading amazing events...</p>
                </div>
            ) : error ? (
                <div className="no-results">
                    <p>{error}</p>
                    <button className="btn-view-all" onClick={onRetry}>Retry</button>
                </div>
            ) : visibleEvents && visibleEvents.length > 0 ? (
                    visibleEvents.map((event)=>(
                        <EventCard 
                            key={event.id || event._id}
                            id={event.id || event._id}
                            {...event}
                            event={event}
                            creatorId={event.creatorId}
                            currentUser={currentUser}
                            isUserEvent={event.isUserEvent}
                            onDeleteEvent={onDeleteEvent}
                            isFavorited={favourites.includes(event.id || event._id)} 
                            onToggleFavorite={onToggleFavorite}
                        />
                    ))
                ) : (
                    <div className="no-results">
                        <p>No Events Found. Try searching for something else!</p>
                    </div>
                )}
            </div>
            {events.length > 6 && (
                <div className="view-all-container">
                    <button className="btn-view-all" onClick={() => setShowAll(!showAll)}>{showAll ? "Show less" : "See All Events"}</button>
                </div>
            )}
            
        </section>
    );
}

export default FeaturedEvents;
