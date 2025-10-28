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
interface ActionableUpdates {
  basePrice?: number;
  discount?: number;
  userLimit?: number;
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

interface PlanTemplate {
  id: string;
  name: string;
  description: string;
  planData: NewSubscriptionPlan;
}

interface PlanSuggestion {
  planId: number;
  planName: string;
  currentMetrics: {
    adoptionRate: number;
    avgUsers: number;
    subscribers: number;
  };
  insights: string[];
  recommendations: string[];
  suggestedChanges: {
    [key: string]: any;
  };
  actionableUpdates?: ActionableUpdates;  // ✨ NEW
  priorityScore: number;
  riskLevel: string;
}
interface MarketInsight {
  type: string;
  icon: string;
  text: string;
  status: string;
}

interface AnalysisResult {
  planSuggestions: PlanSuggestion[];
  marketInsights: MarketInsight[];
  analysisDate: string;
  methodology: string;
  globalMetrics: {
    actionCompletionRate?: number;
    complianceRate?: number;
    avgUsersPerCompany?: number;
    totalActiveCompanies?: number;
  };
}

const QuotesPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTemplateDrawer, setShowTemplateDrawer] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // NLP Analysis states
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
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

  const planTemplates: PlanTemplate[] = [
    {
      id: 'basic',
      name: 'Plan de Base',
      description: 'Idéal pour les petites équipes qui débutent',
      planData: {
        name: 'Plan de Base',
        description: 'Plan d\'entrée de gamme avec les fonctionnalités essentielles pour démarrer votre gestion de conformité.',
        basePrice: 29.99,
        userLimit: 15,
        discount: 0,
        taxRate: 20,
        features: [
          'Gestion de la conformité',
          'Gestion de texte',
          'Plans d\'action',
          'Management Review (Revue)'
        ],
        isActive: true
      }
    },
    {
      id: 'professional',
      name: 'Plan Professionnel',
      description: 'Pour les équipes en croissance',
      planData: {
        name: 'Plan Professionnel',
        description: 'Solution complète pour les équipes professionnelles avec plus d\'utilisateurs et fonctionnalités avancées.',
        basePrice: 79.99,
        userLimit: 75,
        discount: 10,
        taxRate: 20,
        features: [
          'Gestion de la conformité',
          'Gestion de texte',
          'Plans d\'action',
          'Management Review (Revue)'
        ],
        isActive: true
      }
    },
    {
      id: 'premium',
      name: 'Plan Premium',
      description: 'Solution complète pour les grandes entreprises',
      planData: {
        name: 'Plan Premium',
        description: 'Solution enterprise avec toutes les fonctionnalités, statistiques avancées et support prioritaire.',
        basePrice: 149.99,
        userLimit: 250,
        discount: 15,
        taxRate: 20,
        features: [
          'Gestion de la conformité',
          'Gestion de texte',
          'Plans d\'action',
          'Management Review (Revue)',
          'Statistiques et analyses'
        ],
        isActive: true
      }
    }
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
const handleApplySuggestion = async (planId: number, updates: ActionableUpdates) => {
  if (!window.confirm('Êtes-vous sûr de vouloir appliquer ces changements au plan ?')) {
    return;
  }

  try {
    console.log('🔄 Applying changes to plan:', planId, updates);
    
    // Get the current plan
    const currentPlan = plans.find(p => p.planId === planId);
    if (!currentPlan) {
      setError('Plan non trouvé');
      return;
    }

    // Merge updates with current plan
    const updatedPlan = {
      ...currentPlan,
      ...updates
    };

    // Send update to backend
    const response = await axios.put(`/api/subscription-plans/${planId}`, updatedPlan);
    
    // Update local state
    setPlans(plans.map(p => p.planId === planId ? response.data : p));
    
    setSuccessMessage('Changements appliqués avec succès!');
    
    // Close modal and refresh analysis
    setShowAnalysisModal(false);
    setTimeout(() => {
      setSuccessMessage('');
      // Optionally regenerate analysis
      // handleGenerateAnalysis();
    }, 3000);
    
  } catch (err: any) {
    console.error('❌ Error applying changes:', err);
    setError('Erreur lors de l\'application des changements: ' + (err.response?.data?.message || err.message));
  }
};

  // Helper functions for styling - DEFINE BEFORE handleGenerateAnalysis
  const getRiskBadgeClass = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'risk-badge-critical';
      case 'high':
        return 'risk-badge-high';
      case 'medium':
        return 'risk-badge-medium';
      default:
        return 'risk-badge-low';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'good':
        return 'status-badge-good';
      case 'warning':
        return 'status-badge-warning';
      case 'critical':
        return 'status-badge-critical';
      default:
        return 'status-badge-info';
    }
  };

  const handleGenerateAnalysis = async () => {
    try {
      console.log('🔹 Starting analysis generation...');
      setAnalysisLoading(true);
      setShowAnalysisModal(true);
      setAnalysisResult(null);
      
      // Fetch subscription insights
      console.log('➡️ Fetching subscription insights...');
      const statsResponse = await axios.get('/api/statistics/subscription-insights');
      console.log('✅ Statistics received:', statsResponse.data);
      const statistics = statsResponse.data;
      
      // Prepare plans data for analysis
      const plansForAnalysis = plans.map(plan => ({
        planId: plan.planId,
        name: plan.name,
        basePrice: plan.basePrice,
        userLimit: plan.userLimit,
        discount: plan.discount,
        features: plan.features
      }));
      
      console.log('➡️ Calling Flask NLP service...');
      console.log('📊 Sending data:', { statistics, plans: plansForAnalysis });
      
      // Call Flask NLP service
      const analysisResponse = await axios.post('http://localhost:5000/analyze-subscription-performance', {
        statistics: statistics,
        plans: plansForAnalysis
      });
      
      console.log('✅ Analysis response:', analysisResponse.data);
      
      if (analysisResponse.data.success) {
        setAnalysisResult(analysisResponse.data.analysis);
        console.log('✅ Analysis result set successfully');
      } else {
        setError('Échec de l\'analyse NLP. Veuillez réessayer.');
        console.error('❌ Analysis failed:', analysisResponse.data);
      }
    } catch (err: any) {
      console.error('❌ Error generating analysis:', err);
      console.log('🔍 Error response data:', err.response?.data);
      setError('Erreur lors de la génération de l\'analyse: ' + (err.response?.data?.message || err.message));
    } finally {
      setAnalysisLoading(false);
      console.log('🏁 Analysis generation complete');
    }
  };

  const handleTemplateSelect = (template: PlanTemplate) => {
    setSelectedTemplate(template.id);
    setNewPlan(template.planData);
    setShowTemplateDrawer(false);
  };

  const resetForm = () => {
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
    setSelectedTemplate(null);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/subscription-plans', newPlan);
      setPlans([...plans, response.data]);
      setSuccessMessage('Plan d\'abonnement créé avec succès');
      setShowCreateForm(false);
      resetForm();
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
          className="btn-q btn-q-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <i className="fas fa-plus"></i>
          Créer un nouveau plan
        </button>
        
        <button 
          className="btn-q btn-q-secondary"
          onClick={handleGenerateAnalysis}
          disabled={plans.length === 0}
        >
          <i className="fas fa-brain"></i>
          Générer des suggestions NLP
        </button>
      </div>

      {/* Analysis Modal */}
      {showAnalysisModal && (
        <div className="modal-overlay" onClick={() => setShowAnalysisModal(false)}>
          <div className="analysis-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fas fa-brain"></i>
                Analyse NLP des Plans d'Abonnement
              </h2>
              <button className="close-btn" onClick={() => setShowAnalysisModal(false)}>×</button>
            </div>
            
            <div className="modal-content">
              {analysisLoading ? (
                <div className="loading-spinner">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Analyse en cours... Traitement des données avec NLP</p>
                </div>
              ) : analysisResult ? (
                <>
                  {/* Global Metrics */}
                  {analysisResult.globalMetrics && (
                    <div className="global-metrics">
                      <h3>Métriques Globales</h3>
                      <div className="metrics-grid">
                        {analysisResult.globalMetrics.actionCompletionRate !== undefined && (
                          <div className="metric-card">
                            <i className="fas fa-tasks"></i>
                            <span className="metric-value">{analysisResult.globalMetrics.actionCompletionRate}%</span>
                            <span className="metric-label">Taux de complétion</span>
                          </div>
                        )}
                        {analysisResult.globalMetrics.complianceRate !== undefined && (
                          <div className="metric-card">
                            <i className="fas fa-check-circle"></i>
                            <span className="metric-value">{analysisResult.globalMetrics.complianceRate}%</span>
                            <span className="metric-label">Taux de conformité</span>
                          </div>
                        )}
                        {analysisResult.globalMetrics.avgUsersPerCompany !== undefined && (
                          <div className="metric-card">
                            <i className="fas fa-users"></i>
                            <span className="metric-value">{analysisResult.globalMetrics.avgUsersPerCompany.toFixed(1)}</span>
                            <span className="metric-label">Moy. utilisateurs/entreprise</span>
                          </div>
                        )}
                        {analysisResult.globalMetrics.totalActiveCompanies !== undefined && (
                          <div className="metric-card">
                            <i className="fas fa-building"></i>
                            <span className="metric-value">{analysisResult.globalMetrics.totalActiveCompanies}</span>
                            <span className="metric-label">Entreprises actives</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Market Insights */}
                  {analysisResult.marketInsights && analysisResult.marketInsights.length > 0 && (
                    <div className="market-insights">
                      <h3>Insights du Marché</h3>
                      <div className="insights-list">
                        {analysisResult.marketInsights.map((insight, index) => (
                          <div key={index} className={`insight-item ${getStatusBadgeClass(insight.status)}`}>
                            <span className="insight-icon">{insight.icon}</span>
                            <span className="insight-text">{insight.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Plan Suggestions */}
                  {analysisResult.planSuggestions && analysisResult.planSuggestions.length > 0 && (
                    <div className="plan-suggestions">
                      <h3>Suggestions par Plan (Triées par Priorité)</h3>
{analysisResult.planSuggestions.map((suggestion, index) => (
  <div key={index} className="suggestion-card">
    <div className="suggestion-header">
      <h4>{suggestion.planName}</h4>
      <div className="suggestion-badges">
        <span className={`priority-badge priority-${suggestion.priorityScore > 7 ? 'high' : suggestion.priorityScore > 4 ? 'medium' : 'low'}`}>
          Priorité: {suggestion.priorityScore}/10
        </span>
        <span className={`risk-badge ${getRiskBadgeClass(suggestion.riskLevel)}`}>
          Risque: {suggestion.riskLevel}
        </span>
      </div>
    </div>
                          {/* Current Metrics */}
                          <div className="current-metrics">
                            <div className="metric-item">
                              <i className="fas fa-chart-line"></i>
                              <span>Taux d'adoption: <strong>{suggestion.currentMetrics.adoptionRate}%</strong></span>
                            </div>
                            <div className="metric-item">
                              <i className="fas fa-users"></i>
                              <span>Moy. utilisateurs: <strong>{suggestion.currentMetrics.avgUsers}</strong></span>
                            </div>
                            <div className="metric-item">
                              <i className="fas fa-user-check"></i>
                              <span>Abonnés: <strong>{suggestion.currentMetrics.subscribers}</strong></span>
                            </div>
                          </div>

                          {/* Insights */}
                          {suggestion.insights && suggestion.insights.length > 0 && (
                            <div className="insights-section">
                              <h5><i className="fas fa-lightbulb"></i> Insights</h5>
                              <ul>
                                {suggestion.insights.map((insight, i) => (
                                  <li key={i}>{insight}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Recommendations */}
                          {suggestion.recommendations && suggestion.recommendations.length > 0 && (
                            <div className="recommendations-section">
                              <h5><i className="fas fa-clipboard-list"></i> Recommandations</h5>
                              <ul>
                                {suggestion.recommendations.map((rec, i) => (
                                  <li key={i}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Suggested Changes */}
    {suggestion.suggestedChanges && Object.keys(suggestion.suggestedChanges).length > 0 && (
      <div className="suggested-changes">
        <div className="changes-header">
          <h5><i className="fas fa-edit"></i> Changements Suggérés</h5>
          {suggestion.actionableUpdates && Object.keys(suggestion.actionableUpdates).length > 0 && (
            <button
              className="btn-apply-changes"
              onClick={() => handleApplySuggestion(suggestion.planId, suggestion.actionableUpdates!)}
            >
              <i className="fas fa-check-circle"></i>
              Appliquer tous les changements
            </button>
          )}
        </div>
        <div className="changes-grid">
          {Object.entries(suggestion.suggestedChanges).map(([key, value]) => (
            <div key={key} className="change-item">
              <strong>{key}:</strong>
              {typeof value === 'object' && value !== null ? (
                <div className="change-details">
                  {value.current !== undefined && <div>Actuel: {value.current}</div>}
                  {value.suggested !== undefined && <div className="suggested-value">Suggéré: {value.suggested}</div>}
                  {value.reason && <div className="change-reason"><em>{value.reason}</em></div>}
                </div>
              ) : (
                <span>{String(value)}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
))}                    </div>
                  )}

                  {/* Methodology */}
                  <div className="analysis-footer">
                    <p className="methodology">
                      <i className="fas fa-info-circle"></i>
                      <strong>Méthodologie:</strong> {analysisResult.methodology}
                    </p>
                    <p className="analysis-date">
                      <i className="fas fa-calendar"></i>
                      Généré le: {new Date(analysisResult.analysisDate).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </>
              ) : (
                <div className="no-analysis">
                  <i className="fas fa-exclamation-circle"></i>
                  <p>Aucune analyse disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Form - keeping your existing code */}
      {showCreateForm && (
        <div className="plan-form-card">
          <div className="card-header">
            <h3>Créer un nouveau plan d'abonnement</h3>
            <button 
              className="close-btn"
              onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}
            >
              ×
            </button>
          </div>

          {/* Template Drawer */}
          <div className="template-section">
            <div className="template-header">
              <button 
                className="template-toggle-btn"
                onClick={() => setShowTemplateDrawer(!showTemplateDrawer)}
              >
                <i className={`fas fa-chevron-${showTemplateDrawer ? 'up' : 'down'}`}></i>
                <span>Utiliser un modèle prédéfini</span>
                <span className="template-badge">Optionnel</span>
              </button>
            </div>

            {showTemplateDrawer && (
              <div className="template-drawer">
                <div className="template-grid">
                  {planTemplates.map((template) => (
                    <div 
                      key={template.id}
                      className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="template-header-info">
                        <h4>{template.name}</h4>
                      </div>
                      <p className="template-description">{template.description}</p>
                      <div className="template-highlights">
                        <div className="highlight-item">
                          <i className="fas fa-users"></i>
                          <span>{template.planData.userLimit} utilisateurs</span>
                        </div>
                        <div className="highlight-item">
                          <i className="fas fa-dollar-sign"></i>
                          <span>{formatCurrency(template.planData.basePrice)}/mois</span>
                        </div>
                        <div className="highlight-item">
                          <i className="fas fa-check"></i>
                          <span>{template.planData.features.length} fonctionnalités</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              <button type="button" className="btn-q btn-q-secondary" onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}>
                Annuler
              </button>
              <button type="submit" className="btn-q btn-q-primary">
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
                      <form onSubmit={handleUpdatePlan} className="edit-form-q">
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
                          <button type="button" className="btn-q btn-q-secondary" onClick={() => setEditingPlan(null)}>
                            Annuler
                          </button>
                          <button type="submit" className="btn-q btn-q-primary">
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
                        className="btn-q btn-q-outline-primary"
                        onClick={() => setEditingPlan(plan)}
                      >
                        <i className="fas fa-edit"></i>
                        Modifier
                      </button>
                      <button
                        className={`btn-q ${plan.isActive ? 'btn-q-outline-warning' : 'btn-q-outline-success'}`}
                        onClick={() => togglePlanStatus(plan.planId)}
                      >
                        <i className={`fas ${plan.isActive ? 'fa-pause' : 'fa-play'}`}></i>
                        {plan.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        className="btn-q btn-q-outline-danger"
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