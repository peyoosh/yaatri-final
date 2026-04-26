import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FileText, MapPin, ChevronLeft } from 'lucide-react';
// Re-use your existing dashboard styling
import '../UserDashboard/UserDashboard.css'; 

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="user-dashboard-layout">
      {/* Admin Sidebar */}
      <aside className="user-sidebar">
        <div className="sidebar-brand" onClick={() => navigate('/')}>YAATRI_ADMIN</div>
        
        <div className="sidebar-menu">
          <button 
            className={`menu-item ${location.pathname === '/admin' || location.pathname.includes('/blogs') ? 'active' : ''}`}
            onClick={() => navigate('/admin/blogs')}
          >
            <FileText size={18} /> Blog Intel
          </button>
          <button 
            className={`menu-item ${location.pathname.includes('/destinations') ? 'active' : ''}`}
            onClick={() => navigate('/admin/destinations')}
          >
            <MapPin size={18} /> Destinations
          </button>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button className="logout-btn" onClick={() => navigate('/')}>
            <ChevronLeft size={18} /> Exit System
          </button>
        </div>
      </aside>
      
      {/* This <Outlet /> is the magic piece that renders BlogManager or DestinationManager */}
      <main className="user-main" style={{ overflowY: 'auto', maxHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;