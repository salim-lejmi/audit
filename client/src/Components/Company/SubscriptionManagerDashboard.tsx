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
        setError('Failed to load company information');
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, []);

  if (loading) {
    return <div className="loading-container">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <section className="subscription-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h2>Welcome, Subscription Manager</h2>
            <p className="text-muted">Manage your company's users and subscriptions</p>
          </div>
        </div>

        {/* Company Overview Card */}
        <div className="overview-card">
          <div className="card-header">
            <h5>Company Overview</h5>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-column">
                <div className="info-item">
                  <span className="info-label">Company Name:</span>
                  <span>{companyInfo?.companyName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Industry:</span>
                  <span>{companyInfo?.industry}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className={`status-badge ${companyInfo?.status.toLowerCase()}`}>
                    {companyInfo?.status}
                  </span>
                </div>
              </div>
              <div className="info-column">
                <div className="info-item">
                  <span className="info-label">Total Users:</span>
                  <span>{companyInfo?.totalUsers}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Member Since:</span>
                  <span>{new Date(companyInfo?.createdAt || '').toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="overview-card">
          <div className="card-header">
            <h5>Quick Actions</h5>
          </div>
          <div className="card-body">
            <div className="actions-grid">
              <Link to="/company/users" className="action-button primary">
                <i className="fas fa-users"></i>
                Manage Users
              </Link>
              <Link to="/company/roles" className="action-button success">
                <i className="fas fa-user-tag"></i>
                Manage Roles
              </Link>
              <Link to="/company/compliance" className="action-button warning">
                <i className="fas fa-check-square"></i>
                Compliance Evaluation
              </Link>
              <Link to="/company/settings" className="action-button info">
                <i className="fas fa-cog"></i>
                Company Settings
              </Link>
              <button 
                className="action-button danger"
                onClick={() => {
                  axios.post('/api/auth/logout')
                    .then(() => window.location.href = '/')
                }}
              >
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="overview-card">
          <div className="card-header">
            <h5>Available Features</h5>
          </div>
          <div className="card-body">
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">
                  <i className="fas fa-check-square"></i>
                </div>
                <div className="feature-content">
                  <h6>Compliance Evaluation</h6>
                  <p>Evaluate the compliance of texts and requirements, add observations, and attach documents.</p>
                  <Link to="/company/compliance" className="feature-link">Go to Compliance Evaluation</Link>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div className="feature-content">
                  <h6>Text Management</h6>
                  <p>Manage regulatory texts, organize by domain, theme, and sub-theme.</p>
                  <Link to="/company/texts" className="feature-link">Manage Texts</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionManagerDashboard;