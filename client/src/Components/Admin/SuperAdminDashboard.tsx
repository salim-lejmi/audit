import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/admindashboard.css';

interface StatsSummary {
  totalCompanies: number;
  totalUsers: number;
  pendingRequests: number;
}

const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsSummary>({
    totalCompanies: 0,
    totalUsers: 0,
    pendingRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/admin/dashboard-stats');
        setStats(response.data);
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
            <h2>Bienvenue, Super Administrateur</h2>
            <p className="subtitle">Gérer les utilisateurs, les entreprises et la configuration du système</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stat-card primary">
            <div className="stat-card-body">
              <h5 className="stat-title">Total des entreprises</h5>
              <p className="stat-value">{stats.totalCompanies}</p>
              <Link to="/admin/companies" className="stat-link">
                Voir toutes les entreprises <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-card-body">
              <h5 className="stat-title">Total des utilisateurs</h5>
              <p className="stat-value">{stats.totalUsers}</p>
              <Link to="/admin/users" className="stat-link">
                Gérer les utilisateurs <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-card-body">
              <h5 className="stat-title">Demandes en attente</h5>
              <p className="stat-value">{stats.pendingRequests}</p>
              <Link to="/admin/pending-requests" className="stat-link">
                Examiner les demandes <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="actions-container">
          <div className="actions-card">
            <div className="actions-header">
              <h5>Actions rapides</h5>
            </div>
            <div className="actions-body">
              <Link to="/admin/pending-requests" className="action-button primary">
                <i className="fas fa-check-circle"></i>
                <span>Approuver/Rejeter des entreprises</span>
              </Link>
              <Link to="/admin/users/create" className="action-button success">
                <i className="fas fa-user-plus"></i>
                <span>Créer un utilisateur</span>
              </Link>
              <Link to="/admin/users" className="action-button info">
                <i className="fas fa-users-cog"></i>
                <span>Gérer les utilisateurs</span>
              </Link>
              <Link to="/admin/roles" className="action-button dark">
                <i className="fas fa-user-tag"></i>
                <span>Rôles et permissions</span>
              </Link>
            </div>
          </div>
        </div>

   
      </div>
    </section>
  );
};

export default SuperAdminDashboard;