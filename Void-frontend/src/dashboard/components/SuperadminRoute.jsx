import React from 'react';
import { useAuth } from '../context/AuthProvider';
import { Navigate, useLocation } from 'react-router-dom';

export const SuperadminRoute = ({ children }) => {
    const { user } = useAuth();
    const location = useLocation();

    // Only allow access if the user's role is 'superadmin'
    if (user && user.role === 'superadmin') {
        return children; // If authorized, show the page
    }

    // If not, send them to the login page
    return <Navigate to="/" state={{ from: location }} replace />;
};