import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';
import { MapPin, Eye, Headset, Calendar, Award, Compass, CloudSun } from 'lucide-react';
import { fetchDestinations } from '../../api/destinationsApi';
import { fetchSettings } from '../../api/settingsApi';

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

const Home = ({ onNavigate, onSelectNode }) => {
  const [isPaused, setIsPaused] = React.useState(false);
  const [marqueeTitle, setMarqueeTitle] = useState("SYNCING_ATMOSPHERE...");
  const [topModules, setTopModules] = useState([]);
  const trackRef = React.useRef(null);
  
  useEffect(() => {
    const fetchData = async () => {
      const dests = await fetchDestinations();
      const settings = await fetchSettings();
      setTopModules(dests.data);
      setMarqueeTitle(settings.data.marqueeTitle);
    };
    fetchData();
  }, []);

  // Ticker State in Pixels for seamless drag synchronization
  const baseX = useMotionValue(0);

  useAnimationFrame((t, delta) => {
    if (!isPaused && trackRef.current) {
      // moveBy is now positive for Left-to-Right flow
      const moveBy = 1.5 * (delta / 16); 
      
      let newValue = baseX.get() + moveBy;

      // Seamless Left-to-Right Wrapping: 
      const halfWidth = trackRef.current.offsetWidth / 2;
      // Safety: Only wrap if halfWidth is actually calculated to avoid division/modulo bugs
      if (halfWidth > 0) {
        if (newValue >= 0) newValue -= halfWidth;
        if (newValue < -halfWidth) newValue += halfWidth;
      }

      baseX.set(newValue);
    }
  });

  // Mirrors the modules: ...[Tours] -> [Adventure]... creates the loop you requested
  const scrollItems = [...topModules, ...topModules];

  return (
    <div className="home-container">
      {/* SECTION 1: HERO */}
      <section 
        className="hero-section" 
        style={{ 
          minHeight: '100vh',      // Changed to 100vh for a true "full-screen" feel
          width: '100%',           // Fixed typo: changed 10% to 100%
          position: 'relative', 
          top: 0,                  // Pins the section to the top of its parent
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          overflow: 'hidden' 
        }}
      >
        <div 
          className="hero-bg"
          style={{ 
            backgroundImage: `url('/nepal-bg.jpg')`,
            position: 'absolute',
            top: 0, 
            left: 0,
            width: '100%',
            height: '100%',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: -1 
          }}
        />
        
        <motion.div {...fadeIn} className="hero-content">
          <p className="hero-kicker">Founded in Lalitpur</p>
          <h1 className="hero-title">TRUE NEPAL.</h1>
          <p className="hero-description">A high-fidelity replica exploration of the mountains through real-time terrain analysis.</p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary-white" onClick={() => onNavigate('Destinations')}>Initialize System</button>
            <button className="btn-secondary-outline" onClick={() => onNavigate('Planner')}>Open Pathfinder</button>
          </div>
        </motion.div>
      </section>

      {/* SECTION 2: WEATHER-ADAPTIVE NODE ANALYSIS (REFACTORED SLIDER) */}
      <section className="weather-analysis-slider" style={{ padding: '50px 0', overflow: 'hidden', background: 'var(--obsidian)' }}>
        <div className="container" style={{ padding: '1rem 5%', marginBottom: '100px' }}>
          <motion.div {...fadeIn} className="section-header">
            <p className="hero-kicker" style={{ color: 'var(--hill-green)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CloudSun size={16} /> REAL-TIME ATMOSPHERIC SYNC
            </p>
            <h2 className="hero-title" style={{ fontSize: '3rem' }}>{marqueeTitle}</h2>
          </motion.div>
        </div>

        <div 
          className="slider-wrapper" 
          style={{ position: 'relative', width: '100%' }} // Expanded to 100% for better visibility, adjust as needed
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <motion.div 
            ref={trackRef}
            className="slider-track"
            drag="x"
            onDragStart={() => setIsPaused(true)}
            onDragEnd={() => setIsPaused(false)}
            style={{ 
              display: 'flex', 
              width: 'max-content', // Let items define the width
              cursor: 'grab',
              x: baseX // Sync drag and animation to the same MotionValue
            }}
            whileTap={{ cursor: 'grabbing' }}
          >
            {scrollItems.map((item, index) => (
              <motion.div 
                key={`${item.rank}-${index}`} 
                className="analysis-node" 
                onTap={() => onSelectNode(item)}
                style={{ 
                  width: '49%', 
                  marginRight: '1%', 
                  flexShrink: 0,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '40px',
                  minHeight: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
              >
                {item.type === 'destination' && (
                  <div 
                    style={{ 
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                      backgroundImage: `linear-gradient(rgba(13,10,2,0.8), var(--obsidian)), url(${item.image})`,
                      backgroundSize: 'cover', zIndex: -1, opacity: 0.4 
                    }} 
                  />
                )}

                <div className="node-content">
                  <div style={{ color: 'var(--hill-green)', marginBottom: '20px' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '3px' }}>{item.region}</p>
                  </div>
                  <h3 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '15px', color: 'var(--himalayan-mist)' }}>{item.title}</h3>
                  <p style={{ color: 'var(--terai-harvest)', maxWidth: '80%', lineHeight: '1.6' }}>{item.stats}</p>
                </div>
                
                <div className="node-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
                  <span style={{ fontSize: '0.6rem', opacity: 0.4, fontFamily: 'monospace' }}>[ NODE_STATUS: OPTIMAL ]</span>
                  <button 
                    className="btn-link" 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      borderBottom: '1px solid rgba(255,255,255,0.1)', 
                      color: 'rgba(255,255,255,0.4)', 
                      cursor: 'pointer', 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold' 
                    }}>
                    EXPAND_DATA
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 4: KEY METRICS */}
      <section className="py-32 px-[8%] bg-white/[0.02]">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { icon: MapPin, value: '50+', label: 'Locations' },
            { icon: Eye, value: '1M+', label: 'Views' },
            { icon: Headset, value: '24/7', label: 'Support' },
            { icon: Calendar, value: '15+', label: 'Years' },
            { icon: Award, value: '500+', label: 'Guides' },
            { icon: Compass, value: '10K+', label: 'Yaatris' }
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              {...fadeIn} 
              transition={{ delay: i * 0.1 }}
              className="stat-card"
            >
              <stat.icon className="text-[var(--hill-green)] mb-4" size={24} />
              <h4 className="text-4xl font-black mb-2 tracking-tighter">{stat.value}</h4>
              <p className="text-[var(--terai-harvest)] text-xs font-bold uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>
      </div>
  );
};

export default Home;