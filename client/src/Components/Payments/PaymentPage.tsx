import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import '../../styles/Payments.css';

interface SubscriptionPlan {
  planId: number;
  name: string;
  description: string;
  basePrice: number;
  userLimit: number;
  discount: number;
  taxRate: number;
  features: string[];
  isActive: boolean;
}

interface CompanySubscription {
  hasSubscription: boolean;
  subscription?: {
    subscriptionId: number;
    planName: string;
    planId: number;
    status: string;
    startDate: string;
    endDate: string;
    userLimit: number;
    features: string[];
  };
}

const stripePromise = loadStripe(
  'pk_test_51Rcc2sP8fwhwDaczifQWFYKTjWXiTG3nSFl82qm7jGByOZYhWGNxWZ1QxxStLksMxgan9bQy7KJYzO6SsjXLQpOF00ufQluHRU'
);

const PaymentPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CompanySubscription>({ hasSubscription: false });
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  useEffect(() => {
    fetchPlansAndSubscription();
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      setVerifyingPayment(true);
      await verifyPayment(sessionId);
      setVerifyingPayment(false);
    } else if (paymentStatus === 'canceled') {
      setError('Payment was canceled. Please try again.');
    }
  };

  const verifyPayment = async (sessionId: string) => {
    try {
      console.log('Verifying payment for session:', sessionId);
      const response = await axios.get(`/api/payments/verify-session/${sessionId}`);
      
      if (response.data.success) {
        setSuccessMessage('Payment successful! Your subscription has been activated.');
        await fetchPlansAndSubscription(); // Refresh data
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Refresh the page after a delay to ensure all data is updated
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError('Payment verification failed. Please contact support if your payment was processed.');
      }
    } catch (err: any) {
      console.error('Payment verification error:', err);
      setError('Failed to verify payment. Please contact support if your payment was processed.');
    }
  };

  const fetchPlansAndSubscription = async () => {
    try {
      setLoading(true);
      const [plansResponse, subscriptionResponse] = await Promise.all([
        axios.get('/api/subscription-plans'),
        axios.get('/api/payments/company-subscription')
      ]);
      
      console.log('Subscription response:', subscriptionResponse.data);
      
      setPlans(plansResponse.data.filter((plan: SubscriptionPlan) => plan.isActive));
      setCurrentSubscription(subscriptionResponse.data);
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load subscription data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: number) => {
    try {
      setProcessingPayment(planId);
      const response = await axios.post('/api/payments/create-checkout-session', {
        planId: planId
      });

      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: response.data.sessionId
        });

        if (error) {
          setError('Payment failed: ' + error.message);
        }
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setProcessingPayment(null);
    }
  };

  const calculateFinalPrice = (basePrice: number, discount: number, taxRate: number) => {
    const discountedPrice = basePrice * (1 - discount / 100);
    const taxAmount = discountedPrice * (taxRate / 100);
    return {
      discountedPrice,
      taxAmount,
      finalPrice: discountedPrice + taxAmount
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="payment-page">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          Loading subscription data...
        </div>
      </div>
    );
  }

  if (verifyingPayment) {
    return (
      <div className="payment-page">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          Verifying your payment and activating subscription...
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="page-header">
        <h1 className="page-title">Subscription Management</h1>
        <p className="page-subtitle">Choose the perfect plan for your business needs</p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i>
          {successMessage}
          <button className="close-btn" onClick={() => setSuccessMessage('')}>×</button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
          <button className="close-btn" onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Current Subscription Status */}
      {currentSubscription.hasSubscription && (
        <div className="current-subscription">
          <div className="subscription-card">
            <div className="subscription-header">
              <h3>Current Subscription</h3>
              <span className={`status-badge ${currentSubscription.subscription?.status}`}>
                {currentSubscription.subscription?.status}
              </span>
            </div>
            <div className="subscription-details">
              <div className="detail-item">
                <span className="label">Plan:</span>
                <span className="value">{currentSubscription.subscription?.planName}</span>
              </div>
              <div className="detail-item">
                <span className="label">User Limit:</span>
                <span className="value">{currentSubscription.subscription?.userLimit} users</span>
              </div>
              <div className="detail-item">
                <span className="label">Valid Until:</span>
                <span className="value">{formatDate(currentSubscription.subscription?.endDate || '')}</span>
              </div>
            </div>
            <div className="subscription-features">
              <h4>Active Features:</h4>
              <div className="features-list">
                {currentSubscription.subscription?.features.map((feature, index) => (
                  <span key={index} className="feature-tag">
                    <i className="fas fa-check"></i>
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className="plans-section">
        <h2>Available Plans</h2>
        <div className="plans-grid">
          {plans.map(plan => {
            const pricing = calculateFinalPrice(plan.basePrice, plan.discount, plan.taxRate);
            const isCurrentPlan = currentSubscription.subscription?.planId === plan.planId;
            const isProcessing = processingPayment === plan.planId;

            return (
              <div key={plan.planId} className={`plan-card ${isCurrentPlan ? 'current-plan' : ''}`}>
                <div className="plan-header">
                  <h3 className="plan-name">{plan.name}</h3>
                  {isCurrentPlan && <span className="current-badge">Current Plan</span>}
                </div>

                <div className="plan-pricing">
                  <div className="price-display">
                    <span className="currency">$</span>
                    <span className="amount">{pricing.finalPrice.toFixed(2)}</span>
                    <span className="period">/month</span>
                  </div>
                  {plan.discount > 0 && (
                    <div className="original-price">
                      <span>Was {formatCurrency(plan.basePrice + (plan.basePrice * plan.taxRate / 100))}</span>
                      <span className="discount-badge">{plan.discount}% OFF</span>
                    </div>
                  )}
                </div>

                <div className="plan-details">
                  <p className="plan-description">{plan.description}</p>
                  
                  <div className="plan-specs">
                    <div className="spec-item">
                      <i className="fas fa-users"></i>
                      <span>Up to {plan.userLimit} users</span>
                    </div>
                    <div className="spec-item">
                      <i className="fas fa-shield-alt"></i>
                      <span>Enterprise Security</span>
                    </div>
                    <div className="spec-item">
                      <i className="fas fa-headset"></i>
                      <span>24/7 Support</span>
                    </div>
                  </div>

                  <div className="plan-features">
                    <h4>Features included:</h4>
                    <ul>
                      {plan.features.map((feature, index) => (
                        <li key={index}>
                          <i className="fas fa-check"></i>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="price-breakdown">
                    <div className="breakdown-item">
                      <span>Base Price:</span>
                      <span>{formatCurrency(plan.basePrice)}</span>
                    </div>
                    {plan.discount > 0 && (
                      <div className="breakdown-item discount">
                        <span>Discount ({plan.discount}%):</span>
                        <span>-{formatCurrency(plan.basePrice * plan.discount / 100)}</span>
                      </div>
                    )}
                    <div className="breakdown-item">
                      <span>Tax ({plan.taxRate}%):</span>
                      <span>{formatCurrency(pricing.taxAmount)}</span>
                    </div>
                    <div className="breakdown-item total">
                      <span>Total:</span>
                      <span>{formatCurrency(pricing.finalPrice)}</span>
                    </div>
                  </div>
                </div>

                <div className="plan-action">
                  {isCurrentPlan ? (
                    <button className="btn btn-current" disabled>
                      <i className="fas fa-check"></i>
                      Current Plan
                    </button>
                  ) : (
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleSubscribe(plan.planId)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-credit-card"></i>
                          Subscribe Now
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Notice */}
      <div className="security-notice">
        <div className="notice-content">
          <i className="fas fa-shield-alt"></i>
          <div>
            <h4>Secure Payments</h4>
            <p>All payments are processed securely through Stripe. We never store your payment information.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;