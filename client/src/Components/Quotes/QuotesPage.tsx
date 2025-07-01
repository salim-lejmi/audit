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

  const availableFeatures = [
    'Gestion de la conformité',
    'Gestion de texte',
    'Plans d\'action',
    'Management Review (Revue)',
    'Statistiques et analyses',
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
      setError('Échec du chargement des plans d\'abonnement. Veuillez réessayer.');
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
      setSuccessMessage('Plan d\'abonnement créé avec succès');
      setShowCreateForm(false);
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
      setError(err.response?.data?.message || 'Échec de la création du plan d\'abonnement');
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      const response = await axios.put(`/api/subscription-plans/${editingPlan.planId}`, editingPlan);
      setPlans(plans.map(plan => plan.planId === editingPlan.planId ? response.data : plan));
      setSuccessMessage('Plan d\'abonnement mis à jour avec succès');
      setEditingPlan(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Échec de la mise à jour du plan d\'abonnement');
    }
  };

  const handleDeletePlan = async (planId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce plan d\'abonnement ?')) return;

    try {
      await axios.delete(`/api/subscription-plans/${planId}`);
      setPlans(plans.filter(plan => plan.planId !== planId));
      setSuccessMessage('Plan d\'abonnement supprimé avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Échec de la suppression du plan d\'abonnement');
    }
  };

  const togglePlanStatus = async (planId: number) => {
    try {
      const plan = plans.find(p => p.planId === planId);
      if (!plan) return;

      const updatedPlan = { ...plan, isActive: !plan.isActive };
      const response = await axios.put(`/api/subscription-plans/${planId}`, updatedPlan);
      setPlans(plans.map(p => p.planId === planId ? response.data : p));
      setSuccessMessage(`Plan ${updatedPlan.isActive ? 'activé' : 'désactivé'} avec succès`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Échec de la mise à jour du statut du plan');
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
    return new Intl.NumberFormat('fr-FR', {
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
        <h1 className="page-title">Gestion des plans d'abonnement</h1>
        <p className="page-subtitle">Gérez les prix et les fonctionnalités pour les abonnements d'entreprise</p>
      </div>

      {successMessage && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
          <button className="close-btn" onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="action-bar">
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <i className="fas fa-plus"></i>
          Créer un nouveau plan
        </button>
      </div>

      {showCreateForm && (
        <div className="plan-form-card">
          <div className="card-header">
            <h3>Créer un nouveau plan d'abonnement</h3>
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
                <label>Nom du plan</label>
                <input
                  type="text"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  placeholder="ex. Plan de base"
                  required
                />
              </div>
              <div className="form-group">
                <label>Prix de base ($)</label>
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
                <label>Limite d'utilisateurs</label>
                <input
                  type="number"
                  value={newPlan.userLimit}
                  onChange={(e) => setNewPlan({ ...newPlan, userLimit: parseInt(e.target.value) || 10 })}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Réduction (%)</label>
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
                <label>Taux de taxe (%)</label>
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
                placeholder="Description du plan..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Fonctionnalités</label>
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

            {newPlan.basePrice > 0 && (
              <div className="price-preview">
                <h4>Aperçu du prix</h4>
                <div className="price-breakdown">
                  <div className="price-item">
                    <span>Prix de base :</span>
                    <span>{formatCurrency(newPlan.basePrice)}</span>
                  </div>
                  {newPlan.discount > 0 && (
                    <div className="price-item discount">
                      <span>Réduction ({newPlan.discount}%) :</span>
                      <span>-{formatCurrency(newPlan.basePrice * newPlan.discount / 100)}</span>
                    </div>
                  )}
                  <div className="price-item">
                    <span>Taxe ({newPlan.taxRate}%) :</span>
                    <span>{formatCurrency(calculateFinalPrice(newPlan.basePrice, newPlan.discount, newPlan.taxRate).taxAmount)}</span>
                  </div>
                  <div className="price-item total">
                    <span>Prix final :</span>
                    <span>{formatCurrency(calculateFinalPrice(newPlan.basePrice, newPlan.discount, newPlan.taxRate).finalPrice)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary">
                Créer le plan
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="plans-container">
        {loading ? (
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            Chargement des plans...
          </div>
        ) : plans.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-clipboard-list"></i>
            <h3>Aucun plan d'abonnement trouvé</h3>
            <p>Créez votre premier plan d'abonnement pour commencer.</p>
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
                        {plan.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>

                  <div className="plan-pricing">
                    <div className="price-display">
                      <span className="currency">$</span>
                      <span className="amount">{pricing.finalPrice.toFixed(2)}</span>
                      <span className="period">/mois</span>
                    </div>
                    {plan.discount > 0 && (
                      <div className="original-price">
                        <span>Était {formatCurrency(plan.basePrice + (plan.basePrice * plan.taxRate / 100))}</span>
                        <span className="discount-badge">{plan.discount}% DE RÉDUCTION</span>
                      </div>
                    )}
                  </div>

                  <div className="plan-details">
                    {isEditing ? (
                      <form onSubmit={handleUpdatePlan} className="edit-form">
                        <div className="form-row">
                          <div className="form-group">
                            <label>Prix de base</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editingPlan.basePrice}
                              onChange={(e) => setEditingPlan({ ...editingPlan, basePrice: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Limite d'utilisateurs</label>
                            <input
                              type="number"
                              value={editingPlan.userLimit}
                              onChange={(e) => setEditingPlan({ ...editingPlan, userLimit: parseInt(e.target.value) || 10 })}
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Réduction (%)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editingPlan.discount}
                              onChange={(e) => setEditingPlan({ ...editingPlan, discount: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Taux de taxe (%)</label>
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
                          <label>Fonctionnalités</label>
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
                            Annuler
                          </button>
                          <button type="submit" className="btn btn-primary">
                            Enregistrer les modifications
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="plan-info">
                          <div className="info-item">
                            <i className="fas fa-users"></i>
                            <span>Jusqu'à {plan.userLimit} utilisateurs</span>
                          </div>
                          <div className="info-item">
                            <i className="fas fa-percentage"></i>
                            <span>Taxe : {plan.taxRate}%</span>
                          </div>
                          {plan.discount > 0 && (
                            <div className="info-item">
                              <i className="fas fa-tag"></i>
                              <span>Réduction de {plan.discount}% appliquée</span>
                            </div>
                          )}
                        </div>

                        <div className="plan-description">
                          <p>{plan.description}</p>
                        </div>

                        <div className="plan-features">
                          <h4>Fonctionnalités incluses :</h4>
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
                        Modifier
                      </button>
                      <button
                        className={`btn ${plan.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                        onClick={() => togglePlanStatus(plan.planId)}
                      >
                        <i className={`fas ${plan.isActive ? 'fa-pause' : 'fa-play'}`}></i>
                        {plan.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDeletePlan(plan.planId)}
                      >
                        <i className="fas fa-trash"></i>
                        Supprimer
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