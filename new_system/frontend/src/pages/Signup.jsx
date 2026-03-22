import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup({ setUser }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const nav = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3002/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        nav('/');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Network error connecting to API');
    }
  };

  return (
    <div style={{display: 'flex', justifyContent: 'center', marginTop: '4rem'}}>
      <div className="card" style={{width: '100%', maxWidth: '400px'}}>
        <h2 style={{color: 'var(--text-primary)', marginBottom: '0.5rem'}}>Create Account</h2>
        <p style={{color: 'var(--text-muted)', marginBottom: '1.5rem'}}>Join the modern travel experience.</p>
        
        {error && <div style={{color: '#ff6b6b', background: 'rgba(255,0,0,0.1)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem'}}>{error}</div>}
        
        <form onSubmit={handleSignup} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <input 
            type="text" 
            placeholder="Full Name" 
            className="search-input" 
            style={{background: 'rgba(255,255,255,0.05)'}}
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
          />
          <input 
            type="email" 
            placeholder="Email Address" 
            className="search-input" 
            style={{background: 'rgba(255,255,255,0.05)'}}
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="search-input" 
            style={{background: 'rgba(255,255,255,0.05)'}}
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" className="search-btn" style={{width: '100%', marginTop: '0.5rem'}}>Sign Up</button>
        </form>
        
        <p style={{textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)'}}>
          Already have an account? <Link to="/login" style={{color: 'var(--primary)'}}>Log In</Link>
        </p>
      </div>
    </div>
  );
}
