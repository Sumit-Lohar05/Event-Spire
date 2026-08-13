import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Edit2, Save, X, Link as LinkIcon, Instagram, Twitter, MapPin, Calendar, Upload } from 'lucide-react';
import './Profile.css';

function Profile({ currentUser, onUpdateProfile, bookedTickets, favourites, events }) {
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('about');
    const [formData, setFormData] = useState({
        bio: currentUser?.bio || '',
        profilePicture: currentUser?.profilePicture || '',
        twitter: currentUser?.socialLinks?.twitter || '',
        instagram: currentUser?.socialLinks?.instagram || '',
        website: currentUser?.socialLinks?.website || ''
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        // When the currentUser prop changes (i.e., after a profile update),
        // sync the local form state to match the new, authoritative data.
        if (currentUser) {
            setFormData({
                bio: currentUser.bio || '',
                profilePicture: currentUser.profilePicture || '',
                twitter: currentUser.socialLinks?.twitter || '',
                instagram: currentUser.socialLinks?.instagram || '',
                website: currentUser.socialLinks?.website || ''
            });
        }
    }, [currentUser]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 3 * 1024 * 1024) { // 3MB limit
                alert("Image is too large! Please select an image under 3MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, profilePicture: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        onUpdateProfile({
            bio: formData.bio,
            profilePicture: formData.profilePicture,
            socialLinks: {
                twitter: formData.twitter,
                instagram: formData.instagram,
                website: formData.website
            }
        });
        setIsEditing(false);
    };

    // Derive attending and saved events based on App state
    const attendingEvents = events.filter(e => bookedTickets.some(t => String(t.eventId) === String(e._id) || String(t.eventId) === String(e.id)));
    const savedEvents = events.filter(e => favourites.some(favId => String(favId) === String(e._id) || String(favId) === String(e.id)));

    const renderEventGrid = (eventList) => (
        <div className="profile-events-grid">
            {eventList.length > 0 ? eventList.map(event => (
                <div key={event._id || event.id} className="profile-event-card">
                    <img src={event.image || '/src/assets/default-event.jpg'} alt={event.title} />
                    <div className="profile-event-info">
                        <h4>{event.title}</h4>
                        <p className="profile-event-detail"><Calendar size={14}/> {event.date?.month} {event.date?.day}, {event.date?.year}</p>
                        <p className="profile-event-detail"><MapPin size={14}/> {event.location}</p>
                        <Link to={`/event/${event._id || event.id}`} className="btn-view-event">View Details</Link>
                    </div>
                </div>
            )) : (
                <div className="profile-no-events">
                    <p>No events found in this section.</p>
                    <Link to="/#featured" className="btn-explore">Explore Events</Link>
                </div>
            )}
        </div>
    );

    const avatarSrc = isEditing ? formData.profilePicture : currentUser?.profilePicture;

    return (
        <div className="profile-page-container">
            <div className="profile-header-card">
                <div className="profile-avatar-container">
                    {avatarSrc ? (
                        <img src={avatarSrc} alt="Profile" className="profile-avatar-img" />
                    ) : (
                        <div className="profile-avatar-placeholder"><User size={50} /></div>
                    )}
                </div>
                
                <div className="profile-header-info">
                    <h2>{currentUser?.username || "Guest User"}</h2>
                    <p className="profile-email">{currentUser?.email}</p>
                    
                    {!isEditing && (
                        <div className="profile-social-links">
                            {currentUser?.socialLinks?.website && <a href={currentUser.socialLinks.website} target="_blank" rel="noreferrer"><LinkIcon size={18}/></a>}
                            {currentUser?.socialLinks?.twitter && <a href={`https://twitter.com/${currentUser.socialLinks.twitter}`} target="_blank" rel="noreferrer"><Twitter size={18}/></a>}
                            {currentUser?.socialLinks?.instagram && <a href={`https://instagram.com/${currentUser.socialLinks.instagram}`} target="_blank" rel="noreferrer"><Instagram size={18}/></a>}
                        </div>
                    )}
                </div>

                <div className="profile-actions">
                    {isEditing ? (
                        <>
                            <button className="btn-save" onClick={handleSave}><Save size={16}/> Save</button>
                            <button className="btn-cancel" onClick={() => setIsEditing(false)}><X size={16}/> Cancel</button>
                        </>
                    ) : (
                        <button className="btn-edit" onClick={() => setIsEditing(true)}><Edit2 size={16}/> Edit Profile</button>
                    )}
                </div>
            </div>

            <div className="profile-content-section">
                <div className="profile-tabs">
                    <button className={activeTab === 'about' ? 'active' : ''} onClick={() => setActiveTab('about')}>About Me</button>
                    <button className={activeTab === 'attending' ? 'active' : ''} onClick={() => setActiveTab('attending')}>Attending ({attendingEvents.length})</button>
                    <button className={activeTab === 'saved' ? 'active' : ''} onClick={() => setActiveTab('saved')}>Saved Events ({savedEvents.length})</button>
                </div>

                <div className="profile-tab-content">
                    {activeTab === 'about' && (
                        <div className="profile-about-section">
                            {isEditing ? (
                                <div className="edit-form">
                                    <div className="form-group">
                                        <label>Profile Picture</label>
                                        <div className="avatar-upload-options">
                                            <input type="text" name="profilePicture" value={formData.profilePicture} onChange={handleChange} placeholder="Paste image URL here..." />
                                            <span className="upload-divider">OR</span>
                                            <label className="btn-upload-avatar">
                                                <Upload size={16} /> Upload from PC
                                                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Bio</label>
                                        <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell the world about yourself..." rows="4"></textarea>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label><LinkIcon size={14}/> Website URL</label>
                                            <input type="text" name="website" value={formData.website} onChange={handleChange} placeholder="https://yourwebsite.com" />
                                        </div>
                                        <div className="form-group">
                                            <label><Twitter size={14}/> Twitter Handle</label>
                                            <input type="text" name="twitter" value={formData.twitter} onChange={handleChange} placeholder="username" />
                                        </div>
                                        <div className="form-group">
                                            <label><Instagram size={14}/> Instagram Handle</label>
                                            <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="username" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="view-about">
                                    <h3>Biography</h3>
                                    <p>{currentUser?.bio || "This user hasn't written a bio yet. They prefer to let their events do the talking."}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'attending' && (
                        renderEventGrid(attendingEvents)
                    )}

                    {activeTab === 'saved' && (
                        renderEventGrid(savedEvents)
                    )}
                </div>
            </div>
        </div>
    );
}
export default Profile;
