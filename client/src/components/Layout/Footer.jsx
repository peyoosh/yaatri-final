import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Mail, Phone, Shield } from 'lucide-react';

const Footer = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800" style={{ backgroundColor: '#0f172a' }}>

      {/* Main grid */}
      <div className="w-full px-6 lg:px-12 xl:px-20 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Yaatri Hub" className="h-9 w-auto object-contain" />
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white">
                YAATRI<span className="text-brand-blue">HUB</span>
              </span>
              <p className="text-[9px] font-bold tracking-[0.2em] text-brand-saffron uppercase -mt-0.5">NEPAL</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            Nepal's first escrow-backed travel marketplace. Connecting trekkers, certified Sherpa guides, and boutique lodges since 2025.
          </p>
          <div className="flex flex-col gap-2 mt-1">
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-brand-pink shrink-0" />
              Lalitpur, Bagmati, Nepal — 44700
            </span>
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <Mail className="w-3.5 h-3.5 text-brand-blue shrink-0" />
              support@yaatri.np
            </span>
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <Phone className="w-3.5 h-3.5 text-brand-green shrink-0" />
              +977 1-400-0000
            </span>
          </div>
        </div>

        {/* Explore */}
        <div className="flex flex-col gap-4">
          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Explore</h4>
          <div className="flex flex-col gap-2.5">
            {[
              { label: 'Destinations',    path: '/destinations' },
              { label: '✦ AI Guide',      path: '/explore' },
              { label: 'Blog Journal',    path: '/blog' },
              { label: 'Contact Us',      path: '/contact' },
            ].map(({ label, path }) => (
              <button key={path} onClick={() => navigate(path)}
                className="text-left text-xs font-semibold text-slate-500 hover:text-white transition-colors cursor-pointer w-fit">
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Account */}
        <div className="flex flex-col gap-4">
          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Account</h4>
          <div className="flex flex-col gap-2.5">
            {[
              { label: 'Sign In',       path: '/login' },
              { label: 'Create Account', path: '/register' },
              { label: 'My Dashboard',  path: '/dashboard' },
              { label: 'Support',       path: '/support' },
            ].map(({ label, path }) => (
              <button key={path} onClick={() => navigate(path)}
                className="text-left text-xs font-semibold text-slate-500 hover:text-white transition-colors cursor-pointer w-fit">
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Legal + trust badge */}
        <div className="flex flex-col gap-4">
          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Legal</h4>
          <div className="flex flex-col gap-2.5">
            <button onClick={() => navigate('/policies')}
              className="text-left text-xs font-semibold text-slate-500 hover:text-white transition-colors cursor-pointer w-fit">
              Policies &amp; Terms
            </button>
            <button onClick={() => navigate('/support')}
              className="text-left text-xs font-semibold text-slate-500 hover:text-white transition-colors cursor-pointer w-fit">
              Report an Issue
            </button>
          </div>

          <div className="mt-4 p-4 rounded-xl border border-slate-700 bg-slate-800/50 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-green shrink-0" />
              <span className="text-xs font-bold text-brand-green">Escrow Protected</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              All payments held in escrow until trip completion. 15% platform fee. 80% refund on cancellation.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800 px-6 lg:px-12 xl:px-20 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[10px] text-slate-600 font-medium">
          © {year} Yaatri Hub · Built in Lalitpur, Nepal. All Rights Reserved.
        </p>
        <p className="text-[10px] text-slate-700 font-mono">
          YAATRI_CORE v2.0 · SECURE_CATALOG // VERIFIED
        </p>
      </div>
    </footer>
  );
};

export default Footer;
