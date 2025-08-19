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

// ✅ Pick ONE of the two import styles below, and make sure Home.jsx matches.
// Option A: default export (recommended)
import Olive from './pages/Home';
// Option B: named export
// import { Olive } from './pages/Home';

import { ManageTenantModal } from './dashboard/components/modals/ManageTenantModal';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/olive" element={<Olive />} />

          {/* Protected dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ChatProvider>
                  <DashboardPage />
                </ChatProvider>
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <SuperadminDashboardPage />
              </AdminRoute>
            }
          />

          {/* Superadmin (single definition, duplicate removed) */}
          <Route
            path="/superadmin"
            element={
              <SuperadminRoute>
                <SuperSuperadminDashboardPage />
              </SuperadminRoute>
            }
          />

          {/* This is unusual (modals are typically rendered inside pages),
              but left as-is per your current structure. */}
          <Route path="/manage-tenant" element={<ManageTenantModal />} />

          {/* 404 */}
          <Route path="*" element={<div style={{ padding: 24, color: '#fff' }}>Not Found</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
