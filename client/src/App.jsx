import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Globe, Map, Compass } from 'lucide-react';
import './index.css';
import Destinations from './Destinations';
import Home from './Home';
import Blog from './Blog';
import DestinationDetail from './DestinationDetail';
import BlogModal from './BlogModal';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/Admin/Dashboard';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState({ username: 'aaryush_admin', isAdmin: true }); // Simulated login
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedBlogNode, setSelectedBlogNode] = useState(null);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);

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
          <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Lead Node: Aaryush Shrestha</p>
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

  return (
    <div className="app-shell">
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
          <span className="nav-signin">Sign in</span>
          <button className="btn-primary-white" style={{ padding: '0.75rem 1.5rem', fontSize: '0.7rem' }}>Start</button>
        </div>
      </nav>

      <main className="main-content animate-alive">
        <Routes>
          <Route path="/" element={<Home onNavigate={navigate} onSelectNode={handleNodeSelection} />} />
          <Route path="/destinations" element={<Destinations onSelectNode={handleNodeSelection} />} />
          <Route path="/destination-detail" element={<DestinationDetail node={selectedNode} onBack={() => navigate('/destinations')} onSeeBlog={openBlogModal} />} />
          <Route path="/blog" element={<Blog onSeeBlog={openBlogModal} />} />
          <Route path="/contact" element={<ContactView />} />
          <Route path="/admin" element={
            <ProtectedRoute user={loggedInUser}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>

      <BlogModal 
        isOpen={isBlogModalOpen} 
        onClose={() => setIsBlogModalOpen(false)} 
        post={selectedBlogNode} 
      />

      <footer className="system-footer">
        YAATRI.NP | RESEARCH_NODE_2431491 | LALITPUR, NEPAL
      </footer>
    </div>
  );
};

export default App;