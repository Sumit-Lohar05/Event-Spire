import { useEffect, useState } from "react";
import './HostEventPage.css';
import { Upload, Calendar, MapPin, Tag, IndianRupee, List, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HostEventPage = ({onAddEvent, currentUser}) => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const navigate = useNavigate();
    const [preview, setPreview] = useState(null);

    // State to capture form data
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        category: 'Music', 
        location: '',
        price: '',
        maxCapacity: '',
        imageUrl: '',
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if(file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({...formData, [name] : value});
        if(name === "imageUrl") setPreview(value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Please log in again to host an event.");
            return;
        }
        // Split the "YYYY-MM-DD" string to avoid timezone shifts
        const [year, month, day] = formData.date.split('-');
        const dateObj = new Date(year, month - 1, day);

        const newEvent = {
            id: Date.now().toString(),
            creatorId: currentUser.id || currentUser._id,
            isUserEvent: true,
            image: preview || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4",
            date: {
                month: dateObj.toLocaleString('default', { month: 'short' }),
                day: day, 
                year: year
            },
            title: formData.title,
            location: formData.location,
            price: formData.price === "0" || formData.price === "" ? 0 : Number(formData.price),
            attendees: 0,
            maxCapacity: parseInt(formData.maxCapacity) || 1000,
            category: formData.category,
            description: "New event created by organizer"
        };
        onAddEvent(newEvent);
        navigate("/");
    }

    const handleClearImage = (e) => {
        e.stopPropagation();
        setPreview(null);
        setFormData({...formData, imageUrl: ''});

        const fileInput = document.getElementById('imageInput');
        if(fileInput) fileInput.value = '';
    }

    return(
        <div className="host-event-container">
            <div className="host-card">
                <h1>Create Your Event</h1>
                <p>Share your experience with the EventSpire community.</p>

                <form className="host-form" onSubmit={handleSubmit}>
                    <div className="upload-section">
                        <label>Event Image</label>
                        <input 
                            name="imageUrl" 
                            type="text" 
                            placeholder="Or paste an image URL here..." 
                            onChange={handleChange}
                            value={formData.imageUrl}
                            className="url-input"
                        />
                        <div className="upload-placeholder" onClick={() => document.getElementById('imageInput').click()}>
                            {preview ? (
                                <div className="preview-container" style={{ position: 'relative', width: '100%', height: '100%'}}>
                                    <img src={preview} alt="Event Prevew" className="img-preview"/>
                                    <button
                                        type="button"
                                        className="clear-image-btn"
                                        onClick={handleClearImage}
                                    >
                                        Clear Image
                                    </button>
                                </div>
                            ) : (
                                <div className="upload-content">
                                    <Upload size={40} />
                                    <span>Click to upload banner</span>
                                </div>
                            )}
                        </div>
                        <input type="file" id="imageInput" hidden onChange={handleImageChange} accept="image/*"/>
                    </div>
                    <div className="input-row">
                        <div className="input-field">
                            <label><Tag size={16} />Event Title</label>
                            <input name="title" type="text" placeholder="Enter event title" onChange={handleChange} required />
                        </div>
                        <div className="input-field">
                            <label><Calendar size={16} />Date</label>
                            <input name="date" type="date" onChange={handleChange} required />
                        </div>
                        <div className="input-field">
                            <label><List size={16} />Category</label>
                            <select name="category" onChange={handleChange}>
                                <option>Music</option>
                                <option>Arts</option>
                                <option>Sports</option>
                                <option>Tech</option>
                                <option>Workshop</option>
                                <option>Food</option>
                                <option>Business</option>
                                <option>Wellness</option>
                            </select>
                        </div>
                    </div>
                    <div className="input-row">
                        <div className="input-field">
                            <label><MapPin size={16} />Location</label>
                            <input name="location" type="text" placeholder="City or Venue" onChange={handleChange} required />
                        </div>
                        <div className="input-field">
                            <label><IndianRupee size={16} />Ticket Price</label>
                            <input name="price" type="number" placeholder="0.00" min={0} onChange={handleChange} required />
                        </div>
                        <div className="input-field">
                            <label><Users size={16} />Max Capacity</label>
                            <input name="maxCapacity" type="number" placeholder="e.g. 50" min={1} onChange={handleChange} required />
                        </div>
                    </div>
                    <button type="submit" className="btn-submit-event">Publish Event</button>
                </form>
            </div>
        </div>
    );
}

export default HostEventPage;