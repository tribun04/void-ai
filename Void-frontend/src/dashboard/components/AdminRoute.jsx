import React from 'react';
import { useAuth } from '../context/AuthProvider';
import { Navigate, useLocation } from 'react-router-dom';

export const AdminRoute = ({ children }) => {
    const { user } = useAuth();
    const location = useLocation();

    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
        return children;
    }

    return <Navigate to="/" state={{ from: location }} replace />;
};