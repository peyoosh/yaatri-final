import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { ChevronDown, User, LogOut } from 'lucide-react';
// Reverting temporarily to the working yaatri logo
import yaatriLogo from './yaatri_logo.png'; 

const Navbar = ({ loggedInUser, handleLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    // Hide navbar if scrolling down and scrolled past 100px. Show if scrolling up.
    if (latest > previous && latest > 100) {
      setIsHidden(true);
    } else {
      setIsHidden(false);
    }
  });

  return (
    <motion.nav 
      className="navbar-main"
      variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}
      animate={isHidden ? "hidden" : "visible"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* LEFT: BRANDING & LOGO */}
      <div 
        className="nav-brand"
        onClick={() => navigate('/')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
      >
        <img 
          src={yaatriLogo} 
          alt="YAATRI" 
          className="nav-logo" 
          style={{ height: '40px', objectFit: 'contain' }} 
        />
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
            ADMIN_DASHBOARD
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
    </motion.nav>
  );
};

export default Navbar;