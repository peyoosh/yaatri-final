import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Globe, Map, Compass, User, LogOut } from 'lucide-react';
import Destinations from './Destinations';
import Home from './Home';
import Blog from './Blog';
import DestinationDetail from './DestinationDetail';
import BlogModal from './BlogModal';
import Auth from './Auth';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/Admin/Dashboard';
import UserDashboard from './pages/User/UserDashboard';
import { AuthProvider } from './context/AuthContext';
import './index.css';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExploreOpen, setIsExploreOpen] = useState(false);
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
      <nav className="navbar-main">
        {/* LEFT: BRANDING */}
        <div 
          className="nav-brand"
          onClick={() => navigate('/')}
        >
          YAATRI
        </div>

        {/* RIGHT: NAVIGATION & ACTIONS */}
        <div className="nav-actions">
          <div className="nav-links-container">
            <span className={`nav-link-block ${location.pathname === '/destinations' ? 'active' : ''}`} onClick={() => navigate('/destinations')}>Destinations</span>
            <span className={`nav-link-block ${location.pathname === '/blog' ? 'active' : ''}`} onClick={() => navigate('/blog')}>Blog</span>
            <span className={`nav-link-block ${location.pathname === '/contact' ? 'active' : ''}`} onClick={() => navigate('/contact')}>Contact</span>
            <div 
              className="relative"
              onMouseEnter={() => setIsExploreOpen(true)}
              onMouseLeave={() => setIsExploreOpen(false)}
            >
              <span className="nav-link-block flex items-center gap-2">
                Explore <ChevronDown size={14} className={`transition-transform duration-300 ${isExploreOpen ? 'rotate-180' : ''}`} />
              </span>
              <AnimatePresence>
                {isExploreOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="nav-dropdown"
                  >
                    <div className="nav-link-block" style={{ fontSize: '0.7rem' }}>Safari Expeditions</div>
                    <div className="nav-link-block" style={{ fontSize: '0.7rem' }}>Mountain Treks</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {loggedInUser?.role === 'author' && (
            <span className="nav-link-block" style={{ color: 'var(--terai-harvest)', cursor: 'pointer' }} onClick={() => navigate('/admin')}>
              MANAGEMENT_FRONT
            </span>
          )}
          {loggedInUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div 
                className="nav-link-block flex items-center gap-2" 
                style={{ color: 'var(--hill-green)', cursor: 'pointer' }} 
                onClick={() => navigate('/dashboard')}
              >
                <User size={18} />
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                  @{loggedInUser.username.toUpperCase()}
                </span>
              </div>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {(() => {
                const isAuthPage = location.pathname === '/auth';
                const isLoginMode = new URLSearchParams(location.search).get('mode') !== 'signup';
                
                if (isAuthPage) {
                  return isLoginMode ? (
                    <span className="nav-link-block" onClick={() => navigate('/auth?mode=signup')}>Sign up</span>
                  ) : (
                    <span className="nav-link-block" onClick={() => navigate('/auth?mode=login')}>Sign in</span>
                  );
                }

                return [
                  <span key="in" className="nav-link-block" onClick={() => navigate('/auth?mode=login')}>Sign in</span>,
                  <span key="up" className="nav-link-block" onClick={() => navigate('/auth?mode=signup')}>Sign up</span>
                ];
              })()}
            </div>
          )}
        </div>
      </nav>
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
          <Route path="/admin" element={
            <ProtectedRoute user={loggedInUser}>
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