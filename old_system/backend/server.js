const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Could not connect to database", err);
    } else {
        console.log("Connected to SQLite database.");
    }
});

// GET all bookings with hotel and room details
app.get('/api/bookings', (req, res) => {
    const query = `
        SELECT 
            b.id as booking_id,
            b.family_name,
            b.start_date,
            b.end_date,
            b.guest_count,
            h.name as hotel_name,
            h.city as hotel_city,
            r.room_number,
            r.capacity
        FROM bookings b
        JOIN hotels h ON b.hotel_id = h.id
        JOIN rooms r ON b.room_id = r.id
        ORDER BY b.start_date ASC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            count: rows.length,
            data: rows
        });
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Old System server running on http://localhost:${PORT}`);
});
