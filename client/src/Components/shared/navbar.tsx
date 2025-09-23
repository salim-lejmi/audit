import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationDropdown from '../Notifications/NotificationDropdown';
import '../../styles/navbar.css';
import logo from '../../../public/logo.jpg'; 

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
        console.error(`Erreur lors de l'activation du mode plein écran : ${err.message}`);
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
      console.error('Échec de la déconnexion', error);
    }
  };

  const isDashboard = location.pathname.includes('dashboard');
  
  const getAccountExpirationDate = () => {
    return "2025-12-31"; // Date d'exemple
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
            <Link to="/admin/dashboard" className="navbar-brand">
              <img src={logo} alt="Prévention Plus Logo" className="navbar-logo" />
            </Link>
          ) : userRole === 'SubscriptionManager' ? (
            <Link to="/company/dashboard" className="navbar-brand">
              <img src={logo} alt="Prévention Plus Logo" className="navbar-logo" />
            </Link>
          ) : (
            <Link to="/user/dashboard" className="navbar-brand">
              <img src={logo} alt="Prévention Plus Logo" className="navbar-logo" />
            </Link>
          )}
        </div>


        <div className="navbar-right">
          {/* Quotes link - replacing dashboard */}
          {(userRole === 'SuperAdmin') && (
            <div className="nav-item">
              <Link to={`${getBasePath()}/quotes`} className="nav-button">
                <i className="fas fa-file-invoice-dollar"></i>
                <span className="nav-label">Devis</span>
              </Link>
              
            </div>
            
            
          )}
             {(userRole === 'SuperAdmin') && (
            <div className="nav-item">
              <Link to={`${getBasePath()}/dashboardd`} className="nav-button">
                <i className="fas fa-file-invoice-dollar"></i>
                <span className="nav-label">Dashboard</span>
              </Link>
              
            </div>
            
            
          )}
          {(userRole === 'SubscriptionManager') && (
            <div className="nav-item">
              <Link to={`${getBasePath()}/payments`} className="nav-button">
                <i className="fas fa-credit-card"></i>
                <span className="nav-label">Paiement</span>
              </Link>
            </div>
          )}

          {/* Text Management link */}
          {(userRole === 'SuperAdmin' || userRole === 'SubscriptionManager') && (
            <div className="nav-item">
              <Link to={`${getBasePath()}/texts`} className="nav-button">
                <i className="fas fa-file-alt"></i>
                <span className="nav-label">Textes</span>
              </Link>
            </div>
          )}

          {/* Compliance Evaluation link */}
          {(userRole === 'SubscriptionManager') && (
            <div className="nav-item">
              <Link to={`${getBasePath()}/compliance`} className="nav-button">
                <i className="fas fa-check-square"></i>
                <span className="nav-label">Conformité</span>
              </Link>
            </div>
          )}

          {(userRole === 'Auditor') && (
            <div className="nav-item">
              <Link to={`${getBasePath()}/action-plan`} className="nav-button">
                <i className="fas fa-tasks"></i>
                <span className="nav-label">Plan d'action</span>
              </Link>
            </div>
          )}
          {/* Taxonomy Manager link */}
          {userRole === 'SuperAdmin' && (
            <div className="nav-item">
              <Link to="/admin/taxonomy" className="nav-button">
                <i className="fas fa-sitemap"></i>
                <span className="nav-label">Taxonomie</span>
              </Link>
            </div>
          )}

          {/* Management dropdown */}
          {userRole === 'SuperAdmin' && (
            <div className="nav-item" ref={dropdownRef}>
              <button 
                className="nav-button" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="Gestion"
              >
                <i className="fas fa-users-cog"></i>
                <span className="nav-label">Gestion</span>
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <Link to="/admin/users" className="dropdown-item">
                    <i className="fas fa-users"></i>
                    <span>Gérer les utilisateurs</span>
                  </Link>
              
                  <Link to="/admin/pending-requests" className="dropdown-item">
                    <i className="fas fa-clock"></i>
                    <span>Demandes en attente</span>
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
                aria-label="Gestion"
              >
                <i className="fas fa-users-cog"></i>
                <span className="nav-label">Gestion</span>
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <Link to="/company/users" className="dropdown-item">
                    <i className="fas fa-users"></i>
                    <span>Gérer les utilisateurs</span>
                  </Link>
          
                </div>
              )}
            </div>
          )}

          {/* Notifications - NEW */}
          <div className="nav-item">
            <NotificationDropdown />
          </div>

          {/* History button */}
          <div className="nav-item">
            <Link to={`${getBasePath()}/history`} className="nav-button">
              <i className="fas fa-history"></i>
              <span className="nav-label">Historique</span>
            </Link>
          </div>

          {/* Account dropdown */}
          <div className="nav-item account-dropdown" ref={accountDropdownRef}>
            <button 
              className="nav-button account-button" 
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
            >
              <i className="fas fa-user-circle"></i>
              <span className="nav-label">Compte</span>
            </button>
            {accountDropdownOpen && (
              <div className="dropdown-menu account-menu">
                <div className="account-info">
                  <p><strong>Rôle du compte :</strong> {userRole === 'SuperAdmin' ? 'Super Administrateur' : userRole === 'SubscriptionManager' ? 'Gestionnaire d\'abonnement' : userRole === 'Auditor' ? 'Auditeur' : userRole === 'User' ? 'Utilisateur' : userRole}</p>
                  <p><strong>Expiration :</strong> {getAccountExpirationDate()}</p>
                </div>
                <div className="dropdown-divider"></div>
                <Link to={getProfilePath()} className="dropdown-item">
                  <i className="fas fa-user-cog"></i>
                  <span>Mon profil</span>
                </Link>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item" onClick={handleLogout} style={{cursor: 'pointer'}}>
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Déconnexion</span>
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