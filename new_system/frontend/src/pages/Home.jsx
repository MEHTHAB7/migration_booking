/* eslint-disable */
import { useState, useEffect } from 'react';

export default function Home() {
  const [view, setView] = useState('search');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (searchTerm) qs.append('familyName', searchTerm);
      if (filterType) qs.append('type', filterType);
      
      const res = await fetch(`http://localhost:3002/api/bookings?${qs.toString()}`);
      const data = await res.json();
      setBookings(data.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [filterType]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const cleanDatabase = async () => {
    if (!confirm('Are you sure you want to clean the New System database?')) return;
    try {
      await fetch('http://localhost:3002/api/bookings/clean', { method: 'DELETE' });
      alert('Database cleaned successfully!');
      fetchBookings();
    } catch (err) { alert('Failed to clean DB'); }
  };

  return (
    <div>
      <div className="nav-buttons" style={{marginBottom: '2rem', justifyContent: 'center'}}>
        <button className={view === 'search' ? 'active' : ''} onClick={() => setView('search')}>Explore / Search</button>
        <button className={view === 'admin' ? 'active' : ''} onClick={() => setView('admin')}>Admin / Demo</button>
      </div>

      {view === 'admin' ? (
        <div className="admin-panel">
          <h2 className="admin-title">Demo Controls pane</h2>
          <p>Use these controls to wipe the modern NoSQL database prior to running a migration pass (API or DB-to-DB).</p>
          <div className="admin-actions">
            <button className="btn-danger" onClick={cleanDatabase}>Erase Database (NoSQL)</button>
          </div>
        </div>
      ) : (
        <>
          <form className="search-section" onSubmit={handleSearch}>
            <input type="text" className="search-input" placeholder="Search bookings by Family Name (e.g., Smith)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <select className="search-input" style={{flex: '0 0 150px'}} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              <option value="hotel">Hotels</option>
              <option value="airline">Airlines</option>
            </select>
            <button type="submit" className="search-btn">Search</button>
          </form>

          {loading ? (
            <div className="no-results">Connecting to microservices...</div>
          ) : bookings.length === 0 ? (
            <div className="no-results">
              No matching bookings found in the modern system. 
              <br/><br/>
              Have you run the migration script yet? Or try booking a new trip above!
            </div>
          ) : (
            <div className="results-grid">
              {bookings.map(booking => (
                <div className="card" key={booking._id}>
                  <div className="card-header">
                    <div>
                      <h3 className="card-title">Family: {booking.familyName}</h3>
                      <p className="card-subtitle">{booking.startDate} to {booking.endDate}</p>
                    </div>
                    <span className={`badge ${booking.type}`}>{booking.type}</span>
                  </div>
                  <div style={{color: 'var(--primary)', fontWeight: 'bold'}}>{booking.providerName} - {booking.providerLocation}</div>
                  {booking.type === 'hotel' && booking.rooms && (
                    <ul className="room-list">
                      {booking.rooms.map((r, i) => (
                        <li key={i} className="room-item"><span>Room: {r.roomNumber}</span><span>Guests: {r.guestCount}/{r.capacity}</span></li>
                      ))}
                    </ul>
                  )}
                  {booking.type === 'airline' && booking.flights && (
                    <ul className="flight-list">
                      {booking.flights.map((f, i) => (
                        <li key={i} className="flight-item"><span>Flight {f.flightNumber}</span><span>Seat {f.seatNumber} ({f.passengerName})</span></li>
                      ))}
                    </ul>
                  )}
                  <div style={{marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)'}}>
                    Modern Booking ID: {booking._id.substr(0,8)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
