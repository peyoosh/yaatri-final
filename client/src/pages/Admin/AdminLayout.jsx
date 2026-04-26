import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Map, FileText, Home } from 'lucide-react';
import '../UserDashboard/UserDashboard.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="user-dashboard-layout">
      {/* ADMIN SIDEBAR */}
      <aside className="user-sidebar">
        <div className="sidebar-brand" onClick={() => navigate('/')}>
          YAATRI ADMIN
        </div>
        
        <div className="sidebar-menu">
          <button 
            className={`menu-item ${location.pathname === '/admin' || location.pathname.includes('/admin/blogs') ? 'active' : ''}`}
            onClick={() => navigate('/admin/blogs')}
          >
            <FileText size={18} /> Moderation
          </button>
          <button 
            className={`menu-item ${location.pathname.includes('/admin/destinations') ? 'active' : ''}`}
            onClick={() => navigate('/admin/destinations')}
          >
            <Map size={18} /> Destinations
          </button>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button className="logout-btn" onClick={() => navigate('/')}>
            <Home size={18} /> Return to Hub
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="user-main" style={{ overflowY: 'auto', maxHeight: '100vh', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;