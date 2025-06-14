import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useNavigate }from 'react-router-dom';
import axios from 'axios';
import Navbar from '../shared/navbar'; // Ensure this path is correct

interface ProtectedRouteProps {
  role: string; // This 'role' prop defines the access requirement for the route group
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ role }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(''); // This is the actual role of the logged-in user
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
    <>
      <Navbar userRole={userRole} />
      <main className="content"> {}
        <Outlet />
      </main>
    </>
  );
};

export default ProtectedRoute;