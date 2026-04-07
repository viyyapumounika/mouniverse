import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:5000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.msg || 'Login failed');
            }

            const userData = await response.json();

            // After successful login, check for an active subscription
            const subResponse = await fetch(`http://localhost:5000/check-subscription/${userData.id}`);
            const subData = await subResponse.json();

            // Store user data in localStorage
            const userToStore = { ...userData, subscription: subData.subscription || null };
            localStorage.setItem('user', JSON.stringify(userToStore));
            localStorage.setItem('login', 'true');

            // Notify the parent App component that login was successful
            onLoginSuccess(userToStore);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-container">
            <div className="bg"></div>
            <div className="auth-box">
                <h1 className="title">Sign In</h1>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    {error && <p className="msg" style={{ color: 'red' }}>{error}</p>}
                    <button type="submit" className="btn">Sign In</button>
                </form>
                <p onClick={() => window.location.href = '/register'}>
                    New to MouniVerse? <strong>Register</strong>
                </p>
            </div>
        </div>
    );
}

export default Login;