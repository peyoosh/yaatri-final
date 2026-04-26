import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './Home';
import Blog from './Blog';
import DestinationDetail from './DestinationDetail';
import BlogModal from './BlogModal';
import Auth from './Auth';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/Admin/Dashboard';
import UserDashboard from './UserDashboard';
import Destinations from './Destinations';
import { AuthProvider } from './context/AuthContext';
import Navbar from './Navbar';
import './index.css';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Initialize state directly from localStorage to prevent redirect flickers
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const saved = localStorage.getItem('yaatri_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedBlogNode, setSelectedBlogNode] = useState(null);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('yaatri_token');
    localStorage.removeItem('yaatri_user');
    setLoggedInUser(null);
    navigate('/');
  };

  useEffect(() => {
    if (isBlogModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isBlogModalOpen]);

  const openBlogModal = (post) => {
    setSelectedBlogNode(post);
    setIsBlogModalOpen(true);
  };

  const handleNodeSelection = (node) => {
    setSelectedNode(node);
    navigate('/destination-detail');
  };

  const ContactView = () => (
    <div className="view-container contact-node" style={{ padding: '4rem 10%', minHeight: '80vh' }}>
      <h2 className="vibrant-title">Contact Assistance</h2>
      <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', marginTop: '3rem' }}>
        <div className="info-block">
          <h3 style={{ color: 'var(--hill-green)', fontSize: '0.8rem', letterSpacing: '2px', fontWeight: '900' }}>WEBSITE_HOLDER</h3>
          <p style={{ marginTop: '1rem', fontWeight: '600' }}>YAATRI CORE SYSTEMS // Sector 4</p>
          <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Lead Node: Yaatri Core Administrator</p>
          <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Uplink: support@yaatri.np.system</p>
        </div>
        <div className="info-block">
          <h3 style={{ color: 'var(--hill-green)', fontSize: '0.8rem', letterSpacing: '2px', fontWeight: '900' }}>INQUIRY_EXAMPLES</h3>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', opacity: 0.6, fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <li>[ID_001] Terrain Scan Request - Khumbu</li>
            <li>[ID_042] Cultural Protocol Sync - Newari</li>
            <li>[ID_109] Pathfinding Calculation - Mustang</li>
          </ul>
        </div>
        <div className="info-block" style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
          <h3 style={{ color: 'var(--hill-green)', fontSize: '0.8rem', letterSpacing: '2px', fontWeight: '900' }}>ADDITIONAL_INTEL // LICENCE</h3>
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', opacity: 0.5, lineHeight: '1.6', maxWidth: '800px' }}>
            This system interface and all associated terrain mapping data are licensed under the YAATRI_V7_OPEN_INTEL_PROTOCOL. Commercial redistribution of localized research nodes without Sector verification is strictly prohibited. © 2024 RESEARCH_NODE_2431491.
          </p>
        </div>
      </div>
    </div>
  );

  // Detect if we are in a management/dashboard view to hide site-wide nav/footer
  const isManagementView = location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard');

  return (
    <AuthProvider>
    <div className={isManagementView ? "management-shell" : "app-shell"}>
      {!isManagementView && (
        <Navbar loggedInUser={loggedInUser} handleLogout={handleLogout} />
      )}

      <main className={isManagementView ? "management-main" : "main-content animate-alive"}>
        <Routes>
          <Route path="/" element={<Home onNavigate={navigate} onSelectNode={handleNodeSelection} />} />
          <Route path="/destinations" element={<Destinations onSelectNode={handleNodeSelection} />} />
          <Route path="/destination-detail" element={<DestinationDetail node={selectedNode} onBack={() => navigate('/destinations')} onSeeBlog={openBlogModal} />} />
          <Route path="/blog" element={<Blog onSeeBlog={openBlogModal} />} />
          <Route path="/contact" element={<ContactView />} />
          <Route path="/auth" element={<Auth onLoginSuccess={setLoggedInUser} />} />
          <Route path="/dashboard" element={
            <ProtectedRoute user={loggedInUser}>
              <UserDashboard user={loggedInUser} />
            </ProtectedRoute>
          } />
          {/* ADMIN ROUTING: Wildcard delegates all sub-routes (usermanagement, etc.) to the AdminDashboard router */}
          <Route path="/admin/*" element={
            <ProtectedRoute user={loggedInUser} isAdminRoute={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>

      {!isManagementView && (
        <>
      <BlogModal 
        isOpen={isBlogModalOpen} 
        onClose={() => setIsBlogModalOpen(false)} 
        post={selectedBlogNode} 
      />

      <footer className="system-footer">
        YAATRI.NP | RESEARCH_NODE_2431491 | LALITPUR, NEPAL
      </footer>
        </>
      )}
    </div>
    </AuthProvider>
  );
};

export default App;