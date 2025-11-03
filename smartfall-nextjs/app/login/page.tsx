'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from "./login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push('/user-dashboard/page'); // redirect after login
    }
  };

  return (
    <div className={styles.loginContainer}>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}
      </form>

       <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        Don't have an account?{' '}
        <button
        type="button"
          onClick={() => {
            console.log('Going to signup');
            router.push('/signup');
            }}

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

