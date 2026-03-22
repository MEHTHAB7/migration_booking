const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve production static files from the React dist folder seamlessly
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// User Auth Schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true } // In a real app, hash this!
}, { timestamps: true });
const User = mongoose.model('User', UserSchema);

// Universal Booking Schema suitable for both Airlines and Hotels
const RoomSchema = new mongoose.Schema({
    roomNumber: String,
    capacity: Number,
    guestCount: Number,
    legacyBookingId: Number // useful to verify migration
}, { _id: false });

const FlightSchema = new mongoose.Schema({
    flightNumber: String,
    seatNumber: String,
    passengerName: String
}, { _id: false });

const BookingSchema = new mongoose.Schema({
    type: { type: String, enum: ['hotel', 'airline'], required: true },
    familyName: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    providerName: { type: String, required: true }, // Hotel or Airline name
    providerLocation: String, // City for hotel, Route for airline
    rooms: [RoomSchema], // If hotel
    flights: [FlightSchema], // If airline
    createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', BookingSchema);

// API Endpoints

// Auth Endpoints
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: 'Email already exists' });
        
        const user = new User({ name, email, password });
        await user.save();
        res.status(201).json({ message: 'User registered securely', user: { id: user._id, name, email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.status(200).json({ message: 'Login successful', user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Inventory APIs
app.get('/api/inventory/airlines', (req, res) => {
    res.json([
        { id: 'AL1', name: 'SkyHigh Airlines', route: 'NYC to LAX', price: 299, availableSeats: 45, flightNumber: 'SH101' },
        { id: 'AL2', name: 'Oceanic Air', route: 'LAX to SYD', price: 899, availableSeats: 12, flightNumber: 'OA815' },
        { id: 'AL3', name: 'Global Wings', route: 'LHR to JFK', price: 450, availableSeats: 30, flightNumber: 'GW404' },
        { id: 'AL4', name: 'Velocity Flights', route: 'SFO to NRT', price: 750, availableSeats: 20, flightNumber: 'VF70' },
        { id: 'AL5', name: 'EuroJet', route: 'CDG to ROM', price: 120, availableSeats: 60, flightNumber: 'EJ112' },
        { id: 'AL6', name: 'Aurora Air', route: 'SEA to ANC', price: 250, availableSeats: 15, flightNumber: 'AA90' },
        { id: 'AL7', name: 'Desert Express', route: 'DXB to JFK', price: 1050, availableSeats: 5, flightNumber: 'DE40' },
        { id: 'AL8', name: 'Island Hoppers', route: 'HNL to OGG', price: 85, availableSeats: 120, flightNumber: 'IH1' },
        { id: 'AL9', name: 'Red Eye Transit', route: 'LAX to MIA', price: 199, availableSeats: 50, flightNumber: 'RE33' },
        { id: 'AL10', name: 'Emerald Skies', route: 'DUB to LHR', price: 60, availableSeats: 80, flightNumber: 'ES99' }
    ]);
});

app.get('/api/inventory/hotels', (req, res) => {
    res.json([
        { id: 'HT1', name: 'Grand Plaza', location: 'New York', pricePerNight: 200, rating: 5 },
        { id: 'HT2', name: 'Oceanview Resort', location: 'Miami', pricePerNight: 350, rating: 4.8 },
        { id: 'HT3', name: 'Mountain Retreat', location: 'Denver', pricePerNight: 150, rating: 4.5 },
        { id: 'HT4', name: 'Urban Boutique', location: 'Chicago', pricePerNight: 180, rating: 4.6 },
        { id: 'HT5', name: 'Sapphire Bay Hotel', location: 'Maldives', pricePerNight: 800, rating: 5 },
        { id: 'HT6', name: 'The Alpine Lodge', location: 'Swiss Alps', pricePerNight: 450, rating: 4.9 },
        { id: 'HT7', name: 'Desert Mirage Resort', location: 'Dubai', pricePerNight: 300, rating: 4.7 },
        { id: 'HT8', name: 'Sakura Inn', location: 'Kyoto', pricePerNight: 150, rating: 4.8 },
        { id: 'HT9', name: 'Neon Lights Hotel', location: 'Tokyo', pricePerNight: 220, rating: 4.5 },
        { id: 'HT10', name: 'Canal View Suites', location: 'Venice', pricePerNight: 280, rating: 4.6 },
        { id: 'HT11', name: 'Palace of the Gods', location: 'Athens', pricePerNight: 320, rating: 4.9 }
    ]);
});

app.get('/api/bookings', async (req, res) => {
    try {
        const { type, familyName } = req.query;
        let query = {};
        if (type) query.type = type;
        if (familyName) query.familyName = new RegExp(familyName, 'i');
        
        const bookings = await Booking.find(query).sort({ startDate: 1 });
        res.json({ count: bookings.length, data: bookings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a single universal booking (with multiple rooms or flights)
app.post('/api/bookings', async (req, res) => {
    try {
        const booking = new Booking(req.body);
        await booking.save();
        res.status(201).json(booking);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Create bookings in bulk (for API migration)
app.post('/api/bookings/bulk', async (req, res) => {
    try {
        const bookings = await Booking.insertMany(req.body);
        res.status(201).json({ count: bookings.length, message: "Bulk insert successful" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Clean DB - For demo purposes
app.delete('/api/bookings/clean', async (req, res) => {
    try {
        await Booking.deleteMany({});
        res.json({ message: "Database cleaned successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve the React application for any other unspecified routes (React Router)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Boot NoSQL Server
async function startServer() {
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
    console.log(`Connected to modern in-memory MongoDB at ${mongoUri}`);
    fs.writeFileSync(__dirname + '/.mongo_uri', mongoUri);
    
    // Seed some initial Airline demo data to show it's "universal"
    const sampleAirline = new Booking({
        type: 'airline',
        familyName: 'Miller',
        startDate: '2026-05-10',
        endDate: '2026-05-10',
        providerName: 'SkyHigh Airlines',
        providerLocation: 'NYC to LAX',
        flights: [
            { flightNumber: 'SH101', seatNumber: '12A', passengerName: 'John Miller' },
            { flightNumber: 'SH101', seatNumber: '12B', passengerName: 'Jane Miller' }
        ]
    });
    await sampleAirline.save();

    const PORT = process.env.PORT || 3002;
    app.listen(PORT, () => {
        console.log(`Universal Travel System running securely on port ${PORT}`);
    });
}

startServer().catch(console.error);
