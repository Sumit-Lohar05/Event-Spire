import { startTransition, useEffect, useState } from "react";
import './HostEventPage.css';
import { Upload, Calendar, MapPin, Tag, IndianRupee, List, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const HostEventPage = ({onAddEvent, onUpdateEvent, events, currentUser}) => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const navigate = useNavigate();
    const location = useLocation();
    const editId = new URLSearchParams(location.search).get('edit');
    const existingEvent = events.find(event => String(event._id || event.id) === String(editId));
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
        description: '',
        startTime: '',
        endTime: '',
    });

    useEffect(() => {
        if (!existingEvent) return;
        const eventDate = existingEvent.date || {};
        const toTimeInput = (value) => value ? new Date(value).toTimeString().slice(0, 5) : '';
        startTransition(() => {
            setFormData({
                title: existingEvent.title || '',
                date: eventDate.year && eventDate.month && eventDate.day
                    ? `${eventDate.year}-${String(new Date(`${eventDate.month} 1, ${eventDate.year}`).getMonth() + 1).padStart(2, '0')}-${String(eventDate.day).padStart(2, '0')}`
                    : '',
                category: existingEvent.category || 'Music',
                location: existingEvent.location || '',
                price: String(existingEvent.price ?? 0).replace(/[^0-9.]/g, ''),
                maxCapacity: String(existingEvent.maxCapacity ?? ''),
                imageUrl: existingEvent.image || '',
                description: existingEvent.description || '',
                startTime: toTimeInput(eventDate.startAt),
                endTime: toTimeInput(eventDate.endAt),
            });
            setPreview(existingEvent.image || null);
        });
    }, [existingEvent]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Please log in again to host an event.");
            return;
        }
        // Split the "YYYY-MM-DD" string to avoid timezone shifts
        const [year, month, day] = formData.date.split('-');
        const dateObj = new Date(year, month - 1, day);
        const makeDateTime = (time) => time ? `${formData.date}T${time}:00` : undefined;

        const newEvent = {
            ...(editId ? {} : { id: Date.now().toString() }),
            image: preview || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4",
            date: {
                month: dateObj.toLocaleString('default', { month: 'short' }),
                day: day, 
                year: year,
                startAt: makeDateTime(formData.startTime),
                endAt: makeDateTime(formData.endTime)
            },
            title: formData.title,
            location: formData.location,
            price: formData.price === "0" || formData.price === "" ? 0 : Number(formData.price),
            attendees: 0,
            maxCapacity: parseInt(formData.maxCapacity) || 1000,
            category: formData.category,
            description: formData.description.trim()
        };
        const savedEvent = editId
            ? await onUpdateEvent(editId, newEvent)
            : await onAddEvent(newEvent);
        if (savedEvent) navigate("/");
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
                <h1>{editId ? 'Edit Your Event' : 'Create Your Event'}</h1>
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
                            <input name="title" type="text" placeholder="Enter event title" value={formData.title} onChange={handleChange} required />
                        </div>
                        <div className="input-field">
                            <label><Calendar size={16} />Date</label>
                            <input name="date" type="date" value={formData.date} onChange={handleChange} required />
                        </div>
                        <div className="input-field">
                            <label>Start Time</label>
                            <input name="startTime" type="time" value={formData.startTime} onChange={handleChange} />
                        </div>
                        <div className="input-field">
                            <label>End Time</label>
                            <input name="endTime" type="time" value={formData.endTime} onChange={handleChange} />
                        </div>
                        <div className="input-field">
                            <label><List size={16} />Category</label>
                            <select name="category" value={formData.category} onChange={handleChange}>
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
                            <input name="location" type="text" placeholder="City or Venue" value={formData.location} onChange={handleChange} required />
                        </div>
                        <div className="input-field">
                            <label><IndianRupee size={16} />Ticket Price</label>
                            <input name="price" type="number" placeholder="0.00" min={0} value={formData.price} onChange={handleChange} required />
                        </div>
                        <div className="input-field">
                            <label><Users size={16} />Max Capacity</label>
                            <input name="maxCapacity" type="number" placeholder="e.g. 50" min={1} value={formData.maxCapacity} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="input-field">
                        <label>Event Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows="4" required />
                    </div>
                    <button type="submit" className="btn-submit-event">{editId ? 'Save Changes' : 'Publish Event'}</button>
                </form>
            </div>
        </div>
    );
}

export default HostEventPage;