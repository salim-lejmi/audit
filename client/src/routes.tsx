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
import ProtectedFeatureRoute from './Components/Common/ProtectedFeatureRoute';
import ActionPlan from './Components/Compliance/ActionPlan';
import UserDashboard from "./Components/Company/UserDashboard";
import StatisticsPage from './Components/Company/StatisticsPage';
import RevueDeDirectionPage from './Components/Revue/RevueDeDirectionPage';
import RevueDetailPage from './Components/Revue/RevueDetailPage';
import EmailVerification from './Components/Authentification/EmailVerification';
import HistoryPage from './Components/Company/history';
import QuotesPage from './Components/Quotes/QuotesPage';
import PaymentPage from './Components/Payments/PaymentPage';
import CompanySettings from './Components/Company/CompanySettings';
import AdminCompanyManagement from './Components/Admin/admincompanymanagement';
import Dashboard from "./Components/Admin/Dashboard";

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Auth />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        
        {/* Super Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute role="SuperAdmin" />}>
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="pending-requests" element={<PendingRequests />} />
<Route path="companies" element={<AdminCompanyManagement />} />
          <Route path="users" element={<SuperAdminManageUsers/>} />
          <Route path="roles" element={<SuperAdminManageRoles/>} />
          <Route path="texts" element={<TextManagement />} />
          <Route path="taxonomy" element={<TaxonomyManager />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="quotes" element={<QuotesPage />} />
          <Route path="history" element={<HistoryPage />} />
                    <Route path="dashboardd" element={<Dashboard />} /> {/* Updated to use new Dashboard */}

        </Route>

        {/* Subscription Manager Routes */}
        <Route path="/company" element={<ProtectedRoute role="SubscriptionManager" />}>
          <Route path="dashboard" element={<SubscriptionManagerDashboard />} />
          <Route path="payments" element={<PaymentPage />} />
          <Route path="settings" element={<CompanySettings />} />
          <Route path="users" element={<ManageUsers/>} />
          <Route path="roles" element={<ManageRoles/>} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="texts" element={
            <ProtectedFeatureRoute requiredFeature="Text Management">
              <TextManagement />
            </ProtectedFeatureRoute>
          } />
          <Route path="compliance" element={
            <ProtectedFeatureRoute requiredFeature="Compliance Management">
              <ComplianceEvaluation />
            </ProtectedFeatureRoute>
          } />
          <Route path="action-plan" element={
            <ProtectedFeatureRoute requiredFeature="Action Plans">
              <ActionPlan />
            </ProtectedFeatureRoute>
          } />
          <Route path="statistics" element={
            <ProtectedFeatureRoute requiredFeature="Statistics & Analytics">
              <StatisticsPage />
            </ProtectedFeatureRoute>
          } />
          <Route path="revue" element={
            <ProtectedFeatureRoute requiredFeature="Management Review (Revue)">
              <RevueDeDirectionPage />
            </ProtectedFeatureRoute>
          } />
          <Route path="revue/:id" element={
            <ProtectedFeatureRoute requiredFeature="Management Review (Revue)">
              <RevueDetailPage />
            </ProtectedFeatureRoute>
          } />
          <Route path="revue/:id/edit" element={
            <ProtectedFeatureRoute requiredFeature="Management Review (Revue)">
              <RevueDetailPage />
            </ProtectedFeatureRoute>
          } />
          <Route path="settings" element={<div>Company Settings (To be implemented)</div>} />
        </Route>

        {/* User Routes (for roles like 'User', 'Auditor', 'Manager') */}
        <Route path="/user" element={<ProtectedRoute role="User" />}>
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="compliance" element={
            <ProtectedFeatureRoute requiredFeature="Compliance Management">
              <ComplianceEvaluation />
            </ProtectedFeatureRoute>
          } />
          <Route path="statistics" element={
            <ProtectedFeatureRoute requiredFeature="Statistics & Analytics">
              <StatisticsPage />
            </ProtectedFeatureRoute>
          } />
          <Route path="action-plan" element={
            <ProtectedFeatureRoute requiredFeature="Action Plans">
              <ActionPlan />
            </ProtectedFeatureRoute>
          } />
          <Route path="revue" element={
            <ProtectedFeatureRoute requiredFeature="Management Review (Revue)">
              <RevueDeDirectionPage />
            </ProtectedFeatureRoute>
          } />
          <Route path="revue/:id" element={
            <ProtectedFeatureRoute requiredFeature="Management Review (Revue)">
              <RevueDetailPage />
            </ProtectedFeatureRoute>
          } />
          <Route path="revue/:id/edit" element={
            <ProtectedFeatureRoute requiredFeature="Management Review (Revue)">
              <RevueDetailPage />
            </ProtectedFeatureRoute>
          } />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;