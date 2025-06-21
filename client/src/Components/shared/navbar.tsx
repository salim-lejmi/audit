import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationDropdown from '../Notifications/NotificationDropdown';
import '../../styles/navbar.css';

interface NavbarProps {
  userRole?: string; // e.g., 'SuperAdmin', 'SubscriptionManager', 'User'
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
    return '/user'; 
  };

  const getProfilePath = () => {
    if (userRole === 'SuperAdmin') return '/admin/profile';
    if (userRole === 'SubscriptionManager') return '/company/profile';
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
            <Link to="/user/dashboard" className="navbar-brand">Prevention Plus</Link>
          )}
        </div>

        <div className="navbar-center">
          {isDashboard && (
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
          {/* Quotes link - replacing dashboard */}
          <div className="nav-item">
            <Link to={`${getBasePath()}/quotes`} className="nav-button">
              <i className="fas fa-file-invoice-dollar"></i>
              <span className="nav-label">Quotes</span>
            </Link>
          </div>

          {/* Text Management link */}
          {(userRole === 'SuperAdmin' || userRole === 'SubscriptionManager') && (
            <div className="nav-item">
              <Link to={`${getBasePath()}/texts`} className="nav-button">
                <i className="fas fa-file-alt"></i>
                <span className="nav-label">Texts</span>
              </Link>
            </div>
          )}

          {/* Compliance Evaluation link */}
          {(userRole === 'SubscriptionManager' || userRole === 'User' || userRole === 'Auditor' || userRole === 'Manager') && (
            <div className="nav-item">
              <Link to={`${getBasePath()}/compliance`} className="nav-button">
                <i className="fas fa-check-square"></i>
                <span className="nav-label">Compliance</span>
              </Link>
            </div>
          )}

          {/* Taxonomy Manager link */}
          {userRole === 'SuperAdmin' && (
            <div className="nav-item">
              <Link to="/admin/taxonomy" className="nav-button">
                <i className="fas fa-sitemap"></i>
                <span className="nav-label">Taxonomy</span>
              </Link>
            </div>
          )}

          {/* Management dropdown */}
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
                <div className="dropdown-item">
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

          {/* Notifications - NEW */}
          <div className="nav-item">
            <NotificationDropdown />
          </div>

          {/* History button */}
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
                  <p><strong>Account Role:</strong> {userRole}</p>
                  <p><strong>Expiration:</strong> {getAccountExpirationDate()}</p>
                </div>
                <div className="dropdown-divider"></div>
                <Link to={getProfilePath()} className="dropdown-item">
                  <i className="fas fa-user-cog"></i>
                  <span>My Profile</span>
                </Link>
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