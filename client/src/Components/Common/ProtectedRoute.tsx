import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useNavigate }from 'react-router-dom';
import axios from 'axios';
import Navbar from '../shared/navbar';
import Footer from '../shared/Footer'; // Add this import

interface ProtectedRouteProps {
  role: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ role }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await axios.get<{ role: string }>('/api/auth/verify'); 
        setIsAuthenticated(true);
        setUserRole(response.data.role);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    verifyAuth();
  }, []); 
  
  if (loading) {
    return <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  let canAccess = false;

  if (role === "User") {
    if (userRole !== "SuperAdmin" && userRole !== "SubscriptionManager") {
      canAccess = true;
    }
  } else {
    if (userRole === role) {
      canAccess = true;
    }
  }
  
  if (!canAccess) {
    if (userRole === "SuperAdmin") {
        return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === "SubscriptionManager") {
        return <Navigate to="/company/dashboard" replace />;
    } else if (userRole && userRole !== "SuperAdmin" && userRole !== "SubscriptionManager") {
        return <Navigate to="/user/dashboard" replace />;
    }
    return <Navigate to="/" replace />; 
  }
  
  return (
    <div className="app-layout">
      <Navbar userRole={userRole} />
      <main className="content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default ProtectedRoute;