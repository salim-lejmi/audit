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
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading-container">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <section className="dashboard-section">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h2>Welcome, Super Admin</h2>
            <p className="subtitle">Manage system users, companies, and configuration</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stat-card primary">
            <div className="stat-card-body">
              <h5 className="stat-title">Total Companies</h5>
              <p className="stat-value">{stats.totalCompanies}</p>
              <Link to="/admin/companies" className="stat-link">
                View all companies <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-card-body">
              <h5 className="stat-title">Total Users</h5>
              <p className="stat-value">{stats.totalUsers}</p>
              <Link to="/admin/users" className="stat-link">
                Manage users <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-card-body">
              <h5 className="stat-title">Pending Requests</h5>
              <p className="stat-value">{stats.pendingRequests}</p>
              <Link to="/admin/pending-requests" className="stat-link">
                Review requests <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="actions-container">
          <div className="actions-card">
            <div className="actions-header">
              <h5>Quick Actions</h5>
            </div>
            <div className="actions-body">
              <Link to="/admin/pending-requests" className="action-button primary">
                <i className="fas fa-check-circle"></i>
                <span>Approve/Reject Companies</span>
              </Link>
              <Link to="/admin/users/create" className="action-button success">
                <i className="fas fa-user-plus"></i>
                <span>Create User</span>
              </Link>
              <Link to="/admin/users" className="action-button info">
                <i className="fas fa-users-cog"></i>
                <span>Manage Users</span>
              </Link>
              <Link to="/admin/roles" className="action-button dark">
                <i className="fas fa-user-tag"></i>
                <span>Roles & Permissions</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="menu-container">
          <div className="menu-card">
            <div className="menu-header">
              <h5>System Management</h5>
            </div>
            <div className="menu-body">
              <Link to="/admin/users" className="menu-item">
                <i className="fas fa-users"></i>
                <span>User Management</span>
              </Link>
              <Link to="/admin/companies" className="menu-item">
                <i className="fas fa-building"></i>
                <span>Company Management</span>
              </Link>
              <Link to="/admin/roles" className="menu-item">
                <i className="fas fa-user-shield"></i>
                <span>Roles & Permissions</span>
              </Link>
              <Link to="/admin/audit-logs" className="menu-item">
                <i className="fas fa-clipboard-list"></i>
                <span>Audit Logs</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuperAdminDashboard;