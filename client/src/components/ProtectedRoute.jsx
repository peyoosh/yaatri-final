import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ user, children }) => {
  const navigate = useNavigate();
  if (!user || !user.isAdmin) {
    // Trigger a view reset if the user isn't an admin
    setTimeout(() => navigate('/'), 0);
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;