import { useEffect, useState, useRef } from 'react';
import { Menu, X, User, ChevronDown, Ticket, Heart, LogOut } from 'lucide-react';
import './Navbar.css';
import { HashLink } from 'react-router-hash-link';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import defaultProfile from '../assets/profile.jpg';

// Custom hook to handle clicks outside a referenced element
function useClickOutside(handler) {
    const domNode = useRef();
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (domNode.current && !domNode.current.contains(event.target)) {
                handler();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handler]);
    return domNode;
}

function Navbar({onLoginClick, onSignupClick, isLoggedIn, onLogout, favourites, currentUser}) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const profileImage = currentUser?.profilePicture && String(currentUser.profilePicture).trim() ? currentUser.profilePicture : defaultProfile;

    const handleLinkClick = () => {
        setIsOpen(false);
    };
    const handleHostEventClick = (e) => {
      e.preventDefault();
      if(isLoggedIn){
        navigate('/host-event');
      }else{
        onLoginClick();
      }
      setIsOpen(false);
    };

    // Close profile menu when clicking outside
    const profileMenuRef = useClickOutside(() => {
        setIsProfileOpen(false);
    });

    // Scroll spy for active navigation links
    useEffect(() => {
        if (location.pathname !== '/') {
            setActiveSection('');
            return;
        }

        const handleScroll = () => {
            const sections = ['featured', 'categories', 'steps'];
            let current = '';
            
            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    // Check if section is currently near the top of the viewport
                    if (rect.top <= window.innerHeight / 3 && rect.bottom >= 150) {
                        current = section;
                    }
                }
            }
            setActiveSection(current);
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Trigger immediately to set initial state
        
        return () => window.removeEventListener('scroll', handleScroll);
    }, [location.pathname]);

    return (
      <nav className="navbar">
        <Link to="/" className="logo" aria-label="Go to home page">
          <img src="/src/assets/logo1.png" alt="EventSpire" />
        </Link>

        <div className="menu-icon" onClick={() => setIsOpen(true)}>
          <Menu size={28}/>
        </div>

        {isOpen && <div className="nav-overlay" onClick={() => setIsOpen(false)}></div>}

        <ul className={`nav-links ${isOpen ? 'active' : ''}`}>
            <li className="mobile-only close-menu" onClick={() => setIsOpen(false)}>
                <X size={28} />
            </li>
            <li><HashLink smooth to="/#featured" className={location.pathname === '/' && activeSection === 'featured' ? 'active' : ''} onClick={handleLinkClick}>Browse Events</HashLink></li>
            <li><HashLink smooth to="/#categories" className={location.pathname === '/' && activeSection === 'categories' ? 'active' : ''} onClick={handleLinkClick}>Categories</HashLink></li>
            <li><HashLink smooth to="/#steps" className={location.pathname === '/' && activeSection === 'steps' ? 'active' : ''} onClick={handleLinkClick}>How It Works</HashLink></li>
            {isLoggedIn && (
              <>
                <li className="mobile-only"><NavLink to="/profile" onClick={handleLinkClick}>My Profile</NavLink></li>
                <li><NavLink to="/my-tickets" onClick={handleLinkClick}>My Tickets</NavLink></li>
                {/* <li><NavLink to="/saved" onClick={handleLinkClick}>Saved Events ({favourites.length})</NavLink></li> */}
              </>
            )}
            <li>
                <span 
                    className={`nav-link-item ${location.pathname === '/host-event' ? 'active' : ''}`} 
                    onClick={handleHostEventClick} 
                    style={{cursor: 'pointer'}}
                >
                        Host Event
                </span>
            </li>
            {isLoggedIn ? (
              <li className='mobile-only logout-link' onClick={() => { onLogout(); setIsOpen(false); }}>
                  Logout
              </li>
            ) : (
              <li className='mobile-only'><HashLink smooth to="#/sign-in" onClick={() => { onLoginClick(); setIsOpen(false); }}>Sign In</HashLink></li>
            )}
            
        </ul>

        <div className="nav-btns desktop-only">
          {isLoggedIn ? (
            /* Desktop Profile Menu */
            <div className="profile-menu-container" ref={profileMenuRef}>
                <button className='btn-profile' onClick={() => setIsProfileOpen(!isProfileOpen)}>
                    <img
                        src={profileImage}
                        alt="Profile"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = defaultProfile;
                        }}
                        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span>Account</span>
                    <ChevronDown size={14} className={isProfileOpen ? 'rotate' : ''} />
                </button>
                
                {isProfileOpen && (
                    <div className="profile-dropdown">
                        <div className="dropdown-header">
                            <p className='user-name'>Hi, {currentUser?.username || "Guest"}</p>
                        </div>
                        <Link to="/profile" onClick={() => setIsProfileOpen(false)}>
                            <User size={16} /><span>My Profile</span>
                        </Link>
                        <Link to="/my-tickets" onClick={() => setIsProfileOpen(false)}>
                            <Ticket size={16} /><span>My Tickets</span>
                        </Link>
                        <Link to="/saved" onClick={() => setIsProfileOpen(false)}>
                            <Heart size={16} /> <span>Saved Events</span>
                            {favourites.length > 0 && <span className="drop-badge">{favourites.length}</span>}
                        </Link>
                        <hr className='dropdown-divider' />
                        <button className='dropdown-logout' onClick={() => { onLogout(); setIsProfileOpen(false); }}>
                            <LogOut size={16} /><span>Logout</span>
                        </button>
                    </div>
                )}
            </div>
            ) : (
              <>
                  <button className="btn-signin" onClick={onLoginClick}>Sign In</button>
                  <button className="btn-get-started" onClick={onSignupClick}>Get Started</button>
              </>
            )}
        </div>
      </nav>
    );
}
export default Navbar;