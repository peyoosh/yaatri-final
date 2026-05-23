import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { User, LogOut, Menu, X, Sparkles } from 'lucide-react';
import yaatriLogo from './yaatri_logo.png'; 

const Navbar = ({ loggedInUser, handleLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHidden, setIsHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

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
          style={{ height: '32px', md: '40px', objectFit: 'contain' }} 
        />
      </div>

      {/* MOBILE MENU TOGGLE */}
      <div className="md:hidden flex items-center">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2">
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* DESKTOP RIGHT: NAVIGATION & ACTIONS */}
      <div className="hidden md:flex nav-actions">
        <div className="nav-links-container">
          <span className={`nav-link-block ${location.pathname === '/destinations' ? 'active' : ''}`} onClick={() => navigate('/destinations')}>Destinations</span>
          <span
            className={`nav-link-block flex items-center gap-1 ${location.pathname === '/explore' ? 'active' : ''}`}
            onClick={() => navigate('/explore')}
          >
            <Sparkles size={13} /> Explore
          </span>
          <span className={`nav-link-block ${location.pathname === '/blog' ? 'active' : ''}`} onClick={() => navigate('/blog')}>Blog</span>
          <span className={`nav-link-block ${location.pathname === '/contact' ? 'active' : ''}`} onClick={() => navigate('/contact')}>Contact</span>
        </div>
        
        {loggedInUser?.isAdmin && (
          <span className="nav-link-block text-terai-harvest cursor-pointer hover:text-white" onClick={() => navigate('/admin')}>
            ADMIN
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
                @{(loggedInUser?.username || 'user').toUpperCase()}
              </span>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {(() => {
              const isAuthPage = ['/auth', '/login', '/register'].includes(location.pathname);
              const isLoginMode = location.pathname === '/register' ? false : location.pathname === '/login' ? true : new URLSearchParams(location.search).get('mode') !== 'signup';
              
              if (isAuthPage) {
                return isLoginMode ? (
                  <span className="nav-link-block" onClick={() => navigate('/register')}>Sign up</span>
                ) : (
                  <span className="nav-link-block" onClick={() => navigate('/login')}>Sign in</span>
                );
              }

              return [
                <span key="in" className="nav-link-block" onClick={() => navigate('/login')}>Sign in</span>,
                <span key="up" className="nav-link-block" onClick={() => navigate('/register')}>Sign up</span>
              ];
            })()}
          </div>
        )}
      </div>

      {/* MOBILE NAVIGATION OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100vh' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden fixed top-[6rem] left-0 right-0 bg-obsidian/95 backdrop-blur-xl z-50 flex flex-col items-center justify-start pt-12 overflow-y-auto pb-24 border-t border-white/10"
          >
            <div className="flex flex-col gap-6 w-full px-8">
              <span className={`text-xl font-black tracking-widest text-center border-b border-white/10 pb-4 ${location.pathname === '/destinations' ? 'text-hill-green' : 'text-white'}`} onClick={() => navigate('/destinations')}>DESTINATIONS</span>
              <span className={`text-xl font-black tracking-widest text-center border-b border-white/10 pb-4 flex items-center justify-center gap-2 ${location.pathname === '/explore' ? 'text-toxic-lime' : 'text-white'}`} onClick={() => navigate('/explore')}>
                <Sparkles size={18} /> EXPLORE
              </span>
              <span className={`text-xl font-black tracking-widest text-center border-b border-white/10 pb-4 ${location.pathname === '/blog' ? 'text-hill-green' : 'text-white'}`} onClick={() => navigate('/blog')}>JOURNALS</span>
              <span className={`text-xl font-black tracking-widest text-center border-b border-white/10 pb-4 ${location.pathname === '/contact' ? 'text-hill-green' : 'text-white'}`} onClick={() => navigate('/contact')}>CONTACT</span>
              
              {loggedInUser?.isAdmin && (
                <span className="text-xl font-black tracking-widest text-center border-b border-white/10 pb-4 text-terai-harvest" onClick={() => navigate('/admin')}>
                  ADMIN DASHBOARD
                </span>
              )}

              {loggedInUser ? (
                <div className="flex flex-col items-center gap-6 mt-8">
                  <div 
                    className="flex items-center gap-2 text-hill-green" 
                    onClick={() => navigate('/dashboard')}
                  >
                    <User size={24} />
                    <span className="text-xl font-black tracking-widest">
                      @{(loggedInUser?.username || 'user').toUpperCase()}
                    </span>
                  </div>
                  <button onClick={handleLogout} className="flex items-center gap-2 text-[#ff4d4d] text-lg font-bold">
                    <LogOut size={20} /> SIGN OUT
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 mt-8">
                  <button className="w-full bg-hill-green text-white py-4 rounded-full font-bold tracking-widest text-lg" onClick={() => navigate('/login')}>SIGN IN</button>
                  <button className="w-full bg-transparent border-2 border-white/20 text-white py-4 rounded-full font-bold tracking-widest text-lg" onClick={() => navigate('/register')}>CREATE ACCOUNT</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;