import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/subscriptiondashboard.css';

interface UserInfo {
  userName: string;
  role: string;
  companyName: string;
  industry: string;
  status: string;
  assignedActions: number;
  completedActions: number;
  pendingEvaluations: number;
  createdAt: string;
}

interface ActionTip {
  actionId: number;
  description: string;
  analysis: {
    priority_level: string;
    risk_assessment: string;
    recommended_tips: string[];
    estimated_effort: string;
    suggested_timeline: string;
    compliance_areas?: string[];
    key_stakeholders?: string[];
    success_metrics?: string[];
  };
}

const UserDashboard: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [actionTips, setActionTips] = useState<ActionTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingTips, setLoadingTips] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get('/api/company/user-dashboard-info');
        setUserInfo(response.data);
        setLoading(false);
        
        // Fetch AI tips for user's actions
        await fetchActionTips();
      } catch (error) {
        setError('Échec du chargement des informations utilisateur');
        setLoading(false);
        console.error(error);
      }
    };

    fetchUserInfo();
  }, []);

  const fetchActionTips = async () => {
    try {
      setLoadingTips(true);
      // Get user's recent actions
      const actionsResponse = await axios.get('/api/action-plan?pageSize=5');
      
      if (actionsResponse.data.actions && actionsResponse.data.actions.length > 0) {
        const tips: ActionTip[] = [];
        
        // Get tips for each action
        for (const action of actionsResponse.data.actions.slice(0, 3)) { // Limit to 3 most recent
          try {
            const tipsResponse = await axios.get(`/api/action-plan/${action.actionId}/tips`);
            if (tipsResponse.data.success && tipsResponse.data.tips && tipsResponse.data.tips.analysis) {
              tips.push({
                actionId: action.actionId,
                description: action.description,
                analysis: tipsResponse.data.tips.analysis
              });
            }
          } catch (tipError) {
            console.error(`Error fetching tips for action ${action.actionId}:`, tipError);
          }
        }
        
        setActionTips(tips);
      }
    } catch (error) {
      console.error('Error fetching action tips:', error);
    } finally {
      setLoadingTips(false);
    }
  };

  // Helper function to safely get priority level class
  const getPriorityClass = (priority: string) => {
    if (!priority) return 'medium';
    return priority.toLowerCase();
  };

  // Helper function to safely get status class
  const getStatusClass = (status: string) => {
    if (!status) return 'pending';
    return status.toLowerCase();
  };

  if (loading) {
    return <div className="loading-container">Chargement du tableau de bord...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Calculate completion percentage
  const assignedActions = userInfo?.assignedActions || 0;
  const completedActions = userInfo?.completedActions || 0;
  const completionPercentage = assignedActions > 0 
    ? Math.round((completedActions / assignedActions) * 100) 
    : 0;

  return (
    <section className="subscription-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h2>Bienvenue, {userInfo?.userName}</h2>
            <p className="text-muted">
              {userInfo?.role === 'Auditor' 
                ? 'Gérez vos actions assignées et évaluations de conformité' 
                : 'Accédez aux ressources de votre tableau de bord'}
            </p>
          </div>
        </div>

        {/* User Overview Card */}
        <div className="overview-card">
          <div className="card-header">
            <h5>Aperçu de l'Utilisateur</h5>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-column">
                <div className="info-item">
                  <span className="info-label">Nom :</span>
                  <span>{userInfo?.userName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Rôle :</span>
                  <span>{userInfo?.role}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Entreprise :</span>
                  <span>{userInfo?.companyName}</span>
                </div>
              </div>
              <div className="info-column">
                <div className="info-item">
                  <span className="info-label">Industrie :</span>
                  <span>{userInfo?.industry}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Statut :</span>
                  <span className={`status-badge ${getStatusClass(userInfo?.status || '')}`}>
                    {userInfo?.status}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Membre Depuis :</span>
                  <span>{userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString('fr-FR') : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI-Powered Tips Section */}
        <div className="overview-card">
          <div className="card-header">
            <h5>
              <i className="fas fa-robot" style={{ marginRight: '8px', color: '#007bff' }}></i>
              Conseils IA pour vos Actions
            </h5>
          </div>
          <div className="card-body">
            {loadingTips ? (
              <div className="loading-tips">
                <i className="fas fa-spinner fa-spin"></i> Analyse en cours...
              </div>
            ) : actionTips.length > 0 ? (
              <div className="tips-grid">
                {actionTips.map((tip, index) => (
                  <div key={tip.actionId} className="tip-card">
                    <div className="tip-header">
                      <span className={`priority-badge ${getPriorityClass(tip.analysis.priority_level)}`}>
                        {tip.analysis.priority_level || 'Medium'}
                      </span>
                      <span className="effort-badge">
                        {tip.analysis.estimated_effort || 'Medium'} effort
                      </span>
                    </div>
                    <div className="tip-content">
                      <h6>{tip.description && tip.description.length > 50 ? `${tip.description.substring(0, 50)}...` : tip.description}</h6>
                      <p className="risk-assessment">{tip.analysis.risk_assessment || 'Analyse en cours...'}</p>
                      
                      {tip.analysis.recommended_tips && tip.analysis.recommended_tips.length > 0 && (
                        <div className="recommended-tips">
                          <strong>Conseils recommandés:</strong>
                          <ul>
                            {tip.analysis.recommended_tips.slice(0, 3).map((tipText, i) => (
                              <li key={i}>{tipText}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="timeline">
                        <strong>Délai suggéré:</strong> {tip.analysis.suggested_timeline || '2-4 semaines'}
                      </div>
                      
                      {tip.analysis.compliance_areas && tip.analysis.compliance_areas.length > 0 && (
                        <div className="compliance-areas">
                          <strong>Domaines de conformité:</strong>
                          <div className="areas-tags">
                            {tip.analysis.compliance_areas.map((area, i) => (
                              <span key={i} className="area-tag">{area}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-tips">
                <i className="fas fa-info-circle"></i>
                <p>Aucune action récente à analyser. Vos prochaines actions assignées apparaîtront ici avec des conseils IA.</p>
              </div>
            )}
          </div>
        </div>

        {/* Task Statistics */}
        <div className="overview-card">
          <div className="card-header">
            <h5>Aperçu des Tâches</h5>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-column">
                <div className="info-item">
                  <span className="info-label">Actions Assignées :</span>
                  <span>{assignedActions}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Actions Terminées :</span>
                  <span>{completedActions}</span>
                </div>
              </div>
              <div className="info-column">
                <div className="info-item">
                  <span className="info-label">Achèvement des Tâches :</span>
                  <span>{completionPercentage}%</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Évaluations en Attente :</span>
                  <span>{userInfo?.pendingEvaluations || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="overview-card">
          <div className="card-header">
            <h5>Actions Rapides</h5>
          </div>
          <div className="card-body">
            <div className="actions-grid">
              <Link to="/user/action-plan" className="action-button primary">
                <i className="fas fa-tasks"></i>
                Plans d'Action
              </Link>
              <Link to="/user/compliance" className="action-button primary">
                <i className="fas fa-check-square"></i>
                Évaluation de la Conformité
              </Link>
              <Link to="/user/revue" className="action-button info">
                <i className="fas fa-folder-open"></i>
                Revue de Direction
              </Link>
              <Link to="/user/profile" className="action-button info">
                <i className="fas fa-user"></i>
                Mon Profil
              </Link>
              <button 
                className="action-button danger"
                onClick={() => {
                  axios.post('/api/auth/logout')
                    .then(() => window.location.href = '/')
                }}
              >
                <i className="fas fa-sign-out-alt"></i>
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        {/* Action Progress */}
        {assignedActions > 0 && (
          <div className="overview-card">
            <div className="card-header">
              <h5>Progrès des Actions</h5>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
                <div style={{ flex: '1', height: '24px', background: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${completionPercentage}%`, 
                      height: '100%', 
                      background: '#007bff',
                      transition: 'width 1s ease-in-out'
                    }} 
                  />
                </div>
                <span style={{ marginLeft: '10px', fontWeight: '500' }}>
                  {completionPercentage}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span>{completedActions} terminé</span>
                <span>{assignedActions - completedActions} restant</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default UserDashboard;