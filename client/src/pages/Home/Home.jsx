import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';
import { MapPin, Eye, Headset, Calendar, Award, Compass, CloudSun, Flag, Bookmark, Split, ArrowRight, Quote } from 'lucide-react';
import api from '../../api/axios';
import { formatMetricNumber } from '../../utils/formatMetrics';

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
  const [metrics, setMetrics] = useState({
    locations: 0,
    views: 0,
    years: 0,
    guides: 0,
    users: 0
  });
  const trackRef = React.useRef(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching real-time metrics and destinations...');
        
        // Fetch real metrics from backend stats endpoint
        const statsRes = await api.get(`/stats/metrics`);
        const stats = statsRes.data || {};
        console.log('Stats fetched:', stats);
        
        // Fetch destinations for the carousel
        const destsRes = await api.get(`/destinations`);
        const destinations = destsRes.data || [];
        console.log('Destinations fetched:', destinations.length);
        
        // Fetch settings for marquee title
        const settingsRes = await api.get(`/settings`);
        const settings = settingsRes.data || {};
        console.log('Settings fetched:', settings);
        
        // Update metrics with real data from backend
        setMetrics({
          locations: stats.locations || 0,
          views: stats.views || 0,
          years: stats.years || 0,
          guides: stats.guides || 0,
          users: stats.users || 0
        });
        
        setTopModules(destinations);
        setMarqueeTitle(settings.marqueeTitle || "SYNCING_ATMOSPHERE...");
      } catch (err) {
        console.error('Error fetching home data:', err);
        console.error('API Error Details:', {
          message: err.message,
          code: err.code,
          status: err.response?.status,
          data: err.response?.data
        });
        // Fallback: keep metrics at 0 instead of using fake data
        setMetrics({
          locations: 0,
          views: 0,
          years: 0,
          guides: 0,
          users: 0
        });
      }
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
        
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,10,2,0.55)' }} />

        <motion.div {...fadeIn} className="hero-content" style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 1.5rem', maxWidth: '900px' }}>
          <h1
            className="text-5xl md:text-6xl font-black tracking-tighter text-white"
            style={{ marginBottom: '1.5rem', lineHeight: 1.05 }}
          >
            Go where the world calls you
          </h1>
          <p
            className="max-w-2xl text-center text-sm md:text-base text-white/80 leading-relaxed"
            style={{ margin: '0 auto 2rem' }}
          >
            From hidden valleys to high passes, Yaatri stitches together the destinations, guides, and journals that turn a trip into a story you keep telling.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary-white" onClick={() => onNavigate('/destinations')}>Explore</button>
            <button className="btn-secondary-outline" onClick={() => onNavigate('/contact')}>Learn</button>
          </div>
        </motion.div>
      </section>

      {/* SECTION 2: WEATHER-ADAPTIVE NODE ANALYSIS (REFACTORED SLIDER) */}
      <section className="weather-analysis-slider" style={{ padding: '32px 0', overflow: 'hidden', background: 'var(--obsidian)' }}>
        <div className="container" style={{ padding: '0.5rem 5%', marginBottom: '32px' }}>
          <motion.div {...fadeIn} className="section-header">
            <p className="hero-kicker" style={{ color: 'var(--hill-green)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CloudSun size={16} /> REAL-TIME ATMOSPHERIC SYNC
            </p>
            <h2 className="hero-title text-4xl md:text-[3rem] font-bold text-himalayan-mist">{marqueeTitle}</h2>
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
                key={`${item._id}-${index}`}
                className="analysis-node w-[80%] md:w-[31%] mr-[5%] md:mr-[2.5%] shrink-0"
                onTap={() => onSelectNode(item)}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  padding: '24px',
                  minHeight: '260px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
              >
                <div
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundImage: `linear-gradient(rgba(13,10,2,0.55), rgba(13,10,2,0.85)), url(${item.imageURL})`,
                    backgroundSize: 'cover', backgroundPosition: 'center', zIndex: -1
                  }}
                />

                <div className="node-content">
                  <div style={{ color: 'var(--hill-green)', marginBottom: '8px' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '3px' }}>{item.region}</p>
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '8px', color: 'var(--himalayan-mist)', lineHeight: 1.2 }}>{item.name}</h3>
                  <p style={{
                    color: 'var(--terai-harvest)',
                    lineHeight: '1.45',
                    fontSize: '0.85rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>{item.description}</p>
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--hill-green)', fontWeight: 'bold' }}>
                      {item.terrainType}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--terai-harvest)' }}>
                      Popularity: {item.popularityScore}/100
                    </span>
                  </div>
                </div>

                <div className="node-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <span style={{ fontSize: '0.55rem', opacity: 0.4, fontFamily: 'monospace' }}>[ NODE_STATUS: ACTIVE ]</span>
                  <button
                    className="btn-link"
                    style={{
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      fontSize: '0.65rem',
                      fontWeight: 'bold'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('/destinations');
                    }}
                  >
                    EXPLORE_DESTINATION
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 3: JOURNEYS / THREE WAYS TO SEE THE WORLD (PILLARS) */}
      <section className="py-24 px-[8%]" style={{ background: 'var(--obsidian, #0D0A02)' }}>
        <motion.div {...fadeIn} className="max-w-6xl mx-auto">
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--hill-green, #059D72)', marginBottom: '1rem' }}
          >
            Journeys
          </p>
          <h2
            className="text-4xl md:text-5xl font-black tracking-tighter text-white"
            style={{ marginBottom: '1rem', lineHeight: 1.1, maxWidth: '720px' }}
          >
            Three ways to see the world
          </h2>
          <p
            className="text-sm md:text-base text-white/70 leading-relaxed"
            style={{ maxWidth: '560px', marginBottom: '3rem' }}
          >
            Whether you carve your own route, ride with a curated group, or strike out alone, Yaatri puts a real network of guides and lodges behind every plan.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                Icon: Flag,
                title: 'Custom tours',
                detail: 'Build a route around what you actually want to see — handpicked stops, your pace, your crew.',
              },
              {
                Icon: Bookmark,
                title: 'Group packages',
                detail: 'Join a curated party with vetted guides and locked-in lodging across the most-loved trails.',
              },
              {
                Icon: Split,
                title: 'Solo adventures',
                detail: 'Go alone with a safety net — local check-ins, satellite-mapped routes, and on-call support.',
              },
            ].map(({ Icon, title, detail }) => (
              <div
                key={title}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  padding: '2rem',
                  transition: 'border-color 0.25s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--hill-green, #059D72)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
              >
                <Icon size={22} style={{ color: 'var(--hill-green, #059D72)', marginBottom: '1.25rem' }} />
                <h3 className="text-xl font-bold text-white" style={{ marginBottom: '0.5rem' }}>{title}</h3>
                <p className="text-sm text-white/65 leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <button
              onClick={() => onNavigate('/destinations')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--hill-green, #059D72)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Discover <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      </section>

      {/* SECTION 4: NUMBERS — SPLIT EDITORIAL */}
      <section className="py-24 px-[8%]" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <motion.div
          {...fadeIn}
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center"
          style={{ gap: '3rem' }}
        >
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--hill-green, #059D72)', marginBottom: '1rem' }}
            >
              Numbers
            </p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white" style={{ marginBottom: '2rem', lineHeight: 1.1 }}>
              We've sent travelers everywhere
            </h2>
            <button
              onClick={() => onNavigate('/destinations')}
              className="btn-primary-white"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              Explore <ArrowRight size={16} />
            </button>
          </div>

          <div>
            <p className="text-sm md:text-base text-white/75 leading-relaxed" style={{ marginBottom: '2rem' }}>
              {metrics.years || 'Many'} years of moving people across continents — from first-time hikers chasing prayer-flag villages to seasoned mountaineers eyeing the highest passes on Earth.
            </p>

            <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
              {[
                { Icon: MapPin, value: `${metrics.locations || 0}+`, label: 'Locations' },
                { Icon: Award, value: `${metrics.guides || 0}+`, label: 'Guides' },
                { Icon: Compass, value: `${formatMetricNumber(metrics.users) || 0}+`, label: 'Yaatris' },
              ].map(({ Icon, value, label }) => (
                <div key={label} className="stat-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                  <Icon size={18} style={{ color: 'var(--hill-green, #059D72)', marginBottom: '0.6rem' }} />
                  <h4 className="text-2xl font-black tracking-tighter text-white">{value}</h4>
                  <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/55">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* SECTION 5: TESTIMONIALS — TRAVELERS SPEAK */}
      <section className="py-24 px-[8%]" style={{ background: 'var(--obsidian, #0D0A02)' }}>
        <motion.div {...fadeIn} className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--hill-green, #059D72)', marginBottom: '1rem' }}>
            Travelers speak
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white" style={{ marginBottom: '0.5rem', lineHeight: 1.1 }}>
            What people say after they return
          </h2>
          <p className="text-sm text-white/60" style={{ marginBottom: '3rem' }}>
            Unedited words from travelers who walked the trails.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                org: 'KHUMBU 2024',
                quote: 'The guide network is the real product. They knew which tea house had the warmest stove on the worst night of the trek.',
                name: 'Amelia Cho',
                title: 'Photographer · Berlin',
              },
              {
                org: 'MUSTANG 2023',
                quote: 'Booked a custom 9-day loop. Two of the lodges they paired me with do not show up on any other platform.',
                name: 'Ravi Bhattarai',
                title: 'Software Engineer · Bangalore',
              },
              {
                org: 'ANNAPURNA 2024',
                quote: 'I went solo. The check-in system gave my family peace of mind without making the trip feel managed.',
                name: 'Júlia Almeida',
                title: 'Designer · Lisbon',
              },
            ].map((t) => (
              <div
                key={t.name}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-[0.65rem] font-bold tracking-widest text-white/55">{t.org}</span>
                  <Quote size={16} style={{ color: 'var(--hill-green, #059D72)' }} />
                </div>
                <p className="text-sm text-white/80 italic leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 'auto' }}>
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'var(--hill-green, #059D72)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--obsidian, #0D0A02)', fontWeight: 900, fontSize: '0.85rem',
                    }}
                  >
                    {t.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-[0.7rem] text-white/55">{t.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* SECTION 6: CTA — START PLANNING */}
      <section className="py-24 px-[8%]" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <motion.div
          {...fadeIn}
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center"
          style={{
            gap: '3rem',
            background: 'rgba(13,10,2,0.6)',
            border: '1px solid var(--hill-green, #059D72)',
            borderRadius: '12px',
            padding: '3rem',
          }}
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white" style={{ marginBottom: '0.75rem', lineHeight: 1.1 }}>
              Start planning your next trip
            </h2>
            <p className="text-sm md:text-base text-white/70 leading-relaxed" style={{ marginBottom: '1.75rem' }}>
              Pick a destination, browse a guide's track record, lock in a lodge. Most of our travelers finalize their first plan in under fifteen minutes.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn-primary-white" onClick={() => onNavigate('/destinations')}>Begin</button>
              <button
                onClick={() => onNavigate('/contact')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--hill-green, #059D72)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.6rem 0',
                }}
              >
                Learn more <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div
            style={{
              minHeight: '220px',
              borderRadius: '10px',
              backgroundImage: "linear-gradient(rgba(13,10,2,0.2), rgba(13,10,2,0.6)), url('/nepal-bg.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          />
        </motion.div>
      </section>

      {/* SECTION 7: NEWSLETTER */}
      <section className="py-24 px-[8%]" style={{ background: 'var(--obsidian, #0D0A02)' }}>
        <motion.div
          {...fadeIn}
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center"
          style={{ gap: '3rem' }}
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white" style={{ marginBottom: '0.75rem', lineHeight: 1.1 }}>
              Get travel stories and deals in your inbox
            </h2>
            <p className="text-sm md:text-base text-white/70 leading-relaxed" style={{ marginBottom: '1.5rem' }}>
              One short email a month. Real journals from real travelers, plus the occasional off-season lodging discount.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Thanks — we\'ll be in touch.');
              }}
              style={{
                display: 'flex',
                gap: '0.5rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '0.4rem',
                maxWidth: '460px',
              }}
            >
              <input
                type="email"
                placeholder="Your email address"
                required
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'white',
                  fontSize: '0.9rem',
                  padding: '0.6rem 0.75rem',
                }}
              />
              <button
                type="submit"
                className="btn-primary-white"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
              >
                Subscribe
              </button>
            </form>
          </div>

          <div
            style={{
              aspectRatio: '1 / 1',
              borderRadius: '10px',
              backgroundImage: "linear-gradient(rgba(13,10,2,0.25), rgba(13,10,2,0.65)), url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          />
        </motion.div>
      </section>
      </div>
  );
};

export default Home;