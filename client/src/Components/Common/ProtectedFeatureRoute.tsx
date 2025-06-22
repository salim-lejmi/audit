import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

interface ProtectedFeatureRouteProps {
  children: React.ReactNode;
  requiredFeature: string;
  fallbackPath?: string;
}

const ProtectedFeatureRoute: React.FC<ProtectedFeatureRouteProps> = ({ 
  children, 
  requiredFeature, 
  fallbackPath = '/company/dashboard' 
}) => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkFeatureAccess();
  }, [requiredFeature]);

  const checkFeatureAccess = async () => {
    try {
      const response = await axios.get('/api/payments/company-subscription');
      
      if (!response.data.hasSubscription) {
        setHasAccess(false);
      } else {
        const features = response.data.subscription.features || [];
        setHasAccess(features.includes(requiredFeature));
      }
    } catch (error) {
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedFeatureRoute;