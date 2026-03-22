import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BookHotels({ user }) {
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [numRooms, setNumRooms] = useState(1);
  const [numGuests, setNumGuests] = useState(2);
  const nav = useNavigate();

  useEffect(() => {
    fetch('/api/inventory/hotels')
      .then(res => res.json())
      .then(data => setHotels(data));
  }, []);

  const handleBook = async (hotel) => {
    if (!user) {
      alert("Please Log In first to book a hotel.");
      return nav('/login');
    }
    
    // Start date tomorrow, end date day after tomorrow
    const t = new Date(); t.setDate(t.getDate() + 1);
    const end = new Date(); end.setDate(end.getDate() + 4);

    const roomsArray = [];
    const guestsPerRoom = Math.ceil(numGuests / numRooms);
    for(let i=0; i<numRooms; i++) {
        roomsArray.push({
            roomNumber: 'Rm-' + Math.floor(Math.random() * 500),
            guestCount: guestsPerRoom,
            capacity: 4
        });
    }

    const bookingPayload = {
      familyName: user.name,
      type: 'hotel',
      providerName: hotel.name,
      providerLocation: hotel.location,
      startDate: t.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      rooms: roomsArray
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(bookingPayload)
      });
      if (res.ok) {
        alert(`Successfully booked ${numRooms} room(s) for ${numGuests} guest(s)! View it on the Explore page.`);
        nav('/');
      } else {
        alert('Failed to book.');
      }
    } catch (e) { alert('Error: ' + e.message); }
  };

  return (
    <div>
      <h2 style={{color: 'white', marginBottom: '1.5rem', textAlign: 'center'}}>Available Premium Hotels</h2>
      <div className="results-grid">
        {hotels.map(ht => (
          <div className="card" key={ht.id}>
            <div className="card-header">
              <h3 className="card-title">{ht.name}</h3>
              <span className="badge hotel">${ht.pricePerNight}/night</span>
            </div>
            <p style={{color: 'var(--primary)', fontWeight: 'bold'}}>{ht.location} (Rating: {ht.rating} ⭐)</p>
            
            {selectedHotel === ht.id ? (
                <div style={{marginTop: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px'}}>
                    <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
                        <div style={{flex: 1}}>
                            <label style={{display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize:'0.9rem'}}>Number of Rooms:</label>
                            <input type="number" min="1" max="5" value={numRooms} onChange={e => setNumRooms(Number(e.target.value))} className="search-input" style={{width: '100%'}}/>
                        </div>
                        <div style={{flex: 1}}>
                            <label style={{display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize:'0.9rem'}}>Total Guests:</label>
                            <input type="number" min="1" max={numRooms * 4} value={numGuests} onChange={e => setNumGuests(Number(e.target.value))} className="search-input" style={{width: '100%'}}/>
                        </div>
                    </div>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                        <button className="search-btn" style={{flex: 1}} onClick={() => handleBook(ht)}>
                            Confirm Book
                        </button>
                        <button className="search-btn" style={{flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white'}} onClick={() => setSelectedHotel(null)}>
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button className="search-btn" style={{marginTop: '1.5rem', width: '100%'}} onClick={() => {
                    if(!user) {
                        alert("Please Log In first to book a hotel.");
                        nav('/login');
                        return;
                    }
                    setSelectedHotel(ht.id);
                    setNumRooms(1);
                    setNumGuests(2);
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
