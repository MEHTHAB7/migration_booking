const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const OLD_DB_PATH = path.resolve(__dirname, '../old_system/backend/database.sqlite');
const SEED_DEST = path.resolve(__dirname, '../new_system/services/booking_service/seed.json');

const db = new sqlite3.Database(OLD_DB_PATH, sqlite3.OPEN_READONLY);

const query = `
    SELECT 
        b.id as legacy_booking_id, b.family_name, b.start_date, b.end_date, b.guest_count,
        h.name as hotel_name, h.city as hotel_city, r.room_number, r.capacity
    FROM bookings b JOIN hotels h ON b.hotel_id = h.id JOIN rooms r ON b.room_id = r.id;
`;

db.all(query, [], (err, rows) => {
    db.close();
    const grouped = {};
    rows.forEach(row => {
        const groupKey = `${row.family_name}_${row.start_date}_${row.end_date}_${row.hotel_name}`;
        if (!grouped[groupKey]) {
            grouped[groupKey] = {
                type: 'hotel', familyName: row.family_name, startDate: row.start_date, endDate: row.end_date,
                providerName: row.hotel_name, providerLocation: row.hotel_city, rooms: []
            };
        }
        grouped[groupKey].rooms.push({
            roomNumber: row.room_number, capacity: row.capacity, guestCount: row.guest_count, legacyBookingId: row.legacy_booking_id
        });
    });
    fs.writeFileSync(SEED_DEST, JSON.stringify(Object.values(grouped), null, 2));
    console.log("Seed generated successfully at " + SEED_DEST);
});
