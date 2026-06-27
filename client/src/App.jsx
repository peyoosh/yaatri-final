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
  const [selectedBlogNode, setSelectedBlogNode] = useState(null);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    document.body.style.overflow = isBlogModalOpen ? 'hidden' : 'auto';
  }, [isBlogModalOpen]);

  const openBlogModal = (post) => {
    setSelectedBlogNode(post);
    setIsBlogModalOpen(true);
  };

  // Admin gets its own full-screen layout (hides global chrome)
  const isAdminView = location.pathname.startsWith('/admin');
  // Explore page manages its own full-height layout — hide footer + bubble there
  const isAIPage = location.pathname === '/explore';

  return (
    <div className={isAdminView ? 'management-shell' : 'app-shell'}>
      <ScrollToTop />

      {/* Global Navbar — hidden only on /admin/* (admin has its own chrome) */}
      {!isAdminView && (
        <Navbar loggedInUser={loggedInUser} handleLogout={handleLogout} />
      )}

      <main className={isAdminView ? 'management-main' : 'main-content animate-alive'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/destinations" element={<Destinations />} />
          <Route path="/destination/:id" element={<DestinationDetail onSeeBlog={openBlogModal} />} />
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
          <Route path="/admin/*" element={
            <ProtectedRoute user={loggedInUser} allowedRoles={['admin', 'support']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="*" element={
            <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 px-6 pt-20">
              <p className="text-8xl font-black text-slate-100 select-none">404</p>
              <h1 className="text-2xl font-extrabold text-brand-slate tracking-tight">Page not found</h1>
              <p className="text-sm text-gray-400 max-w-sm text-center">The trail you're looking for doesn't exist or has moved.</p>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 bg-brand-blue text-white text-sm font-bold rounded-xl hover:bg-brand-blue/90 transition-all cursor-pointer"
              >
                Go back
              </button>
            </div>
          } />
        </Routes>
      </main>

      {/* BlogModal + Footer on all public (non-admin, non-explore) pages */}
      {!isAdminView && (
        <>
          <BlogModal
            isOpen={isBlogModalOpen}
            onClose={() => setIsBlogModalOpen(false)}
            post={selectedBlogNode}
          />
          {/* Footer hidden on /explore — that page fills the full viewport */}
          {!isAIPage && <Footer />}
        </>
      )}

      {/* Floating AI chat bubble — everywhere except /admin and /explore */}
      {!isAdminView && !isAIPage && <AIChatbox />}
    </div>
  );
};

export default App;
