import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AdminLayout = ({ user }) => {
  const navigate = useNavigate();

  const navLinks = [
    { to: 'usermanagement', label: 'User Management' },
    { to: 'destinationmanagement', label: 'Destination Core' },
    { to: 'blogmanagement', label: 'Blog Moderation' },
    { to: 'hotelmanagement', label: 'Hotel Inventory' },
    { to: 'userguidemanagement', label: 'Guide Services' },
  ];

  return (
    <div className="admin-layout">
      {/* SIDEBAR NAVIGATION */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">YAATRI_HUB</div>
        <nav className="sidebar-nav">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        {/* HEADER */}
        <header className="admin-header">
          <button onClick={() => navigate('/')} className="action-btn info" style={{ marginRight: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} />
            EXIT_TO_HOME
          </button>
          <div className="search-bar">
            <input type="text" placeholder="GLOBAL_SEARCH_NODES..." />
          </div>
          <div className="admin-profile">
            <div className="profile-info">
              <span className="profile-name">{user?.username || 'peyoosh_admin'}</span>
              <span className="profile-role">{user?.role?.toUpperCase() || 'CORE_AUTHOR'}</span>
            </div>
            <div className="profile-avatar">{user?.username?.charAt(0).toUpperCase() || 'P'}</div>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;