import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BookAirlines from './pages/BookAirlines';
import BookHotels from './pages/BookHotels';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  return (
    <div className="app-container">
      <Navbar user={user} setUser={setUser} />
      <div style={{padding: '2rem'}}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup setUser={setUser} />} />
          <Route path="/book/airlines" element={<BookAirlines user={user} />} />
          <Route path="/book/hotels" element={<BookHotels user={user} />} />
        </Routes>
      </div>
    </div>
  );
}
export default App;
