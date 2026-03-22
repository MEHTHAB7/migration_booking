import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BookAirlines({ user }) {
  const [airlines, setAirlines] = useState([]);
  const [selectedAirline, setSelectedAirline] = useState(null);
  const [numPassengers, setNumPassengers] = useState(1);
  const nav = useNavigate();

  useEffect(() => {
    fetch('/api/inventory/airlines')
      .then(res => res.json())
      .then(data => setAirlines(data));
  }, []);

  const handleBook = async (airline) => {
    if (!user) {
      alert("Please Log In first to book a flight.");
      return nav('/login');
    }
    
    const flightsArray = [];
    for(let i=0; i<numPassengers; i++) {
        flightsArray.push({
            flightNumber: airline.flightNumber,
            seatNumber: 'Seat-' + Math.floor(Math.random() * 200),
            passengerName: i === 0 ? user.name : `${user.name} Guest ${i}`
        });
    }

    const bookingPayload = {
      familyName: user.name, // Use registered user name as family/booking name
      type: 'airline',
      providerName: airline.name,
      providerLocation: airline.route,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      flights: flightsArray
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(bookingPayload)
      });
      if (res.ok) {
        alert(`Successfully booked ${numPassengers} seat(s)! View it on the Explore page.`);
        nav('/');
      } else {
        alert('Failed to book.');
      }
    } catch (e) { alert('Error: ' + e.message); }
  };

  return (
    <div>
      <h2 style={{color: 'white', marginBottom: '1.5rem', textAlign: 'center'}}>Available Airlines & Flights</h2>
      <div className="results-grid">
        {airlines.map(al => (
          <div className="card" key={al.id}>
            <div className="card-header">
              <h3 className="card-title">{al.name}</h3>
              <span className="badge airline">${al.price} / seat</span>
            </div>
            <p style={{color: 'var(--primary)', fontWeight: 'bold'}}>{al.route} (Flight: {al.flightNumber})</p>
            <p style={{color: 'var(--text-muted)'}}>Seats Available: {al.availableSeats}</p>
            
            {selectedAirline === al.id ? (
                <div style={{marginTop: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px'}}>
                    <label style={{display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem'}}>Number of Passengers:</label>
                    <input 
                        type="number" 
                        min="1" 
                        max={al.availableSeats} 
                        value={numPassengers} 
                        onChange={e => setNumPassengers(Number(e.target.value))} 
                        className="search-input" 
                        style={{width: '100%', marginBottom: '1rem'}}
                    />
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                        <button className="search-btn" style={{flex: 1}} onClick={() => handleBook(al)}>
                            Confirm Book
                        </button>
                        <button className="search-btn" style={{flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white'}} onClick={() => setSelectedAirline(null)}>
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button className="search-btn" style={{marginTop: '1.5rem', width: '100%'}} onClick={() => {
                    if(!user) {
                        alert("Please Log In first to book a flight.");
                        nav('/login');
                        return;
                    }
                    setSelectedAirline(al.id);
                    setNumPassengers(1);
                }}>
                  Book Now
                </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
