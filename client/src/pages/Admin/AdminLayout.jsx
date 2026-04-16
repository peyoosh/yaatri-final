import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AdminLayout = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="admin-layout">
      {/* SIDEBAR NAVIGATION */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">YAATRI_HUB</div>
        <nav className="sidebar-nav">
          <NavLink to="usermanagement" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            User Management
          </NavLink>
          <NavLink to="destinationmanagement" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Destination Core
          </NavLink>
          <NavLink to="blogmanagement" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Blog Moderation
          </NavLink>
          <NavLink to="hotelmanagement" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Hotel Inventory
          </NavLink>
          <NavLink to="userguidemanagement" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Guide Services
          </NavLink>
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