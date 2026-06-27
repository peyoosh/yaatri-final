import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="text-slate-400 py-12 px-6 border-t border-slate-800" style={{ backgroundColor: '#0f172a' }}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-center sm:text-left">
          <span className="text-base font-extrabold tracking-tight text-white">
            YAATRI<span className="text-brand-blue">HUB</span>
          </span>
          <p className="text-[10px] text-slate-500 mt-1">© 2026 Yaatri Hub · Lalitpur, Nepal. All Rights Reserved.</p>
        </div>

        <div className="flex flex-wrap gap-6 text-xs font-semibold text-slate-500 justify-center">
          <button onClick={() => navigate('/destinations')} className="hover:text-white transition-colors cursor-pointer">Destinations</button>
          <button onClick={() => navigate('/blog')} className="hover:text-white transition-colors cursor-pointer">Blog Journal</button>
          <button onClick={() => navigate('/explore')} className="hover:text-white transition-colors cursor-pointer">✦ Explore AI</button>
          <button onClick={() => navigate('/contact')} className="hover:text-white transition-colors cursor-pointer">Contact</button>
          <button onClick={() => navigate('/policies')} className="hover:text-white transition-colors cursor-pointer">Policies</button>
          <button onClick={() => navigate('/support')} className="hover:text-white transition-colors cursor-pointer">Support</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
