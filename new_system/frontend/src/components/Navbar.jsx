import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ user, setUser }) {
  const nav = useNavigate();
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    nav('/login');
  };

  return (
    <header className="header">
      <h1 className="header-title" style={{fontSize: '1.5rem', margin: 0}}>
        <Link to="/" style={{color: 'inherit', textDecoration: 'none'}}>Sky&Sea Universal Bookings</Link>
      </h1>
      <div className="nav-buttons" style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
        <Link to="/" className="active" style={{padding: '0.5rem 1rem', textDecoration: 'none'}}>Explore</Link>
        <Link to="/book/airlines" className="active" style={{padding: '0.5rem 1rem', textDecoration: 'none'}}>Book Flights</Link>
        <Link to="/book/hotels" className="active" style={{padding: '0.5rem 1rem', textDecoration: 'none'}}>Book Hotels</Link>
        {user ? (
          <>
            <span style={{marginLeft: '1rem', color: '#fff', fontWeight: 'bold'}}>{user.name}</span>
            <button onClick={logout} style={{background: 'rgba(255,255,255,0.2)', padding: '0.5rem 1rem'}}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={{color: 'white', textDecoration: 'none', marginLeft: '1rem'}}>Login</Link>
            <Link to="/signup" className="active" style={{padding: '0.5rem 1rem', textDecoration: 'none'}}>Sign Up</Link>
          </>
        )}
      </div>
    </header>
  );
}
