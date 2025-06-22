import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Quotes.css';

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

// Add a separate interface for the new plan form
interface NewSubscriptionPlan {
  name: string;
  description: string;
  basePrice: number;
  userLimit: number;
  discount: number;
  taxRate: number;
  features: string[];
  isActive: boolean;
}

const QuotesPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Use the specific interface instead of Partial<SubscriptionPlan>
  const [newPlan, setNewPlan] = useState<NewSubscriptionPlan>({
    name: '',
    description: '',
    basePrice: 0,
    userLimit: 10,
    discount: 0,
    taxRate: 20,
    features: [],
    isActive: true
  });

  // Predefined feature options
  const availableFeatures = [
    'Compliance Management',
    'Text Management',
    'Action Plans',
    'Management Review (Revue)',
    'Statistics & Analytics',
  ];

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/subscription-plans');
      setPlans(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load subscription plans. Please try again.');
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/subscription-plans', newPlan);
      setPlans([...plans, response.data]);
      setSuccessMessage('Subscription plan created successfully');
      setShowCreateForm(false);
      // Reset form with proper typing
      setNewPlan({
        name: '',
        description: '',
        basePrice: 0,
        userLimit: 10,
        discount: 0,
        taxRate: 20,
        features: [],
        isActive: true
      });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create subscription plan');
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      const response = await axios.put(`/api/subscription-plans/${editingPlan.planId}`, editingPlan);
      setPlans(plans.map(plan => plan.planId === editingPlan.planId ? response.data : plan));
      setSuccessMessage('Subscription plan updated successfully');
      setEditingPlan(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update subscription plan');
    }
  };

  const handleDeletePlan = async (planId: number) => {
    if (!window.confirm('Are you sure you want to delete this subscription plan?')) return;

    try {
      await axios.delete(`/api/subscription-plans/${planId}`);
      setPlans(plans.filter(plan => plan.planId !== planId));
      setSuccessMessage('Subscription plan deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete subscription plan');
    }
  };

  const togglePlanStatus = async (planId: number) => {
    try {
      const plan = plans.find(p => p.planId === planId);
      if (!plan) return;

      const updatedPlan = { ...plan, isActive: !plan.isActive };
      const response = await axios.put(`/api/subscription-plans/${planId}`, updatedPlan);
      setPlans(plans.map(p => p.planId === planId ? response.data : p));
      setSuccessMessage(`Plan ${updatedPlan.isActive ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update plan status');
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

  const handleFeatureToggle = (feature: string, isEditing: boolean = false) => {
    if (isEditing && editingPlan) {
      const features = editingPlan.features.includes(feature)
        ? editingPlan.features.filter(f => f !== feature)
        : [...editingPlan.features, feature];
      setEditingPlan({ ...editingPlan, features });
    } else {
      const features = newPlan.features.includes(feature)
        ? newPlan.features.filter(f => f !== feature)
        : [...newPlan.features, feature];
      setNewPlan({ ...newPlan, features });
    }
  };

  return (
    <div className="quotes-page">
      <div className="page-header">
        <h1 className="page-title">Subscription Plans Management</h1>
        <p className="page-subtitle">Manage pricing and features for company subscriptions</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i>
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
          <button className="close-btn" onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-bar">
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <i className="fas fa-plus"></i>
          Create New Plan
        </button>
      </div>

      {/* Create Plan Form */}
      {showCreateForm && (
        <div className="plan-form-card">
          <div className="card-header">
            <h3>Create New Subscription Plan</h3>
            <button 
              className="close-btn"
              onClick={() => setShowCreateForm(false)}
            >
              ×
            </button>
          </div>
          <form onSubmit={handleCreatePlan} className="plan-form">
            <div className="form-row">
              <div className="form-group">
                <label>Plan Name</label>
                <input
                  type="text"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  placeholder="e.g., Basic Plan"
                  required
                />
              </div>
              <div className="form-group">
                <label>Base Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPlan.basePrice}
                  onChange={(e) => setNewPlan({ ...newPlan, basePrice: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>User Limit</label>
                <input
                  type="number"
                  value={newPlan.userLimit}
                  onChange={(e) => setNewPlan({ ...newPlan, userLimit: parseInt(e.target.value) || 10 })}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Discount (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPlan.discount}
                  onChange={(e) => setNewPlan({ ...newPlan, discount: parseFloat(e.target.value) || 0 })}
                  min="0"
                  max="100"
                />
              </div>
              <div className="form-group">
                <label>Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPlan.taxRate}
                  onChange={(e) => setNewPlan({ ...newPlan, taxRate: parseFloat(e.target.value) || 20 })}
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                placeholder="Plan description..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Features</label>
              <div className="features-grid">
                {availableFeatures.map(feature => (
                  <label key={feature} className="feature-checkbox">
                    <input
                      type="checkbox"
                      checked={newPlan.features.includes(feature)}
                      onChange={() => handleFeatureToggle(feature)}
                    />
                    <span>{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Preview */}
            {newPlan.basePrice > 0 && (
              <div className="price-preview">
                <h4>Price Preview</h4>
                <div className="price-breakdown">
                  <div className="price-item">
                    <span>Base Price:</span>
                    <span>{formatCurrency(newPlan.basePrice)}</span>
                  </div>
                  {newPlan.discount > 0 && (
                    <div className="price-item discount">
                      <span>Discount ({newPlan.discount}%):</span>
                      <span>-{formatCurrency(newPlan.basePrice * newPlan.discount / 100)}</span>
                    </div>
                  )}
                  <div className="price-item">
                    <span>Tax ({newPlan.taxRate}%):</span>
                    <span>{formatCurrency(calculateFinalPrice(newPlan.basePrice, newPlan.discount, newPlan.taxRate).taxAmount)}</span>
                  </div>
                  <div className="price-item total">
                    <span>Final Price:</span>
                    <span>{formatCurrency(calculateFinalPrice(newPlan.basePrice, newPlan.discount, newPlan.taxRate).finalPrice)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create Plan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans Grid */}
      <div className="plans-container">
        {loading ? (
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            Loading plans...
          </div>
        ) : plans.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-clipboard-list"></i>
            <h3>No subscription plans found</h3>
            <p>Create your first subscription plan to get started.</p>
          </div>
        ) : (
          <div className="plans-grid">
            {plans.map(plan => {
              const pricing = calculateFinalPrice(plan.basePrice, plan.discount, plan.taxRate);
              const isEditing = editingPlan?.planId === plan.planId;

              return (
                <div key={plan.planId} className={`plan-card ${!plan.isActive ? 'inactive' : ''}`}>
                  <div className="plan-header">
                    <div className="plan-title">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingPlan.name}
                          onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                          className="edit-input"
                        />
                      ) : (
                        <h3>{plan.name}</h3>
                      )}
                    </div>
                    <div className="plan-status">
                      <span className={`status-badge ${plan.isActive ? 'active' : 'inactive'}`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
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
                    {isEditing ? (
                      <form onSubmit={handleUpdatePlan} className="edit-form">
                        <div className="form-row">
                          <div className="form-group">
                            <label>Base Price</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editingPlan.basePrice}
                              onChange={(e) => setEditingPlan({ ...editingPlan, basePrice: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="form-group">
                            <label>User Limit</label>
                            <input
                              type="number"
                              value={editingPlan.userLimit}
                              onChange={(e) => setEditingPlan({ ...editingPlan, userLimit: parseInt(e.target.value) || 10 })}
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Discount (%)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editingPlan.discount}
                              onChange={(e) => setEditingPlan({ ...editingPlan, discount: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Tax Rate (%)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editingPlan.taxRate}
                              onChange={(e) => setEditingPlan({ ...editingPlan, taxRate: parseFloat(e.target.value) || 20 })}
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Description</label>
                          <textarea
                            value={editingPlan.description}
                            onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <div className="form-group">
                          <label>Features</label>
                          <div className="features-grid">
                            {availableFeatures.map(feature => (
                              <label key={feature} className="feature-checkbox">
                                <input
                                  type="checkbox"
                                  checked={editingPlan.features.includes(feature)}
                                  onChange={() => handleFeatureToggle(feature, true)}
                                />
                                <span>{feature}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="form-actions">
                          <button type="button" className="btn btn-secondary" onClick={() => setEditingPlan(null)}>
                            Cancel
                          </button>
                          <button type="submit" className="btn btn-primary">
                            Save Changes
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="plan-info">
                          <div className="info-item">
                            <i className="fas fa-users"></i>
                            <span>Up to {plan.userLimit} users</span>
                          </div>
                          <div className="info-item">
                            <i className="fas fa-percentage"></i>
                            <span>Tax: {plan.taxRate}%</span>
                          </div>
                          {plan.discount > 0 && (
                            <div className="info-item">
                              <i className="fas fa-tag"></i>
                              <span>{plan.discount}% discount applied</span>
                            </div>
                          )}
                        </div>

                        <div className="plan-description">
                          <p>{plan.description}</p>
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
                      </>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="plan-actions">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => setEditingPlan(plan)}
                      >
                        <i className="fas fa-edit"></i>
                        Edit
                      </button>
                      <button
                        className={`btn ${plan.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                        onClick={() => togglePlanStatus(plan.planId)}
                      >
                        <i className={`fas ${plan.isActive ? 'fa-pause' : 'fa-play'}`}></i>
                        {plan.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDeletePlan(plan.planId)}
                      >
                        <i className="fas fa-trash"></i>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotesPage;