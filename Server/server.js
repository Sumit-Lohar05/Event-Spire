const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const { validateEnv } = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const { allowedOrigins } = validateEnv();

// Middleware
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Origin is not allowed by CORS'));
    }
}));
app.use(express.json());

// Connect to MongoDB
connectDB();

// Hook up our extracted routes!
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);

// Import and use routes
app.get('/', (req, res) => {
    res.send('EventSpire API is running successfully!');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
