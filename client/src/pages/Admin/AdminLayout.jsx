import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FileText, MapPin, ChevronLeft, Users, Home, Compass } from 'lucide-react';
// Re-use your existing dashboard styling
import '../UserDashboard/UserDashboard.css'; 

const AdminLayout = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="user-dashboard-layout">
      {/* Admin Sidebar */}
      <aside className="user-sidebar">
        <div className="sidebar-brand" onClick={() => navigate('/')}>YAATRI_ADMIN</div>
        
        <div className="sidebar-menu">
          <button 
            className={`menu-item ${location.pathname.includes('/usermanagement') ? 'active' : ''}`}
            onClick={() => navigate('/admin/usermanagement')}
          >
            <Users size={18} /> Users
          </button>
          <button 
            className={`menu-item ${location.pathname.includes('/destinationmanagement') ? 'active' : ''}`}
            onClick={() => navigate('/admin/destinationmanagement')}
          >
            <MapPin size={18} /> Destinations
          </button>
          <button 
            className={`menu-item ${location.pathname.includes('/blogmanagement') ? 'active' : ''}`}
            onClick={() => navigate('/admin/blogmanagement')}
          >
            <FileText size={18} /> Blogs
          </button>
          <button 
            className={`menu-item ${location.pathname.includes('/hotelmanagement') ? 'active' : ''}`}
            onClick={() => navigate('/admin/hotelmanagement')}
          >
            <Home size={18} /> Hotels
          </button>
          <button 
            className={`menu-item ${location.pathname.includes('/userguidemanagement') ? 'active' : ''}`}
            onClick={() => navigate('/admin/userguidemanagement')}
          >
            <Compass size={18} /> Guides
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