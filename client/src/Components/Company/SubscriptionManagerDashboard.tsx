import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/subscriptiondashboard.css';

interface CompanyInfo {
  companyName: string;
  industry: string;
  totalUsers: number;
  status: string;
  createdAt: string;
}

const SubscriptionManagerDashboard: React.FC = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await axios.get('/api/company/dashboard-info');
        setCompanyInfo(response.data);
        setLoading(false);
      } catch {
        setError('Échec du chargement des informations de l\'entreprise');
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, []);

  if (loading) {
    return <div className="loading-container">Chargement du tableau de bord...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <section className="subscription-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h2>Bienvenue, Gestionnaire d'Abonnement</h2>
            <p className="text-muted">Gérez les utilisateurs et les abonnements de votre entreprise</p>
          </div>
        </div>

        {/* Company Overview Card */}
        <div className="overview-card">
          <div className="card-header">
            <h5>Aperçu de l'Entreprise</h5>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-column">
                <div className="info-item">
                  <span className="info-label">Nom de l'Entreprise :</span>
                  <span>{companyInfo?.companyName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Industrie :</span>
                  <span>{companyInfo?.industry}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Statut :</span>
                  <span className={`status-badge ${companyInfo?.status.toLowerCase()}`}>
                    {companyInfo?.status}
                  </span>
                </div>
              </div>
              <div className="info-column">
                <div className="info-item">
                  <span className="info-label">Nombre Total d'Utilisateurs :</span>
                  <span>{companyInfo?.totalUsers}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Membre Depuis :</span>
                  <span>{new Date(companyInfo?.createdAt || '').toLocaleDateString('fr-FR')}</span>
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
              <Link to="/company/users" className="action-button primary">
                <i className="fas fa-users"></i>
                Gérer les Utilisateurs
              </Link>
              <Link to="/company/roles" className="action-button success">
                <i className="fas fa-user-tag"></i>
                Gérer les Rôles
              </Link>
              <Link to="/company/compliance" className="action-button warning">
                <i className="fas fa-check-square"></i>
                Évaluation de la Conformité
              </Link>
              <Link to="/company/revue" className="action-button info">
                <i className="fas fa-folder-open"></i>
                Revue de Direction
              </Link>
              <Link to="/company/settings" className="action-button info">
                <i className="fas fa-cog"></i>
                Paramètres de l'Entreprise
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

   
      </div>
    </section>
  );
};

export default SubscriptionManagerDashboard;