import { Trash2, Edit3, Heart } from "lucide-react";
import "./EventCard.css";
import { Link } from "react-router-dom";
function EventCard({id, image, date, title, location, attendees, maxCapacity, price, category, isUserEvent, onDeleteEvent, isFavorited, onToggleFavorite, event, currentUser, creatorId}) {
    const isSoldOut = maxCapacity > 0 && attendees >= maxCapacity;

    const currentUserId = currentUser?._id || currentUser?.id;
    const actualCreatorId = creatorId || event?.creatorId || event?.userId;

    const isOwner = !!(
        currentUserId && 
        actualCreatorId && 
        String(currentUserId) === String(actualCreatorId)
    );
    
    const formatPrice = (val) => {
        if (val === 0 || val === "0" || val === "Free") return "Free";
        if (typeof val === 'number') return `₹${val}`;
        if (typeof val === 'string') {
            // Replace dollar sign with Indian Rupee sign for older database entries
            let formattedVal = val.replace('$', '₹');
            // If it is just a plain number string (e.g. "500"), add the Rupee sign
            if (!isNaN(formattedVal) && formattedVal.trim() !== '') return `₹${formattedVal}`;
            return formattedVal;
        }
        return val; 
    };

    return(
        <div className={`event-card ${isSoldOut ? 'sold-out-blur' : ''}`}>
            {isUserEvent && isOwner &&(
                <div className="admin-actions">
                    <Link 
                        to={`/host-event?edit=${event._id || event.id}`} 
                        className="btn-edit-link"
                        onClick={(e) => e.stopPropagation()} // Prevent card click
                    >
                    <button className="btn-edit" title="Edit Event"><Edit3 size={16} /></button>
                    </Link>
                    <button 
                        className="btn-delete" 
                        title="Delete Event" 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeleteEvent(id);
                        }}
                    ><Trash2 size={16} />
                    </button>
                </div>
            )}
            <div className="card-image">
                {/* Sold Out Badge */}
                {isSoldOut && <div className="sold-out-badge">Sold Out</div>}
                <button
                    className={`wishlist-btn ${isFavorited ? 'active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleFavorite(id);
                    }}
                    title={isFavorited ? "Unfavorite" : "Favorite"}
                >
                    <Heart 
                        size={20} 
                        fill={isFavorited ? "#ef4444" : "none"} 
                        color={isFavorited ? "#ef4444" : "white"} 
                    />

                </button>
                <img src={image} alt={title} />
                <span className="category-tag">{category}</span>
                <div className="date-badge">
                    <span className="month">{date.month}</span>
                    <span className="day">{date.day}</span>
                </div>
            </div>
            <div className="card-content">
                <h3>{title}</h3>
                <p className="location">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>{location}</span></p>
                <p className="attendees">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span>{attendees}{maxCapacity ? ` / ${maxCapacity}` : ''}</span> attending</p>
                <hr />
                <div className="card-footer">
                    <div className="price">
                        <span>Starting from</span>
                        <h4>{formatPrice(price)}</h4>
                    </div>
                    {isSoldOut ? (
                        <button className="btn-ticket disabled" disabled>Sold Out</button>
                    ) : (
                        <Link to={`/event/${id}`} className="ticket-link">
                            <button className="btn-ticket">Buy Ticket</button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
export default EventCard;