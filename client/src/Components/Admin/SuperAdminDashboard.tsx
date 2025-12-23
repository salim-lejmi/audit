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
  totalDomains: number;
}

const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsSummary>({
    totalCompanies: 0,
    totalUsers: 0,
    pendingRequests: 0,
    approvedCompanies: 0,
    totalTexts: 0,
    totalSubscriptions: 0,
    totalDomains: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardResponse, domainsResponse] = await Promise.all([
          axios.get('/api/admin/dashboard-detailed'),
          axios.get('/api/taxonomy/domains')
        ]);
        
const approvedCount = dashboardResponse.data.approvedCompanies || 0;
const pendingCount = dashboardResponse.data.pendingRequests || 0;
const totalCompaniesCount = approvedCount + pendingCount;

setStats({
  totalCompanies: totalCompaniesCount,
  totalUsers: dashboardResponse.data.totalUsers || 0,
  pendingRequests: pendingCount,
  approvedCompanies: approvedCount,
  totalTexts: dashboardResponse.data.totalTexts || 0,
  totalSubscriptions: dashboardResponse.data.totalSubscriptions || 0,
  totalDomains: domainsResponse.data.length || 0
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
              <i className="fas fa-sitemap"></i>
            </div>
            <div className="stat-content">
              <h5 className="stat-title">Taxonomie</h5>
              <p className="stat-value">{stats.totalDomains}</p>
              <span className="stat-subtitle">
                {stats.totalDomains === 0 ? "Aucun domaine" : stats.totalDomains === 1 ? "Domaine" : "Domaines"}
              </span>
              <Link to="/admin/taxonomy" className="stat-link">
                Gérer la taxonomie <i className="fas fa-arrow-right"></i>
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

          <div className="stat-card approved">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h5 className="stat-title">Entreprises Approuvées</h5>
              <p className="stat-value">{stats.approvedCompanies}/{stats.totalCompanies}</p>
              <span className="stat-subtitle">
                {stats.pendingRequests > 0 ? `${stats.pendingRequests} en attente` : "Toutes approuvées"}
              </span>
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