import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const nav = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
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
        <h2 style={{color: 'var(--text-primary)', marginBottom: '0.5rem'}}>Welcome Back</h2>
        <p style={{color: 'var(--text-muted)', marginBottom: '1.5rem'}}>Sign in to book amazing travels.</p>
        
        {error && <div style={{color: '#ff6b6b', background: 'rgba(255,0,0,0.1)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem'}}>{error}</div>}
        
        <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
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
          <button type="submit" className="search-btn" style={{width: '100%', marginTop: '0.5rem'}}>Log In</button>
        </form>
        
        <p style={{textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)'}}>
          Don't have an account? <Link to="/signup" style={{color: 'var(--primary)'}}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
