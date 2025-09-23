import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/admindashboard.css';

interface StatsSummary {
  totalCompanies: number;
  totalUsers: number;
  pendingRequests: number;
  approvedCompanies: number;
  totalTexts: number;
  totalSubscriptions: number;
}

const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsSummary>({
    totalCompanies: 0,
    totalUsers: 0,
    pendingRequests: 0,
    approvedCompanies: 0,
    totalTexts: 0,
    totalSubscriptions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/admin/dashboard-detailed');
        setStats({
          totalCompanies: response.data.totalCompanies || 0,
          totalUsers: response.data.totalUsers || 0,
          pendingRequests: response.data.pendingRequests || 0,
          approvedCompanies: response.data.approvedCompanies || 0,
          totalTexts: response.data.totalTexts || 0,
          totalSubscriptions: response.data.totalSubscriptions || 0
        });
        setLoading(false);
      } catch {
        setError('Échec du chargement des données du tableau de bord');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading-container">Chargement du tableau de bord...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <section className="dashboard-section">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h2>Tableau de Bord Super Administrateur</h2>
            <p className="subtitle">Vue d'ensemble du système et gestion globale</p>
          </div>
        </div>

        {/* Stats Cards - First Row */}
        <div className="stats-container">
          <div className="stat-card companies">
            <div className="stat-icon">
              <i className="fas fa-building"></i>
            </div>
            <div className="stat-content">
              <h5 className="stat-title">Entreprises Actives</h5>
              <p className="stat-value">{stats.approvedCompanies}</p>
              <span className="stat-subtitle">
                {stats.pendingRequests > 0 && `${stats.pendingRequests} en attente`}
              </span>
              <Link to="/admin/companies" className="stat-link">
                Gérer les entreprises <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>

          <div className="stat-card users">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-content">
              <h5 className="stat-title">Utilisateurs Totaux</h5>
              <p className="stat-value">{stats.totalUsers}</p>
              <span className="stat-subtitle">Tous rôles confondus</span>
              <Link to="/admin/users" className="stat-link">
                Gérer les utilisateurs <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>

          <div className="stat-card requests">
            <div className="stat-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-content">
              <h5 className="stat-title">Demandes en Attente</h5>
              <p className="stat-value">{stats.pendingRequests}</p>
              <span className="stat-subtitle">
                {stats.pendingRequests === 0 ? "Aucune demande" : "À traiter"}
              </span>
              <Link to="/admin/pending-requests" className="stat-link">
                Examiner les demandes <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards - Second Row */}
        <div className="stats-container">
          <div className="stat-card texts">
            <div className="stat-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <div className="stat-content">
              <h5 className="stat-title">Textes Réglementaires</h5>
              <p className="stat-value">{stats.totalTexts}</p>
              <span className="stat-subtitle">Documents du système</span>
              <Link to="/admin/texts" className="stat-link">
                Gérer les textes <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>

          <div className="stat-card subscriptions">
            <div className="stat-icon">
              <i className="fas fa-credit-card"></i>
            </div>
            <div className="stat-content">
              <h5 className="stat-title">Abonnements Actifs</h5>
              <p className="stat-value">{stats.totalSubscriptions}</p>
              <span className="stat-subtitle">Plans souscrits</span>
              <Link to="/admin/quotes" className="stat-link">
                Voir les devis <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>

          {/* Replaced the Taxonomy card with Approved Companies shortcut */}
          <div className="stat-card approved">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h5 className="stat-title">Entreprises approuvées</h5>
              <p className="stat-value">{stats.approvedCompanies}</p>
              <span className="stat-subtitle">Accès rapide aux demandes</span>
              <Link to="/admin/pending-requests" className="stat-link">
                Examiner les demandes <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuperAdminDashboard;