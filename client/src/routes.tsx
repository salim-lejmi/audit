import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Auth from './Components/Authentification/auth';
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
import UserDashboard from "./Components/Company/UserDashboard"; // Import UserDashboard
import StatisticsPage from './Components/Company/StatisticsPage';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Auth />} />

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
          {/* Add /admin/history and /admin/settings if needed */}
        </Route>

        {/* Subscription Manager Routes */}
        <Route path="/company" element={<ProtectedRoute role="SubscriptionManager" />}>
          <Route path="dashboard" element={<SubscriptionManagerDashboard />} />
          <Route path="users" element={<ManageUsers/>} />
          <Route path="roles" element={<ManageRoles/>} />
          <Route path="texts" element={<TextManagement />} />
          <Route path="compliance" element={<ComplianceEvaluation />} />
          <Route path="action-plan" element={<ActionPlan />} />
          <Route path="settings" element={<div>Company Settings (To be implemented)</div>} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="statistics" element={<StatisticsPage />} />

          {/* Add /company/history if needed */}
        </Route>

        {/* User Routes (for roles like 'User', 'Auditor', 'Manager') */}
   <Route path="/user" element={<ProtectedRoute role="User" />}>
  <Route path="dashboard" element={<UserDashboard />} />
  <Route path="compliance" element={<ComplianceEvaluation />} />
  <Route path="statistics" element={<StatisticsPage />} />

  <Route path="action-plan" element={<ActionPlan />} />
  <Route path="profile" element={<ProfilePage />} />
</Route>


        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;