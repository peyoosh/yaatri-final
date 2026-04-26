import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ user, children, isAdminRoute = false }) => {
  if (!user) {
    return <Navigate to="/auth?mode=login" />;
  }

  if (isAdminRoute && user.role !== 'author' && !user.isAdmin) {
    console.warn("Access Denied: Author privileges required.");
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;