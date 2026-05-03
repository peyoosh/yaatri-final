import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home/Home';
import Blog from './pages/Blog/Blog';
import DestinationDetail from './pages/Destinations/DestinationDetail';
import BlogModal from './components/Common/BlogModal';
import Auth from './pages/Auth/Auth';
import ProtectedRoute from './components/Common/ProtectedRoute';
import UserDashboard from './pages/UserDashboard/UserDashboard';
import Destinations from './pages/Destinations/Destinations';
import Contact from './pages/Contact/Contact';
import AdminDashboard from './pages/Admin/Dashboard';
import Profile from './pages/Profile/Profile';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
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

  // Detect if we are in a management/dashboard view to hide site-wide nav/footer
  const isManagementView = location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard');

  return (
    <AuthProvider>
    <div className={`${isManagementView ? "management-shell" : "app-shell"} font-global`}>
      {!isManagementView && (
        <Navbar loggedInUser={loggedInUser} handleLogout={handleLogout} />
      )}

      <main className={isManagementView ? "management-main" : "main-content animate-alive"}>
        <Routes>
          <Route path="/" element={<Home onNavigate={navigate} onSelectNode={handleNodeSelection} />} />
          <Route path="/destinations" element={<Destinations onSelectNode={handleNodeSelection} />} />
          <Route path="/destination-detail" element={<DestinationDetail node={selectedNode} onBack={() => navigate('/destinations')} onSeeBlog={openBlogModal} />} />
          <Route path="/blog" element={<Blog onSeeBlog={openBlogModal} />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth" element={<Auth onLoginSuccess={setLoggedInUser} />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/dashboard" element={
            <ProtectedRoute user={loggedInUser}>
              <UserDashboard user={loggedInUser} />
            </ProtectedRoute>
          } />
          {/* ADMIN ROUTING: Wildcard delegates all sub-routes to the AdminDashboard router */}
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
        YAATRI.NP | FYP | LALITPUR, NEPAL
      </footer>
        </>
      )}
    </div>
    </AuthProvider>
  );
};

export default App;