import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css'; // Reusing login styles

function Register() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:5000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (data.success) {
                alert('Registration successful! Please log in.');
                navigate('/login');
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-container">
            <div className="bg"></div>
            <div className="auth-box">
                <h1 className="title">Sign Up</h1>
                <form onSubmit={handleRegister}>
                    <div className="input-group">
                        <label>Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    {error && <p className="msg" style={{ color: 'red' }}>{error}</p>}
                    <button type="submit" className="btn">Sign Up</button>
                </form>
                <p onClick={() => navigate('/login')}>
                    Already have an account? <strong>Sign In.</strong>
                </p>
            </div>
        </div>
    );
}

export default Register;