const sqlite3 = require('sqlite3').verbose();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const OLD_DB_PATH = path.resolve(__dirname, '../old_system/backend/database.sqlite');
const NEW_API_URL = 'http://localhost:3002/api/bookings/bulk';
const MONGO_URI_FILE = path.resolve(__dirname, '../new_system/services/booking_service/.mongo_uri');

const mode = process.argv[2]; // 'api' or 'db'

if (!['api', 'db'].includes(mode)) {
    console.error("Please specify a migration mode: 'api' or 'db'");
    process.exit(1);
}

function extractAndTransformData() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(OLD_DB_PATH, sqlite3.OPEN_READONLY, (err) => {
            if (err) return reject("Failed to connect to SQLite: " + err);
        });

        const query = `
            SELECT 
                b.id as legacy_booking_id,
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
            JOIN rooms r ON b.room_id = r.id;
        `;

        db.all(query, [], (err, rows) => {
            if (err) return reject(err);
            db.close();

            // Transform & Group: Group by family_name + start_date + end_date + hotel_name
            const grouped = {};

            rows.forEach(row => {
                const groupKey = `${row.family_name}_${row.start_date}_${row.end_date}_${row.hotel_name}`;
                if (!grouped[groupKey]) {
                    grouped[groupKey] = {
                        type: 'hotel',
                        familyName: row.family_name,
                        startDate: row.start_date,
                        endDate: row.end_date,
                        providerName: row.hotel_name,
                        providerLocation: row.hotel_city,
                        rooms: []
                    };
                }

                grouped[groupKey].rooms.push({
                    roomNumber: row.room_number,
                    capacity: row.capacity,
                    guestCount: row.guest_count,
                    legacyBookingId: row.legacy_booking_id
                });
            });

            // Convert map to array
            resolve(Object.values(grouped));
        });
    });
}

async function migrateViaAPI(data) {
    console.log(`Starting API Migration for ${data.length} aggregated families...`);
    try {
        const res = await fetch(NEW_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        if (res.ok) {
            console.log(`API Migration Successful: Inserted ${result.count} complex bookings.`);
        } else {
            console.error("API Migration Failed:", result);
        }
    } catch (err) {
        console.error("Error calling API:", err.message);
    }
}

async function migrateViaDB(data) {
    console.log(`Starting DB-to-DB Migration for ${data.length} aggregated families...`);
    if (!fs.existsSync(MONGO_URI_FILE)) {
        console.error("Could not find Mongo URI file. Is the new booking_service running?");
        return;
    }
    
    const uri = fs.readFileSync(MONGO_URI_FILE, 'utf8').trim();
    if (!uri) {
        console.error("Mongo URI is empty. Please restart the modern booking_service.");
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db('test'); // memory server defaults to 'test'
        const bookingsColl = database.collection('bookings');

        // Add createdAt field that mongoose would normally add
        const dataWithDates = data.map(d => ({...d, createdAt: new Date()}));
        
        const result = await bookingsColl.insertMany(dataWithDates);
        console.log(`DB Migration Successful: Inserted ${result.insertedCount} documents directly into NoSQL.`);
    } catch (err) {
        console.error("DB Migration Error:", err);
    } finally {
        await client.close();
    }
}

async function run() {
    try {
        console.log("Reading legacy relational database...");
        const transformedData = await extractAndTransformData();
        console.log(`Extracted total 1000 flat bookings and aggregated into ${transformedData.length} complex family bookings.`);

        if (mode === 'api') {
            await migrateViaAPI(transformedData);
        } else if (mode === 'db') {
            await migrateViaDB(transformedData);
        }
    } catch (err) {
        console.error("Migration fatal error:", err);
    }
}

run();
