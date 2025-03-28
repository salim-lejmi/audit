import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from './Components/Authentification/login';
import Signup from './Components/Authentification/signup';
import ManageRoles from './Components/Company/manageroles';
import ManageUsers from './Components/Company/manageusers';
import SuperAdminManageRoles from './Components/Admin/adminmanageroles';
import SuperAdminManageUsers from './Components/Admin/adminmanagerusers';
import TextManagement from './Components/Shared/TextManagement';

import SuperAdminDashboard from './Components/Admin/SuperAdminDashboard';
import PendingRequests from './Components/Admin/PendingRequests';
import SubscriptionManagerDashboard from './Components/Company/SubscriptionManagerDashboard';
import ProtectedRoute from './Components/Common/ProtectedRoute';
import Navbar from './Components/Shared/navbar';

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
          <Route path="companies" element={<div>Company Management (To be implemented)</div>} />
          <Route path="users" element={<SuperAdminManageUsers/>} />
          <Route path="roles" element={<SuperAdminManageRoles/>} />
          <Route path="texts" element={<TextManagement />} />
        </Route>

        {/* Subscription Manager Routes */}
        <Route path="/company" element={<ProtectedRoute role="SubscriptionManager" />}>
          <Route path="dashboard" element={<SubscriptionManagerDashboard />} />
          <Route path="users" element={<ManageUsers/>} />
          <Route path="roles" element={<ManageRoles/>} />
          <Route path="texts" element={<TextManagement />} />
          <Route path="settings" element={<div>Company Settings (To be implemented)</div>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;