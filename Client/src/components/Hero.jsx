import { Search, MapPin, Calendar, IndianRupee } from "lucide-react";
import { HashLink } from "react-router-hash-link";
import DatePicker from "react-datepicker";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import "./Hero.css";
function Hero({onSearch, onLocationSearch, onDateSearch, onPriceSearch, onReset, isFiltered, 
    searchQuery, locationQuery, dateQuery, priceQuery, onSearchSubmit, isLoggedIn, onLoginClick}) {
    const navigate = useNavigate();

    const selectedDateObject = useMemo(() => {
        if (!dateQuery) return null;
        const parsedDate = new Date(dateQuery);
        return isNaN(parsedDate.getTime()) ? null : parsedDate;
    }, [dateQuery]);

    const handleHostEventClick = (e) => {
      e.preventDefault();
      if(isLoggedIn){
        navigate('/host-event');
      }else{
        onLoginClick();
      }
    };
    
    return (
      <div className="hero-container">
        <div className="hero-content">
          <h1>Discover & Create <br /><span>Unforgettable Experiences</span></h1>
          <p>Join us on a journey to explore the beauty of the world.</p>
          <form className="search-bar" onSubmit={(e) => { e.preventDefault(); if (onSearchSubmit) onSearchSubmit(); }}>
            <div className="input-groups">
              <span className="icon">
                <Search size={20} />
              </span>
              <input type="text" placeholder="Search events, artists, venues..." value={searchQuery} onChange={(e) => onSearch(e.target.value)}/>
            </div>
            <div className="input-location">
              <span className="icon">
                <MapPin size={20} />
              </span>
              <input type="text" placeholder="Location" value={locationQuery} onChange={(e) => onLocationSearch(e.target.value)} />
            </div>
            <div className="input-date">
              <span className="icon">
                <Calendar size={20} />
              </span>
              <DatePicker
                selected={selectedDateObject}
                onChange={(date) => {
                  if (date && !isNaN(date.getTime())) {
                    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    onDateSearch(formattedDate);
                  } else {
                    onDateSearch("");
                  }
                }}
                placeholderText="Event Date"
                dateFormat="MMM d, yyyy"
              />
            </div>
            <div className="input-price">
              <span className="icon">
                <IndianRupee size={20} />
              </span>
              <select value={priceQuery} onChange={(e) => onPriceSearch(e.target.value)}>
                <option value="All">Price Range</option>
                <option value="Free">Free</option>
                <option value="Paid">Paid</option>
                <option value="Under 500">Under ₹500</option>
                <option value="500-1000">₹500 - ₹1000</option>
                <option value="1000-2000">₹1000 - ₹2000</option>
                <option value="Over 2000">Over ₹2000</option>
              </select>
            </div>
            <button type="submit" className="btn-search">Search</button>
            {isFiltered && (
              <button type="button" className="btn-reset" onClick={onReset}>
                Reset
              </button>  
            )}
          </form>
          <div className="hero-actions">
            <HashLink smooth to="/#featured">
              <button className="btn-primary">Find Events</button>
            </HashLink>
            <button className="btn-secondary" onClick={handleHostEventClick}>Host an Event</button>
          </div>
        </div>
      </div>
    );
}
export default Hero;