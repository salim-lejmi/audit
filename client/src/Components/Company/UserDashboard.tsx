import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/subscriptiondashboard.css'; // Reusing the same CSS

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
        setError('Failed to load user information');
        setLoading(false);
        console.error(error);
      }
    };

    fetchUserInfo();
  }, []);

  if (loading) {
    return <div className="loading-container">Loading dashboard...</div>;
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
            <h2>Welcome, {userInfo?.userName}</h2>
            <p className="text-muted">
              {userInfo?.role === 'Auditor' 
                ? 'Manage your assigned actions and compliance evaluations' 
                : 'Access your dashboard resources'}
            </p>
          </div>
        </div>

        {/* User Overview Card */}
        <div className="overview-card">
          <div className="card-header">
            <h5>User Overview</h5>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-column">
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  <span>{userInfo?.userName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Role:</span>
                  <span>{userInfo?.role}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Company:</span>
                  <span>{userInfo?.companyName}</span>
                </div>
              </div>
              <div className="info-column">
                <div className="info-item">
                  <span className="info-label">Industry:</span>
                  <span>{userInfo?.industry}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className={`status-badge ${userInfo?.status?.toLowerCase() || ''}`}>
                    {userInfo?.status}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Member Since:</span>
                  <span>{userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Task Statistics */}
        <div className="overview-card">
          <div className="card-header">
            <h5>Task Overview</h5>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-column">
                <div className="info-item">
                  <span className="info-label">Assigned Actions:</span>
                  <span>{assignedActions}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Completed Actions:</span>
                  <span>{completedActions}</span>
                </div>
              </div>
              <div className="info-column">
                <div className="info-item">
                  <span className="info-label">Task Completion:</span>
                  <span>{completionPercentage}%</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Pending Evaluations:</span>
                  <span>{userInfo?.pendingEvaluations || 0}</span>
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
  <Link to="/user/action-plan" className="action-button primary">
    <i className="fas fa-tasks"></i>
    Action Plans
  </Link>
  <Link to="/user/compliance" className="action-button primary">
    <i className="fas fa-check-square"></i>
    Compliance Evaluation
  </Link>
  <Link to="/user/revue" className="action-button info">
    <i className="fas fa-folder-open"></i>
    Revue de Direction
  </Link>
  <Link to="/user/profile" className="action-button info">
    <i className="fas fa-user"></i>
    My Profile
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

        {/* Features Overview for Auditor */}
        <div className="overview-card">
          <div className="card-header">
            <h5>Available Features</h5>
          </div>
          <div className="card-body">
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">
                  <i className="fas fa-tasks"></i>
                </div>
                <div className="feature-content">
                  <h6>Action Plans</h6>
                  <p>View and update your assigned action plans. Track progress, add observations, assess efficacy, and mark actions as validated.</p>
                  <Link to="/user/action-plan" className="feature-link">Go to Action Plans</Link>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <i className="fas fa-check-square"></i>
                </div>
                <div className="feature-content">
                  <h6>Compliance Evaluation</h6>
                  <p>View texts and requirements related to your assigned actions. Add findings and include monitoring data.</p>
                  <Link to="/user/compliance" className="feature-link">Go to Compliance Evaluation</Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Progress */}
        {assignedActions > 0 && (
          <div className="overview-card">
            <div className="card-header">
              <h5>Action Progress</h5>
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
                <span>{completedActions} completed</span>
                <span>{assignedActions - completedActions} remaining</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default UserDashboard;