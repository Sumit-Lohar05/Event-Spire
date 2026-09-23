import { Link } from 'react-router-dom';
import "./Footer.css";

function Footer(){
    return(
        <footer className="footer">
            <div className="footer-top">
                <div className="footer-brand">
                    <Link to="/" className="logo" aria-label="Go to home page">
                        <img src="/src/assets/logo1.png" alt="EventSpire" />
                    </Link>
                    <p>Your ultimate platform for discovering amazing events and creating unforgettable experiences.</p>
                    <div className="social-links">
                        <a href="#" aria-label="Facebook">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                        </a>

                        <a href="#" aria-label="X">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153zM17.61 20.644h2.039L6.486 3.24H4.298l13.312 17.404z"></path></svg>
                        </a>
                        
                        <a href="#" aria-label="Instagram">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                        </a>
                        
                        <a href="#" aria-label="LinkedIn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1-2 2 2 2 0 0 1 2-2z"></path></svg>
                        </a>
                    </div>
                </div>

                <div className="footer-links">
                    <div className="link-group">
                        <h4>Explore</h4>
                        <ul>
                            <li><a href="/#featured">Browse Events</a></li>
                            <li><a href="/#categories">Categories</a></li>
                            <li><a href="/#featured">Popular Events</a></li>
                        </ul>
                    </div>
                    <div className="link-group">
                        <h4>For Organizers</h4>
                        <ul>
                            <li><a href="/#host">Host an Event</a></li>
                            <li><a href="#">Price</a></li>
                            <li><a href="#">Resources</a></li>
                        </ul>
                    </div>
                    <div className="link-group">
                        <h4>Support</h4>
                        <li><a href="#">Help Center</a></li>
                        <li><a href="#">Contact Us</a></li>
                        <li><a href="#">Privacy Policy</a></li>
                    </div>
                </div>
            </div>
            <div className="newsletter-section">
                <div className="newsletter-content">
                    <div className="newsletter-text">
                        <h3>Stay Updated</h3>
                        <p>Subscribe to our newsletter and get the latest news about upcoming events.</p>
                    </div>
                    <div className="newsletter-form">
                        <input type="email" placeholder="Enter your email" />
                        <button className="btn-subscribe">Subscribe</button>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; 2026 EventSpire. All rights reserved.</p>
                <p>Powered By Sumit Lohar</p>
            </div>
        </footer>
    );
}
export default Footer;