import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Auth from './Components/Authentification/auth';
import Signup from './Components/Authentification/signup';
import ManageRoles from './Components/Company/manageroles';
import ManageUsers from './Components/Company/manageusers';
import ProfilePage from './Components/Profile/ProfilePage';
import SuperAdminManageRoles from './Components/Admin/adminmanageroles';
import SuperAdminManageUsers from './Components/Admin/adminmanagerusers';
import TaxonomyManager from './Components/Admin/TaxonomyManager';
import TextManagement from './Components/Text/TextManagement';
import SuperAdminDashboard from './Components/Admin/SuperAdminDashboard';
import PendingRequests from './Components/Admin/PendingRequests';
import SubscriptionManagerDashboard from './Components/Company/SubscriptionManagerDashboard';
import ComplianceEvaluation from './Components/Compliance/ComplianceEvaluation';
import ProtectedRoute from './Components/Common/ProtectedRoute';
import ActionPlan from './Components/Compliance/ActionPlan';
const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Auth />} />
        <Route path="/signup" element={<Signup />} />

        {/* Super Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute role="SuperAdmin" />}>
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="pending-requests" element={<PendingRequests />} />
          <Route path="companies" element={<div>Company Management (To be implemented)</div>} />
          <Route path="users" element={<SuperAdminManageUsers/>} />
          <Route path="roles" element={<SuperAdminManageRoles/>} />
          <Route path="texts" element={<TextManagement />} />
          <Route path="taxonomy" element={<TaxonomyManager />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Subscription Manager Routes */}
        <Route path="/company" element={<ProtectedRoute role="SubscriptionManager" />}>
        <Route path="action-plan" element={<ActionPlan />} />
          <Route path="dashboard" element={<SubscriptionManagerDashboard />} />
          <Route path="users" element={<ManageUsers/>} />
          <Route path="roles" element={<ManageRoles/>} />
          <Route path="texts" element={<TextManagement />} />
          <Route path="compliance" element={<ComplianceEvaluation />} />
          <Route path="settings" element={<div>Company Settings (To be implemented)</div>} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* User Routes */}
        <Route path="/user" element={<ProtectedRoute role="User" />}>
          <Route path="compliance" element={<ComplianceEvaluation />} />
          <Route path="profile" element={<ProfilePage />} />
            <Route path="action-plan" element={<ActionPlan />} />

        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;