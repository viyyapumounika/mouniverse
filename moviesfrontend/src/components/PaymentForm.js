import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PaymentForm.css';

const PaymentForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { plan } = location.state || { plan: { plan_name: 'Unknown', price: '0.00', plan_id: null } };
    const user = JSON.parse(localStorage.getItem('user'));

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        upi: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.password || !formData.upi) {
            alert('Please fill all fields.');
            return;
        }

        // This is a payment simulation.
        console.log('Simulating payment for:', formData);

        try {
            const response = await fetch('http://localhost:5000/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    plan_id: plan.plan_id,
                    name: formData.name,
                    email: formData.email,
                    upi_id: formData.upi,
                }),
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message || 'Payment successful! Your subscription is active.');
                if (result.subscription) {
                    const updatedUser = { ...user, subscription: result.subscription };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
                // Navigate and reload to reflect subscription status immediately
                window.location.href = '/';
            } else {
                alert(result.message || 'Subscription failed. Please try again.');
            }
        } catch (error) {
            console.error('Subscription error:', error);
            alert('An error occurred during subscription.');
        }
    };

    return (
        <div className="payment-container">
            <form className="payment-form" onSubmit={handleSubmit}>
                <h2>Complete Your Payment</h2>
                <p>You are subscribing to the <strong>{plan.plan_name}</strong> plan for <strong>${plan.price}</strong>.</p>
                <div className="input-group">
                    <label>Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label>Password (for confirmation)</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label>UPI ID</label>
                    <input type="text" name="upi" placeholder="yourname@bank" value={formData.upi} onChange={handleChange} required />
                </div>
                <button type="submit" className="btn-submit-payment">Pay & Subscribe</button>
            </form>
        </div>
    );
};

export default PaymentForm;