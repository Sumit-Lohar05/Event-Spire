import { Trash } from "lucide-react";
import './MyTickets.css';
import { useEffect } from "react";

const MyTickets = ({bookedTickets, onCancelBooking}) => {
    useEffect(()=>{
            window.scrollTo(0, 0);
        }, []);
    return(
        <div className="my-tickets-container">
            <h1>My tickets</h1>
            {bookedTickets.length === 0 ? (
                <p>You haven't purchased any tickets yet.</p>
            ) : (
                <div className="tickets-list">
                    {bookedTickets.map((ticket) => (
                        <div key={ticket.bookingId} className="ticket-item">
                            <img src={ticket.eventImage} alt={ticket.eventTitle} />
                            <div className="ticket-info">
                                <h3>{ticket.eventTitle}</h3>
                                <p>{ticket.eventDate}</p>
                                <p>Quantity: {ticket.quantity}</p>
                                <p className="price-tag">Total: ${ticket.totalPaid}</p>
                                <button className="cancel-button" onClick={() => onCancelBooking(ticket)}>
                                    <Trash size={14} />
                                    Cancel Booking
                                </button>
                            </div>
                            <div className="ticket-status">Confirmed</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
export default MyTickets;