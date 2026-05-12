import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ user, children, isAdminRoute = false }) => {
  if (!user) {
    return <Navigate to="/auth?mode=login" />;
  }

  if (isAdminRoute && !user.isAdmin) {
    console.warn("Access Denied: Admin privileges required.");
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;