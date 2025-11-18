'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from "./login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('Login successful:', data.user);
        
        // Navigate to dashboard
         if (data.user.account_type === 'caregiver') {
          router.push('/caregiver-dashboard');
        } else if (data.user.account_type === 'user') {
          router.push('/user-dashboard');
        } else {
          // Fallback for unexpected account types
          setError('Invalid account type');
        }
      }  else {
        // Show error message
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <h1>Login</h1>
      
      {error && (
        <div style={{
          color: 'red',
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor: '#fee',
          borderRadius: '4px',
          border: '1px solid #fcc'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin}> 
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => router.push('/signup')}
          style={{
            background: 'none',
            border: 'none',
            color: '#111a96',
            fontWeight: '600',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Sign Up
        </button>
      </p>
    </div>
  );
}

