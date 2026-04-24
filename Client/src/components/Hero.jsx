import { Search, MapPin } from "lucide-react";
import { HashLink } from "react-router-hash-link";
import "./Hero.css";
function Hero({onSearch, onLocationSearch, onReset, isFiltered, searchQuery, locationQuery, onSearchSubmit, onHostEventClick}) {
    return (
      <div className="hero-container">
        <div className="hero-content">
          <h1>Discover & Create <br /><span>Unforgettable Experiences</span></h1>
          <p>Join us on a journey to explore the beauty of the world.</p>
          <form className="search-bar" onSubmit={(e) => { e.preventDefault(); onSearchSubmit(); }}>
            <div className="input-groups">
              <span className="icon">
                <Search size={20} />
              </span>
              <input type="text" placeholder="Search events, artists..." value={searchQuery} onChange={(e) => onSearch(e.target.value)}/>
            </div>
            <div className="input-location">
              <span className="icon">
                <MapPin size={20} />
              </span>
              <input type="text" placeholder="Location" value={locationQuery} onChange={(e) => onLocationSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn-search">Search</button>
            {isFiltered && (
              <button className="btn-reset" onClick={onReset}>
                Reset Filters
              </button>  
            )}
          </form>
          <div className="hero-actions">
            <HashLink smooth to="/#featured">
              <button className="btn-primary">Find Events</button>
            </HashLink>
            <button className="btn-secondary" onClick={onHostEventClick}>Host an Event</button>
          </div>
        </div>
      </div>
    );
}
export default Hero;