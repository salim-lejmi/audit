import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/navbar.css';

interface NavbarProps {
  userRole?: string;
}

const Navbar: React.FC<NavbarProps> = ({ userRole = 'User' }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const location = useLocation();
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

  const isDashboard = location.pathname.includes('dashboard');
  
  // Example function to determine account expiration date - replace with actual implementation
  const getAccountExpirationDate = () => {
    return "2025-12-31"; // Example date
  };

  // Get base path based on user role
  const getBasePath = () => {
    if (userRole === 'SuperAdmin') return '/admin';
    if (userRole === 'SubscriptionManager') return '/company';
    return '/user';
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
          {/* Dashboard link */}
          <div className="nav-item">
            <Link to={`${getBasePath()}/dashboard`} className="nav-button">
              <i className="fas fa-tachometer-alt"></i>
              <span className="nav-label">Dashboard</span>
            </Link>
          </div>

          {/* Text Management link */}
          <div className="nav-item">
            <Link to={`${getBasePath()}/texts`} className="nav-button">
              <i className="fas fa-file-alt"></i>
              <span className="nav-label">Texts</span>
            </Link>
          </div>

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

          {/* History button */}
          <div className="nav-item">
            <Link to={`${getBasePath()}/history`} className="nav-button">
              <i className="fas fa-history"></i>
              <span className="nav-label">History</span>
            </Link>
          </div>

          {/* Full Screen toggle */}
          <div className="nav-item">
            <button 
              className="nav-button" 
              onClick={toggleFullScreen}
              aria-label="Toggle Fullscreen"
            >
              {isFullScreen ? (
                <i className="fas fa-compress"></i>
              ) : (
                <i className="fas fa-expand"></i>
              )}
              <span className="nav-label">Fullscreen</span>
            </button>
          </div>

          {/* Google Search */}
          <div className="nav-item search-container">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Google Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button">
                <i className="fas fa-search"></i>
              </button>
            </form>
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
                  <p><strong>Account Reference:</strong> {userRole}</p>
                  <p><strong>Expiration:</strong> {getAccountExpirationDate()}</p>
                </div>
                <div className="dropdown-divider"></div>
                <Link to="/profile" className="dropdown-item">
                  <i className="fas fa-user-cog"></i>
                  <span>My Profile</span>
                </Link>
                <Link to="/settings" className="dropdown-item">
                  <i className="fas fa-cog"></i>
                  <span>Settings</span>
                </Link>
                <div className="dropdown-divider"></div>
                <Link to="/logout" className="dropdown-item">
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Logout</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;