import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/navbar.css';
import UserDashboard from './company/UserDashboard'; // Import UserDashboard

interface NavbarProps {
  userRole?: string; // e.g., 'SuperAdmin', 'SubscriptionManager', 'Auditor', 'User'
}

const Navbar: React.FC<NavbarProps> = ({ userRole = 'User' }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const manualRef = useRef<HTMLDivElement>(null);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
      if (manualRef.current && !manualRef.current.contains(event.target as Node)) {
        setManualOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const isDashboard = location.pathname.includes('dashboard');
  
  const getAccountExpirationDate = () => {
    return "2025-12-31"; // Example date
  };

  const getBasePath = () => {
    if (userRole === 'SuperAdmin') return '/admin';
    if (userRole === 'SubscriptionManager') return '/company';
    // Default for 'User', 'Auditor', 'Manager', etc.
    return '/user'; 
  };

  const getProfilePath = () => {
    if (userRole === 'SuperAdmin') return '/admin/profile';
    if (userRole === 'SubscriptionManager') return '/company/profile';
    // Default for 'User', 'Auditor', 'Manager', etc.
    return '/user/profile';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          {userRole === 'SuperAdmin' ? (
            <Link to="/admin/dashboard" className="navbar-brand">Prevention Plus</Link>
          ) : userRole === 'SubscriptionManager' ? (
            <Link to="/company/dashboard" className="navbar-brand">Prevention Plus</Link>
          ) : (
            // For 'User', 'Auditor', 'Manager', etc.
            <Link to="/user/dashboard" className="navbar-brand">Prevention Plus</Link>
          )}
        </div>

        <div className="navbar-center">
          {isDashboard && ( // This section might need role-specific logic for domains if they differ
            <div className="dashboard-tabs">
              <div className="domain-selector">
                <span>Domains:</span>
                <select className="domain-select">
                  <option value="health-safety">Health & Safety</option>
                  <option value="environment">Environment</option>
                  <option value="quality">Quality</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="navbar-right">
          {/* Dashboard link - always visible, path adapts to role */}
          <div className="nav-item">
            <Link to={`${getBasePath()}/dashboard`} className="nav-button">
              <i className="fas fa-tachometer-alt"></i>
              <span className="nav-label">Dashboard</span>
            </Link>
          </div>

          {/* Text Management link - only for SuperAdmin and SubscriptionManager */}
          {(userRole === 'SuperAdmin' || userRole === 'SubscriptionManager') && (
            <div className="nav-item">
              <Link to={`${getBasePath()}/texts`} className="nav-button">
                <i className="fas fa-file-alt"></i>
                <span className="nav-label">Texts</span>
              </Link>
            </div>
          )}

          {/* Compliance Evaluation link - for SubscriptionManager and other users (Auditor, Manager, User) */}
          {(userRole === 'SubscriptionManager' || userRole === 'User' || userRole === 'Auditor' || userRole === 'Manager') && (
            <div className="nav-item">
              {/* SubscriptionManager goes to /company/compliance, others to /user/compliance */}
              <Link to={`${getBasePath()}/compliance`} className="nav-button">
                <i className="fas fa-check-square"></i>
                <span className="nav-label">Compliance</span>
              </Link>
            </div>
          )}
          
          {/* Action Plan link - for SubscriptionManager and other users (Auditor, Manager, User)
              This link could be added here if a top-level nav item is desired.
              Currently, ActionPlan is accessed via dashboards or direct routes.
              If you want a top-level link for Action Plan:
          */}
          {/*
          {(userRole === 'SubscriptionManager' || userRole === 'User' || userRole === 'Auditor' || userRole === 'Manager') && (
            <div className="nav-item">
              <Link to={`${getBasePath()}/action-plan`} className="nav-button">
                <i className="fas fa-tasks"></i>
                <span className="nav-label">Action Plan</span>
              </Link>
            </div>
          )}
          */}


          {/* Taxonomy Manager link - only for SuperAdmin */}
          {userRole === 'SuperAdmin' && (
            <div className="nav-item">
              <Link to="/admin/taxonomy" className="nav-button">
                <i className="fas fa-sitemap"></i>
                <span className="nav-label">Taxonomy</span>
              </Link>
            </div>
          )}

          {/* Users and Roles Management - based on role */}
          {userRole === 'SuperAdmin' && (
            <div className="nav-item" ref={dropdownRef}>
              <button 
                className="nav-button" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="Management"
              >
                <i className="fas fa-users-cog"></i>
                <span className="nav-label">Management</span>
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <Link to="/admin/users" className="dropdown-item">
                    <i className="fas fa-users"></i>
                    <span>Manage Users</span>
                  </Link>
                  <Link to="/admin/roles" className="dropdown-item">
                    <i className="fas fa-user-tag"></i>
                    <span>Manage Roles</span>
                  </Link>
                  <Link to="/admin/pending-requests" className="dropdown-item">
                    <i className="fas fa-clock"></i>
                    <span>Pending Requests</span>
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {userRole === 'SubscriptionManager' && (
            <div className="nav-item" ref={dropdownRef}>
              <button 
                className="nav-button" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="Management"
              >
                <i className="fas fa-users-cog"></i>
                <span className="nav-label">Management</span>
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <Link to="/company/users" className="dropdown-item">
                    <i className="fas fa-users"></i>
                    <span>Manage Users</span>
                  </Link>
                  <Link to="/company/roles" className="dropdown-item">
                    <i className="fas fa-user-tag"></i>
                    <span>Manage Roles</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Manual dropdown */}
          <div className="nav-item" ref={manualRef}>
            <button 
              className="nav-button" 
              onClick={() => setManualOpen(!manualOpen)}
              aria-label="User Manual"
            >
              <i className="fas fa-book"></i>
              <span className="nav-label">Manual</span>
            </button>
            {manualOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-item"> {/* These could be links or trigger functions */}
                  <i className="fas fa-video"></i>
                  <span>Video Tutorial</span>
                </div>
                <div className="dropdown-item">
                  <i className="fas fa-file-pdf"></i>
                  <span>PDF Manual</span>
                </div>
              </div>
            )}
          </div>

          {/* History button - visible to all, path adapts to role. 
              Ensure /user/history, /company/history, /admin/history routes are defined or planned.
          */}
          <div className="nav-item">
            <Link to={`${getBasePath()}/history`} className="nav-button">
              <i className="fas fa-history"></i>
              <span className="nav-label">History</span>
            </Link>
          </div>

          {/* Account dropdown */}
          <div className="nav-item account-dropdown" ref={accountDropdownRef}>
            <button 
              className="nav-button account-button" 
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
            >
              <i className="fas fa-user-circle"></i>
              <span className="nav-label">Account</span>
            </button>
            {accountDropdownOpen && (
              <div className="dropdown-menu account-menu">
                <div className="account-info">
                  <p><strong>Account Role:</strong> {userRole}</p> {/* Changed label for clarity */}
                  <p><strong>Expiration:</strong> {getAccountExpirationDate()}</p>
                </div>
                <div className="dropdown-divider"></div>
                <Link to={getProfilePath()} className="dropdown-item">
                  <i className="fas fa-user-cog"></i>
                  <span>My Profile</span>
                </Link>
                {/* Settings link - only for SuperAdmin and SubscriptionManager */}
                {(userRole === 'SuperAdmin' || userRole === 'SubscriptionManager') && (
                  <Link to={`${getBasePath()}/settings`} className="dropdown-item">
                    <i className="fas fa-cog"></i>
                    <span>Settings</span>
                  </Link>
                )}
                <div className="dropdown-divider"></div>
                <div className="dropdown-item" onClick={handleLogout} style={{cursor: 'pointer'}}>
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;