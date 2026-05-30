import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};
import Home from './pages/Home/Home';
import Blog from './pages/Blog/Blog';
import DestinationDetail from './pages/Destinations/DestinationDetail';
import BlogModal from './components/Common/BlogModal';
import AIChatbox from './components/Common/AIChatbox';
import Footer from './components/Layout/Footer';
import Auth from './pages/Auth/Auth';
import ProtectedRoute from './components/Common/ProtectedRoute';
import UserDashboard from './pages/UserDashboard/UserDashboard';
import Destinations from './pages/Destinations/Destinations';
import Contact from './pages/Contact/Contact';
import AdminDashboard from './pages/Admin/Dashboard';
import Profile from './pages/Profile/Profile';
import BookingPage from './pages/Destinations/BookingPage';
import Explore from './pages/Explore/Explore';
import Support from './pages/Support/Support';
import Policies from './pages/Policies/Policies';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import './index.css';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: loggedInUser, logout } = useContext(AuthContext);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedBlogNode, setSelectedBlogNode] = useState(null);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
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

  // Detect if we are in a management/dashboard view to hide site-wide nav/footer
  const isManagementView = location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard');
  // The chat bubble shows EVERYWHERE except: /admin/* (ops surface, no customer chat) and /explore
  // (the full-page AI chat lives there already, two surfaces would be redundant).
  const isAdminView = location.pathname.startsWith('/admin');
  const isAIPage = location.pathname === '/explore';
  const showChatBubble = !isAdminView && !isAIPage;

  return (
    <div className={`${isManagementView ? "management-shell" : "app-shell"} font-global`}>
      <ScrollToTop />
      {!isManagementView && (
        <Navbar loggedInUser={loggedInUser} handleLogout={handleLogout} />
      )}

      <main className={isManagementView ? "management-main" : "main-content animate-alive"}>
        <Routes>
          <Route path="/" element={<Home onNavigate={navigate} onSelectNode={handleNodeSelection} />} />
          <Route path="/destinations" element={<Destinations onSelectNode={handleNodeSelection} />} />
          <Route path="/destination-detail" element={<DestinationDetail node={selectedNode} onBack={() => navigate('/destinations')} onSeeBlog={openBlogModal} />} />
          <Route path="/destination/:id" element={<DestinationDetail onBack={() => navigate('/destinations')} onSeeBlog={openBlogModal} />} />
          <Route path="/destinations/book/:id" element={
            <ProtectedRoute user={loggedInUser}>
              <BookingPage />
            </ProtectedRoute>
          } />
          <Route path="/blog" element={<Blog onSeeBlog={openBlogModal} />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/support" element={<Support />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/dashboard" element={
            <ProtectedRoute user={loggedInUser}>
              <UserDashboard user={loggedInUser} />
            </ProtectedRoute>
          } />
          {/* ADMIN ROUTING: Wildcard delegates all sub-routes to the AdminDashboard router */}
          <Route path="/admin/*" element={
            <ProtectedRoute user={loggedInUser} allowedRoles={['admin', 'support']}>
              <AdminDashboard />
            </ProtectedRoute>
        } />
      </Routes>
    </main>

      {/* BlogModal + Footer only on the non-management public chrome */}
      {!isManagementView && (
        <>
          <BlogModal
            isOpen={isBlogModalOpen}
            onClose={() => setIsBlogModalOpen(false)}
            post={selectedBlogNode}
          />
          <Footer />
        </>
      )}

      {/* AIChatbox rides above the management shell too — only /admin and /explore opt out. */}
      {showChatBubble && <AIChatbox />}
    </div>
  );
};

export default App;