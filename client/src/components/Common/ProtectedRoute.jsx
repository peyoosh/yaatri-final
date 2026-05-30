import React from 'react';
import { Navigate } from 'react-router-dom';

// Gate routes by sign-in + (optionally) role.
//   isAdminRoute  — legacy flag; admin-only when true.
//   allowedRoles  — new: array of role strings permitted to access. Overrides isAdminRoute when present.
//                   e.g. allowedRoles={['admin', 'support']} grants both admins and support staff.
const ProtectedRoute = ({ user, children, isAdminRoute = false, allowedRoles }) => {
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const role = user.isAdmin ? 'admin' : (user.role || 'user');
    if (!allowedRoles.includes(role)) {
      console.warn(`Access denied: role "${role}" not in allowed list [${allowedRoles.join(', ')}].`);
      return <Navigate to="/" />;
    }
    return children;
  }

  if (isAdminRoute && !user.isAdmin) {
    console.warn('Access Denied: Admin privileges required.');
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
