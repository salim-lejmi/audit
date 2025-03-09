import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

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
    return <div className="text-center p-5">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="alert alert-danger m-3">{error}</div>;
  }

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col-md-12">
          <h2 className="mb-3">Welcome, Super Admin</h2>
          <p className="text-muted">Manage system users, companies, and configuration</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card text-white bg-primary mb-3">
            <div className="card-body">
              <h5 className="card-title">Total Companies</h5>
              <p className="card-text display-4">{stats.totalCompanies}</p>
              <Link to="/admin/companies" className="text-white">View all companies →</Link>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card text-white bg-success mb-3">
            <div className="card-body">
              <h5 className="card-title">Total Users</h5>
              <p className="card-text display-4">{stats.totalUsers}</p>
              <Link to="/admin/users" className="text-white">Manage users →</Link>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card text-white bg-warning mb-3">
            <div className="card-body">
              <h5 className="card-title">Pending Requests</h5>
              <p className="card-text display-4">{stats.pendingRequests}</p>
              <Link to="/admin/pending-requests" className="text-white">Review requests →</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h5>Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <Link to="/admin/pending-requests" className="btn btn-outline-primary w-100">
                    <i className="fas fa-check-circle me-2"></i>
                    Approve/Reject Companies
                  </Link>
                </div>
                <div className="col-md-3 mb-3">
                  <Link to="/admin/users/create" className="btn btn-outline-success w-100">
                    <i className="fas fa-user-plus me-2"></i>
                    Create User
                  </Link>
                </div>
                <div className="col-md-3 mb-3">
                  <Link to="/admin/users" className="btn btn-outline-info w-100">
                    <i className="fas fa-users-cog me-2"></i>
                    Manage Users
                  </Link>
                </div>
                <div className="col-md-3 mb-3">
                  <Link to="/admin/roles" className="btn btn-outline-dark w-100">
                    <i className="fas fa-user-tag me-2"></i>
                    Roles & Permissions
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h5>System Management</h5>
            </div>
            <div className="card-body">
              <div className="list-group">
                <Link to="/admin/users" className="list-group-item list-group-item-action">
                  <i className="fas fa-users me-3"></i>
                  User Management
                </Link>
                <Link to="/admin/companies" className="list-group-item list-group-item-action">
                  <i className="fas fa-building me-3"></i>
                  Company Management
                </Link>
                <Link to="/admin/roles" className="list-group-item list-group-item-action">
                  <i className="fas fa-user-shield me-3"></i>
                  Roles & Permissions
                </Link>
                <Link to="/admin/audit-logs" className="list-group-item list-group-item-action">
                  <i className="fas fa-clipboard-list me-3"></i>
                  Audit Logs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;