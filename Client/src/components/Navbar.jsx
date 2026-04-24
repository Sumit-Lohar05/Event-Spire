import { useEffect, useState, useRef } from 'react';
import { Menu, X, User, ChevronDown, Ticket, Heart, LogOut } from 'lucide-react';
import './Navbar.css';
import { HashLink } from 'react-router-hash-link';
import { Link, useNavigate } from 'react-router-dom';

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
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

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


    return (
      <nav className="navbar">
        <div className="logo">
          <img src="/src/assets/logo1.png" alt="EventSpire" />
        </div>

        <div className="menu-icon" onClick={() => setIsOpen(true)}>
          <Menu size={28}/>
        </div>

        {isOpen && <div className="nav-overlay" onClick={() => setIsOpen(false)}></div>}

        <ul className={`nav-links ${isOpen ? 'active' : ''}`}>
            <li className="mobile-only close-menu" onClick={() => setIsOpen(false)}>
                <X size={28} />
            </li>
            <li><HashLink smooth to="/#featured" onClick={handleLinkClick}>Browse Events</HashLink></li>
            <li><HashLink smooth to="/#categories" onClick={handleLinkClick}>Categories</HashLink></li>
            <li><HashLink smooth to="/#steps" onClick={handleLinkClick}>How It Works</HashLink></li>
            {isLoggedIn && (
              <>
                <li><Link to="/my-tickets" onClick={handleLinkClick}>My Tickets</Link></li>
                {/* <li><Link to="/saved" onClick={handleLinkClick}>Saved Events ({favourites.length})</Link></li> */}
              </>
            )}
            <li>
                <span className="nav-link-item" onClick={handleHostEventClick} style={{cursor: 'pointer'}}>
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
                    <div className="avatar-placeholder">
                        <User size={18} />
                    </div>
                    <span>Account</span>
                    <ChevronDown size={14} className={isProfileOpen ? 'rotate' : ''} />
                </button>
                
                {isProfileOpen && (
                    <div className="profile-dropdown">
                        <div className="dropdown-header">
                            <p className='user-name'>Hi, {currentUser?.username || "Guest"}</p>
                            <p className='user-email'>{currentUser?.email || ""}</p>
                        </div>
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