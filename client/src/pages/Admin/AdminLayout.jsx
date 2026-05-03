import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FileText, MapPin, ChevronLeft, Users, Home, Compass, Menu, X } from 'lucide-react';
import './Dashboard.css';

const AdminLayout = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="admin-layout">
      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Admin Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''} bg-teal-steel`}>
        <div className="sidebar-header">
          <div className="sidebar-brand" onClick={() => { navigate('/'); setIsSidebarOpen(false); }}>YAATRI_ADMIN</div>
          <button className="mobile-close-btn" onClick={toggleSidebar}><X size={24} /></button>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${location.pathname.includes('/overview') ? 'active' : ''}`}
            onClick={() => { navigate('/admin/overview'); setIsSidebarOpen(false); }}
          >
            <Home size={18} /> <span>Overview</span>
          </button>
          <button 
            className={`nav-item ${location.pathname.includes('/usermanagement') ? 'active' : ''}`}
            onClick={() => { navigate('/admin/usermanagement'); setIsSidebarOpen(false); }}
          >
            <Users size={18} /> <span>Users</span>
          </button>
          <button 
            className={`nav-item ${location.pathname.includes('/destinationmanagement') ? 'active' : ''}`}
            onClick={() => { navigate('/admin/destinationmanagement'); setIsSidebarOpen(false); }}
          >
            <MapPin size={18} /> <span>Destinations</span>
          </button>
          <button 
            className={`nav-item ${location.pathname.includes('/blogmanagement') ? 'active' : ''}`}
            onClick={() => { navigate('/admin/blogmanagement'); setIsSidebarOpen(false); }}
          >
            <FileText size={18} /> <span>Blogs</span>
          </button>
          <button 
            className={`nav-item ${location.pathname.includes('/hotelmanagement') ? 'active' : ''}`}
            onClick={() => { navigate('/admin/hotelmanagement'); setIsSidebarOpen(false); }}
          >
            <Home size={18} /> <span>Hotels</span>
          </button>
          <button 
            className={`nav-item ${location.pathname.includes('/userguidemanagement') ? 'active' : ''}`}
            onClick={() => { navigate('/admin/userguidemanagement'); setIsSidebarOpen(false); }}
          >
            <Compass size={18} /> <span>Guides</span>
          </button>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button className="nav-item exit-btn" onClick={() => navigate('/')}>
            <ChevronLeft size={18} /> <span>Exit System</span>
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <button className="mobile-menu-btn" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <div className="search-bar hide-on-mobile">
            <input type="text" placeholder="Search operations..." />
          </div>
          <div className="admin-profile">
            <div className="profile-info">
              <span className="profile-name">{user?.name || 'Admin User'}</span>
              <span className="profile-role">SYSTEM ADMINISTRATOR</span>
            </div>
            <div className="profile-avatar">{user?.name ? user.name[0].toUpperCase() : 'A'}</div>
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
