import React from 'react';
import { AlertTriangle } from 'lucide-react';

const NotificationBar = ({ message }) => {
  if (!message) return null;

  return (
    <div className="notification-bar">
      <AlertTriangle size={16} />
      <span>{message}</span>
    </div>
  );
};

export default NotificationBar;