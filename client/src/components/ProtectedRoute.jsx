import React from 'react';

const ProtectedRoute = ({ user, children, onRedirect }) => {
  if (!user || !user.isAdmin) {
    // Trigger a view reset if the user isn't an admin
    setTimeout(() => onRedirect('Home'), 0);
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;