const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath); // Delete old DB to start fresh
}

const db = new sqlite3.Database(dbPath);

const HOTEL_COUNT = 10;
const ROOMS_PER_HOTEL = 20;
const TARGET_BOOKINGS = 1000;

const families = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", 
    "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris"
];

const hotels = [
    { name: "Grand Plaza", city: "New York" },
    { name: "Oceanview Resort", city: "Miami" },
    { name: "Mountain Retreat", city: "Denver" },
    { name: "Urban Boutique", city: "Chicago" },
    { name: "Sunny Inn", city: "Los Angeles" },
    { name: "Historic Lodge", city: "Boston" },
    { name: "Lakeside Cabins", city: "Seattle" },
    { name: "Desert Oasis", city: "Phoenix" },
    { name: "Riverfront Hotel", city: "Austin" },
    { name: "Skyline Suites", city: "San Francisco" }
];

db.serialize(() => {
    // Create Tables
    db.run(`CREATE TABLE IF NOT EXISTS hotels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        city TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hotel_id INTEGER,
        room_number TEXT,
        capacity INTEGER,
        FOREIGN KEY (hotel_id) REFERENCES hotels (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hotel_id INTEGER,
        room_id INTEGER,
        family_name TEXT,
        start_date TEXT,
        end_date TEXT,
        guest_count INTEGER,
        FOREIGN KEY (hotel_id) REFERENCES hotels (id),
        FOREIGN KEY (room_id) REFERENCES rooms (id)
    )`);

    console.log("Tables created successfully.");

    // Insert Hotels
    const insertHotel = db.prepare(`INSERT INTO hotels (name, city) VALUES (?, ?)`);
    hotels.forEach(hotel => {
        insertHotel.run(hotel.name, hotel.city);
    });
    insertHotel.finalize();
    console.log("Hotels populated.");

    // Insert Rooms
    const insertRoom = db.prepare(`INSERT INTO rooms (hotel_id, room_number, capacity) VALUES (?, ?, ?)`);
    for (let h = 1; h <= hotels.length; h++) {
        for (let r = 1; r <= ROOMS_PER_HOTEL; r++) {
            const capacity = Math.floor(Math.random() * 3) + 2; // 2 to 4
            insertRoom.run(h, `${h}0${r}`, capacity);
        }
    }
    insertRoom.finalize();
    console.log("Rooms populated.");

    // Insert Bookings
    const insertBooking = db.prepare(`INSERT INTO bookings (hotel_id, room_id, family_name, start_date, end_date, guest_count) VALUES (?, ?, ?, ?, ?, ?)`);
    
    let totalBookings = 0;
    
    db.all("SELECT id, hotel_id, capacity FROM rooms", (err, rooms) => {
        if (err) throw err;
        
        while (totalBookings < TARGET_BOOKINGS) {
            // Pick a random family
            const familyName = families[Math.floor(Math.random() * families.length)];
            
            // Pick a random hotel 
            const hotelId = Math.floor(Math.random() * hotels.length) + 1;
            
            // Get rooms for this hotel
            const hotelRooms = rooms.filter(r => r.hotel_id === hotelId);
            
            // Determine how many rooms this family needs for a single trip (1 to 4)
            const numRoomsNeeded = Math.floor(Math.random() * 4) + 1;
            
            // Ensure we don't exceed the TARGET_BOOKINGS
            const roomsToBook = Math.min(numRoomsNeeded, TARGET_BOOKINGS - totalBookings);
            
            // Generate random dates within the next 3 years
            const today = new Date();
            const maxDaysAhead = 3 * 365;
            const daysAhead = Math.floor(Math.random() * maxDaysAhead);
            const duration = Math.floor(Math.random() * 7) + 1; // 1 to 7 days
            
            const startDate = new Date(today);
            startDate.setDate(today.getDate() + daysAhead);
            
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + duration);
            
            const dateStrStart = startDate.toISOString().split('T')[0];
            const dateStrEnd = endDate.toISOString().split('T')[0];
            
            // Randomly select distinct rooms
            let selectedRooms = [];
            let tempRooms = [...hotelRooms];
            for (let i = 0; i < roomsToBook; i++) {
                if (tempRooms.length === 0) break;
                const rIdx = Math.floor(Math.random() * tempRooms.length);
                selectedRooms.push(tempRooms[rIdx]);
                tempRooms.splice(rIdx, 1);
            }
            
            // Create the disjoint legacy bookings
            selectedRooms.forEach(room => {
                const guests = Math.floor(Math.random() * room.capacity) + 1;
                insertBooking.run(hotelId, room.id, familyName, dateStrStart, dateStrEnd, guests);
                totalBookings++;
            });
        }
        
        insertBooking.finalize();
        console.log(`Successfully generated ${totalBookings} legacy bookings.`);
        
        db.close(() => {
            console.log("Database connection closed.");
        });
    });
});
