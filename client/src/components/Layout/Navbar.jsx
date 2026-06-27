import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, LogOut, Menu, X, User as UserIcon, ShieldAlert } from 'lucide-react';

const Navbar = ({ loggedInUser, handleLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsScrolled(currentY > 20);
      setIsVisible(!(currentY > lastScrollY && currentY > 100));
      setLastScrollY(currentY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Close mobile menu on route change
  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const NavLink = ({ to, children, className = '' }) => (
    <button
      onClick={() => navigate(to)}
      className={`font-semibold text-sm transition-colors cursor-pointer relative ${
        isActive(to) ? 'text-brand-blue' : 'text-slate-600 hover:text-brand-blue'
      } ${className}`}
    >
      {children}
      {isActive(to) && (
        <motion.div
          layoutId="nav-underline"
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-blue rounded"
        />
      )}
    </button>
  );

  return (
    <>
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : -100 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed top-0 left-0 right-0 z-40 h-20 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">

          {/* Logo */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <img
              src="/logo.jpg"
              alt="Yaatri Hub"
              className="h-10 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <div>
              <span className={`text-xl font-extrabold tracking-tight ${isScrolled ? 'text-brand-slate' : 'text-white'}`}>
                YAATRI<span className="text-brand-blue">HUB</span>
              </span>
              <p className="text-[9px] font-bold tracking-[0.2em] text-brand-saffron uppercase -mt-1">NEPAL</p>
            </div>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => navigate('/destinations')}
              className={`font-semibold text-sm transition-colors cursor-pointer relative ${
                isActive('/destinations') || isActive('/destination')
                  ? 'text-brand-blue'
                  : isScrolled ? 'text-slate-600 hover:text-brand-blue' : 'text-white/90 hover:text-white'
              }`}
            >
              Destinations
              {(isActive('/destinations') || isActive('/destination')) && (
                <motion.div layoutId="nav-underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-blue rounded" />
              )}
            </button>

            <button
              onClick={() => navigate('/explore')}
              className={`font-semibold text-sm transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer ${
                isActive('/explore')
                  ? 'text-brand-blue font-bold border-brand-blue/30 bg-brand-blue/10'
                  : 'text-brand-blue/90 hover:text-brand-blue border-brand-blue/20 bg-brand-blue/5 hover:bg-brand-blue/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-saffron fill-brand-saffron" />
              ✦ Explore
            </button>

            <button
              onClick={() => navigate('/blog')}
              className={`font-semibold text-sm transition-colors cursor-pointer relative ${
                isActive('/blog')
                  ? 'text-brand-blue'
                  : isScrolled ? 'text-slate-600 hover:text-brand-blue' : 'text-white/90 hover:text-white'
              }`}
            >
              Blog Journal
              {isActive('/blog') && (
                <motion.div layoutId="nav-underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-blue rounded" />
              )}
            </button>
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-4">
            {loggedInUser ? (
              <div className="flex items-center gap-3">
                {loggedInUser.isAdmin && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="px-4 py-1.5 text-xs font-bold text-white rounded-lg cursor-pointer flex items-center gap-1 transition-colors" style={{ backgroundColor: '#0f172a' }}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-brand-saffron" />
                    Admin
                  </button>
                )}

                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 shadow-sm shadow-brand-blue/15 rounded-lg transition-all cursor-pointer"
                >
                  My Dashboard
                </button>

                <button
                  onClick={() => navigate(`/profile/${loggedInUser._id}`)}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  {loggedInUser.avatar ? (
                    <img
                      src={loggedInUser.avatar}
                      alt={loggedInUser.username}
                      className="w-9 h-9 rounded-full object-cover border-2 border-brand-blue/20 group-hover:border-brand-blue transition-colors"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-brand-blue/10 border-2 border-brand-blue/20 flex items-center justify-center text-brand-blue font-bold text-sm">
                      {(loggedInUser.username || 'U').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <p className={`text-xs font-bold group-hover:text-brand-blue transition-colors ${isScrolled ? 'text-brand-slate' : 'text-white'}`}>
                      @{loggedInUser.username}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 capitalize">{loggedInUser.role}</p>
                  </div>
                </button>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-brand-pink transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                    isScrolled ? 'text-slate-700 hover:text-brand-blue' : 'text-white/90 hover:text-white'
                  }`}
                >
                  Sign in
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 text-sm font-bold text-white bg-brand-blue rounded-xl shadow-md shadow-brand-blue/10 hover:bg-brand-blue/90 transition-all cursor-pointer"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-brand-blue transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 top-20 bg-white z-30 px-6 py-8 flex flex-col justify-between md:hidden border-t border-slate-100"
          >
            <div className="flex flex-col gap-6">
              <button onClick={() => navigate('/destinations')} className="text-left text-lg font-bold text-brand-slate hover:text-brand-blue transition-colors">
                Explore Destinations
              </button>
              <button onClick={() => navigate('/explore')} className="text-left text-lg font-bold text-brand-blue flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-saffron fill-brand-saffron" />
                ✦ AI Explore Engine
              </button>
              <button onClick={() => navigate('/blog')} className="text-left text-lg font-bold text-brand-slate hover:text-brand-blue transition-colors">
                Traveler Journals
              </button>
              <button onClick={() => navigate('/contact')} className="text-left text-lg font-bold text-brand-slate hover:text-brand-blue transition-colors">
                Contact
              </button>
            </div>

            <div className="border-t border-slate-100 pt-6">
              {loggedInUser ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    {loggedInUser.avatar ? (
                      <img src={loggedInUser.avatar} alt={loggedInUser.username} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-lg">
                        {(loggedInUser.username || 'U').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-brand-slate">@{loggedInUser.username}</p>
                      <p className="text-xs text-slate-500 capitalize">{loggedInUser.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {loggedInUser.isAdmin && (
                      <button onClick={() => navigate('/admin')} className="flex-1 py-2.5 text-center text-sm font-bold text-white rounded-xl" style={{ backgroundColor: '#0f172a' }}>
                        Admin Panel
                      </button>
                    )}
                    <button onClick={() => navigate('/dashboard')} className="flex-1 py-2.5 text-center text-sm font-bold text-white bg-brand-blue rounded-xl">
                      Dashboard
                    </button>
                    <button onClick={handleLogout} className="p-2.5 bg-red-50 text-brand-pink rounded-xl">
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button onClick={() => navigate('/login')} className="w-full py-3 text-center text-sm font-bold text-slate-700 bg-slate-50 rounded-xl">
                    Sign in
                  </button>
                  <button onClick={() => navigate('/register')} className="w-full py-3 text-center text-sm font-bold text-white bg-brand-blue rounded-xl">
                    Sign up
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
