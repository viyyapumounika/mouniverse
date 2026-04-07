import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SubscriptionPlan.css';

const SubscriptionPlan = () => {
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);

    const user = JSON.parse(localStorage.getItem('user')) || {};
    const currentPlanId = user?.subscription?.plan_id;

    useEffect(() => {
        fetch('http://localhost:5000/api/plans')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPlans(data);
                }
            })
            .catch(err => console.error("Failed to fetch plans:", err));
    }, []);

    const handleSelectPlan = (plan) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
            alert('User session not found. Please log in again.');
            navigate('/login');
            return;
        }

        // For a free plan, we can bypass the payment form.
        if (plan.price == 0) { // Use == to catch 0 and "0.00"
            fetch('http://localhost:5000/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, plan_id: plan.plan_id, name: user.name, email: user.email, upi_id: 'N/A' }),
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('Free plan activated!');
                    if (data.subscription) {
                        const updatedUser = { ...user, subscription: data.subscription };
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                    }
                    // Navigate and reload to reflect subscription status immediately
                    window.location.href = '/';
                } else {
                    alert(data.message || 'Could not activate free plan.');
                }
            });
        } else {
            // For paid plans, navigate to the payment page
            navigate('/payment', { state: { plan } });
        }
    };

    return (
        <div className="subscription-container">
            <h1>Choose Your Plan</h1>
            {plans.length === 0 && <p>Loading plans...</p>}
            <div className="plans-wrapper">
                {plans.map((plan) => (
                    <div key={plan.plan_id} className={`plan-card ${plan.plan_name === 'Standard' ? 'popular' : ''}`}>
                        <h2>{plan.plan_name}</h2>
                        <p className="price">${plan.price}</p>
                        <div className="plan-features">
                            <div className="feature-item">
                                <span className="feature-label">Video Quality</span>
                                <span className="feature-value quality">{plan.video_quality || 'Good'}</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-label">Resolution</span>
                                <span className="feature-value">{plan.resolution || '480p'}</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-label">Supported Devices</span>
                                <span className="feature-value">{plan.supported_devices || 'Mobile, Tablet'}</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-label">Ads</span>
                                <span className="feature-value">{plan.is_ads_free ? 'Ad-free' : 'With Ads'}</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-label">Screens</span>
                                <span className="feature-value">{plan.screens || 1}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleSelectPlan(plan)}
                            disabled={currentPlanId === plan.plan_id}
                            style={currentPlanId === plan.plan_id ? { backgroundColor: '#555', cursor: 'not-allowed' } : {}}
                        >
                            {currentPlanId === plan.plan_id ? 'Current Plan' : (plan.price == 0 ? 'Continue with Free' : 'Upgrade')}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SubscriptionPlan;