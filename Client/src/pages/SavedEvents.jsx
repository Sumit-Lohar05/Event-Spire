import { HashLink } from "react-router-hash-link";
import EventCard from "../components/EventCard/EventCard";
import './SavedEvents.css';
import { Trash2 } from "lucide-react";
import { useEffect } from "react";

const SavedEvents = ({ events, favourites, onToggleFavorite, onDeleteEvent, onClearEvents, currentUser }) => {
    const savedList = events.filter(event => favourites.includes(event.id));
    
    useEffect(()=>{
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="saved-events-page" style={{ padding: '120px 20px', minHeight: '80vh' }}>
            <div className="saved-header">
                <h1 className="section-title">Your Wishlist</h1>
                {savedList.length > 0 && (
                    <button className="btn-clear-all" onClick={onClearEvents}>
                        <Trash2 size={18} />
                        <span>Clear All</span>
                    </button>
                )}
            </div>
            {savedList.length === 0 ? (
                <div className="empty-saved-state">
                    <div className="empty-icon">❤️</div>
                    <p className="no-results">Your wishlist is empty. Start hearting events!</p>
                    <HashLink smooth to="/#featured" className="btn-explore">Explore Events</HashLink>
                </div>
            ) : (
                <>
                <div className="saved-events-grid">
                    {savedList.map(event => (
                        <EventCard
                            key={event.id}
                            {...event}
                            event={event}
                            currentUser={currentUser}
                            isUserEvent={event.isUserEvent}
                            creatorId={event.creatorId}
                            isFavorited={true}
                            onToggleFavorite={onToggleFavorite}
                            onDeleteEvent={onDeleteEvent}
                        />
                    ))}
                </div>
                <div className="explore-more-container">
                    <HashLink smooth to="/#featured" className="btn-explore">Explore More Events</HashLink>
                </div>
                </>
            )}
        </div>
    );
}

export default SavedEvents;