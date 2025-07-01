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

const UserDashboard: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get('/api/company/user-dashboard-info');
        setUserInfo(response.data);
        setLoading(false);
      } catch (error) {
        setError('Échec du chargement des informations utilisateur');
        setLoading(false);
        console.error(error);
      }
    };

    fetchUserInfo();
  }, []);

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
                  <span className={`status-badge ${userInfo?.status?.toLowerCase() || ''}`}>
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