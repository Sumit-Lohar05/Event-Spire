import React from 'react';
import { CheckCircle } from 'lucide-react'; 
import './HostEvent.css';
import { useNavigate } from 'react-router-dom';
function HostEvent({isLoggedIn, onLoginClick}){
    const navigate = useNavigate();
    const handleStartHosting = () => {
        if (isLoggedIn) {
            navigate('/host-event');
        } else {
            onLoginClick();
        }
    };
    const benefits = [
        "Easy ticket management & sales tracking",
        "Secure payment processing & payouts",
        "Marketing tools to boost event visibility",
        "Real-time analytics & attendee insights",
    ];
    return(
        <section id='host' className='host-section'>
            <div className="host-container">
                <div className="host-content">
                    <span className='host-badge'>FOR EVENT ORGANIZERS</span>
                    <h1>Ready to Host Your Own Event?</h1>
                    <p>Join our platform and take advantage of our powerful tools to create, manage, and promote your events with ease.
                        Our user-friendly interface makes it easy for you to set up your event details, including dates, locations,
                        ticket prices, and more.
                    </p>
                    <ul className='benefits-list'>
                        {benefits.map((benefit, index) =>(
                            <li key={index}>
                                <CheckCircle className='check-icon' size={20}/>
                                {benefit}
                            </li>
                        ))}
                    </ul>
                    <div className="host-btns">
                        <button className='btn-start-hosting' onClick={handleStartHosting}>Start Hosting</button>
                        <button className='btn-learn-more'>Learn More</button>
                    </div>
                </div>
                <div className="host-image-wrapper">
                    <img src="https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800" 
                        alt="Event Hosting Image" 
                        className='host-image'
                    />
                    <div className="stat-card organizer-stat">
                        <h4>15K+</h4>
                        <p>Active Organizers</p>
                    </div>
                    <div className="stat-card revenue-stat">
                        <h4>$2.5M+</h4>
                        <p>Total Revenue Generated</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default HostEvent;