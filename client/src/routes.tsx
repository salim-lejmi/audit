import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from './Components/Authentification/login';
import Signup from './Components/Authentification/signup';
import SuperAdminDashboard from './Components/Admin/SuperAdminDashboard';
import PendingRequests from './Components/Admin/PendingRequests';
import SubscriptionManagerDashboard from './Components/Company/SubscriptionManagerDashboard';
import ProtectedRoute from './Components/Common/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Super Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute role="SuperAdmin" />}>
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="pending-requests" element={<PendingRequests />} />
          <Route path="users" element={<div>User Management (To be implemented)</div>} />
          <Route path="companies" element={<div>Company Management (To be implemented)</div>} />
          <Route path="roles" element={<div>Roles Management (To be implemented)</div>} />
        </Route>

        {/* Subscription Manager Routes */}
        <Route path="/company" element={<ProtectedRoute role="SubscriptionManager" />}>
          <Route path="dashboard" element={<SubscriptionManagerDashboard />} />
          <Route path="users" element={<div>Company User Management (To be implemented)</div>} />
          <Route path="settings" element={<div>Company Settings (To be implemented)</div>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;