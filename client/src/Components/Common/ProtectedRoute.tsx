import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../shared/navbar';

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
        const response = await axios.get('/api/auth/verify');
        setIsAuthenticated(true);
        setUserRole(response.data.role);
      } catch {
        setIsAuthenticated(false);
        navigate('/', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    
    verifyAuth();
  }, [navigate]);
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (role && userRole !== role) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <>
      <Navbar userRole={userRole} />
      <main className="content">
        <Outlet />
      </main>
    </>
  );
};

export default ProtectedRoute;