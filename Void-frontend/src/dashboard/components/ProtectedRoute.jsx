import React from 'react';
import { useAuth } from '../context/AuthProvider';
import { Navigate, useLocation } from 'react-router-dom';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // If we are still in the process of checking for a token (on initial app load),
  // we can show a loading message. This prevents a flicker effect.
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading Application...</div>
      </div>
    );
  }

  // If we are done loading and there is no user, redirect to the login page.
  // We also pass the page they were trying to visit in the 'state' so we can
  // redirect them back there after they log in.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If we are done loading and a user exists, render the component that was passed in
  // (which will be our main DashboardPage).
  return children;
}