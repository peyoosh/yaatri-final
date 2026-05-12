import React from 'react';

const RoleBadge = ({ role }) => {
  const roleColors = {
    explorer: { bg: '#1A434E', label: 'Explorer' },
    hotel_owner: { bg: '#1A434E', label: 'Hotel Owner' },
    guide: { bg: '#1A434E', label: 'Guide' },
    admin: { bg: '#1A434E', label: 'Admin' }
  };

  const config = roleColors[role] || roleColors.explorer;

  return (
    <span
      style={{
        backgroundColor: config.bg,
        color: '#fff',
        padding: '4px 12px',
        borderRadius: '4px',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        fontFamily: "'Poppins', sans-serif",
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'inline-block'
      }}
    >
      {config.label}
    </span>
  );
};

export default RoleBadge;
