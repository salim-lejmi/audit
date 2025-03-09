import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

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
    return <div className="text-center p-5">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="alert alert-danger m-3">{error}</div>;
  }

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col-md-12">
          <h2 className="mb-3">Welcome, Subscription Manager</h2>
          <p className="text-muted">Manage your company's users and subscriptions</p>
        </div>
      </div>

      {/* Company Overview Card */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5>Company Overview</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Company Name:</strong> {companyInfo?.companyName}</p>
                  <p><strong>Industry:</strong> {companyInfo?.industry}</p>
                  <p><strong>Status:</strong> <span className={`badge ${companyInfo?.status === 'Approved' ? 'bg-success' : 'bg-warning'}`}>{companyInfo?.status}</span></p>
                </div>
                <div className="col-md-6">
                  <p><strong>Total Users:</strong> {companyInfo?.totalUsers}</p>
                  <p><strong>Member Since:</strong> {new Date(companyInfo?.createdAt || '').toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5>Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <Link to="/company/users" className="btn btn-outline-primary w-100">
                    <i className="fas fa-users me-2"></i>
                    Manage Users
                  </Link>
                </div>
                <div className="col-md-4 mb-3">
                  <Link to="/company/settings" className="btn btn-outline-info w-100">
                    <i className="fas fa-cog me-2"></i>
                    Company Settings
                  </Link>
                </div>
                <div className="col-md-4 mb-3">
                  <button className="btn btn-outline-danger w-100" onClick={() => {
                    axios.post('/api/auth/logout')
                      .then(() => window.location.href = '/')
                  }}>
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagerDashboard;