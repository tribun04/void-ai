import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './dashboard/context/AuthProvider';
import { ChatProvider } from './dashboard/context/ChatProvider';
import { LoginPage } from './dashboard/pages/LoginPage';
import { SignupPage } from './dashboard/pages/SignupPage';
import { DashboardPage } from './dashboard/pages/DashboardPage';
import { SuperadminDashboardPage } from './dashboard/pages/SuperadminDashboardPage';
import { SuperSuperadminDashboardPage } from './dashboard/pages/SuperSuperadminDashboardPage';
import { ProtectedRoute } from './dashboard/components/ProtectedRoute';
import { AdminRoute } from './dashboard/components/AdminRoute';
import { SuperadminRoute } from './dashboard/components/SuperadminRoute';
import { testModal } from './pages/Home';
import { ManageTenantModal } from './dashboard/components/modals/ManageTenantModal';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/testModal" element={<testModal />} />

          <Route path="/dashboard" element={<ProtectedRoute><ChatProvider><DashboardPage /></ChatProvider></ProtectedRoute>} />

          {/* ✅ THE ROUTE WE ARE FIXING ✅ */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <SuperadminDashboardPage />
              </AdminRoute>
            }
          />

          <Route
            path="/superadmin"
            element={
              <SuperadminRoute>
                <SuperSuperadminDashboardPage />
              </SuperadminRoute>
            }
          />
          <Route path="/manage-tenant" element={<ManageTenantModal />} />
          <Route
            path="/superadmin"
            element={
              <SuperadminRoute>
                <SuperSuperadminDashboardPage />
              </SuperadminRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;