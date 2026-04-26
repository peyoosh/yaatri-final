import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Map, Bed, Compass, ChevronLeft, Mountain, Users, Wind, Camera } from 'lucide-react';

const DestinationDetail = ({ node, onBack, onSeeBlog }) => {
  if (!node) return null;

  const userIntel = [
    { id: 1, user: 'trekker_88', img: 'https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=400', likes: 84 },
    { id: 2, user: 'kathmandu_eyes', img: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400', likes: 120 }
  ];

  return (
    <section className="destinations-split-layout">
      {/* LEFT COLUMN: 25% - USER INTEL FEED */}
      <aside className="dest-sidebar" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 6rem)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--hill-green)', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginBottom: '2rem', fontWeight: 'bold', fontSize: '0.7rem' }}>
          <ChevronLeft size={14} /> BACK_TO_RANKINGS
        </button>

        <p className="sidebar-kicker">USER_INTEL_NODES</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {userIntel.map(post => (
            <div 
              key={post.id} 
              onClick={() => onSeeBlog(post)}
              className="intel-node-mini"
              style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', padding: '10px', cursor: 'pointer', transition: 'all 0.3s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--hill-green)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
            >
              <img src={post.img} alt="User" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', filter: 'grayscale(30%)' }} />
              <div style={{ padding: '10px 5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>@{post.user.toUpperCase()}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--hill-green)' }}>
                  <Heart size={12} fill="var(--hill-green)" />
                  <span style={{ fontSize: '0.65rem' }}>{post.likes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* RIGHT COLUMN: 75% - SECTOR ANALYSIS */}
      <main className="dest-rankings" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 6rem)' }}>
        <div style={{ position: 'relative', padding: '4rem 0' }}>
          <p className="rank-region">{node.region}</p>
          <h2 className="vibrant-title" style={{ fontSize: '4rem', margin: '1rem 0' }}>{node.title}</h2>
          <p style={{ color: 'var(--terai-harvest)', fontSize: '1.1rem', maxWidth: '700px', lineHeight: '1.6' }}>
            Detailed analysis of coordinate node {node.rank}. This sector represents the peak of high-altitude exploration in the Nepal system. 
            Topographic stability is currently rated at 94%.
          </p>

          {/* CONTENT GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', marginTop: '4rem' }}>
            
            {/* ACTIVITIES */}
            <div className="info-block">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--hill-green)', marginBottom: '1.5rem' }}>
                <Compass size={20} />
                <h3 style={{ fontSize: '0.8rem', letterSpacing: '3px', fontWeight: '900' }}>POSSIBLE_ACTIVITIES</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, opacity: 0.8 }}>
                <li style={{ marginBottom: '1rem' }}>
                  <strong style={{ display: 'block', color: 'var(--himalayan-mist)' }}>Base Camp Expedition</strong>
                  <span style={{ fontSize: '0.85rem' }}>12-day calculated trek route via Namche Node.</span>
                </li>
                <li style={{ marginBottom: '1rem' }}>
                  <strong style={{ display: 'block', color: 'var(--himalayan-mist)' }}>Kala Patthar Summit</strong>
                  <span style={{ fontSize: '0.85rem' }}>Visual analysis point for 360° terrain mapping.</span>
                </li>
              </ul>
            </div>

            {/* LOGISTICS */}
            <div className="info-block">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--hill-green)', marginBottom: '1.5rem' }}>
                <Bed size={20} />
                <h3 style={{ fontSize: '0.8rem', letterSpacing: '3px', fontWeight: '900' }}>LOCAL_LOGISTICS</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, opacity: 0.8 }}>
                <li style={{ marginBottom: '1rem' }}>
                  <strong style={{ display: 'block', color: 'var(--himalayan-mist)' }}>Everest View Hotel</strong>
                  <span style={{ fontSize: '0.85rem' }}>Highest oxygen-compressed lodging node.</span>
                </li>
                <li style={{ marginBottom: '1rem' }}>
                  <strong style={{ display: 'block', color: 'var(--himalayan-mist)' }}>Yeti Mountain Home</strong>
                  <span style={{ fontSize: '0.85rem' }}>Premium recovery station in Phakding sector.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* EXPERIENCE PROTOCOLS SECTOR */}
          <div style={{ marginTop: '5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--hill-green)', marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '0.8rem', letterSpacing: '3px', fontWeight: '900' }}>EXPERIENCE_PROTOCOLS</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Mountain size={20} style={{ color: 'var(--hill-green)', marginBottom: '1rem' }} />
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem' }}>Adventure on foot</h4>
                <p style={{ fontSize: '0.75rem', opacity: 0.6, lineHeight: '1.5' }}>Expert-led trekking modules with localized survival data specific to this node.</p>
              </div>

              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Users size={20} style={{ color: 'var(--hill-green)', marginBottom: '1rem' }} />
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem' }}>Living traditions</h4>
                <p style={{ fontSize: '0.75rem', opacity: 0.6, lineHeight: '1.5' }}>Connect with heritage through neural-mapped cultural immersion protocols.</p>
              </div>

              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Wind size={20} style={{ color: 'var(--hill-green)', marginBottom: '1rem' }} />
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem' }}>Landscape that moves</h4>
                <p style={{ fontSize: '0.75rem', opacity: 0.6, lineHeight: '1.5' }}>Dynamic topographic tracking optimized for shifting regional weather nodes.</p>
              </div>

              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Camera size={20} style={{ color: 'var(--hill-green)', marginBottom: '1rem' }} />
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem' }}>Guided Cultural Tours</h4>
                <p style={{ fontSize: '0.75rem', opacity: 0.6, lineHeight: '1.5' }}>Structured sector exploration focusing on historical and Newari lineage markers.</p>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <span style={{ fontSize: '0.6rem', opacity: 0.3, fontFamily: 'monospace' }}>[ SECTOR_STATUS: ANALYZED ]</span>
            </div>
          </div>

          {/* ROUTES SECTION */}
          <div style={{ marginTop: '5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--hill-green)', marginBottom: '1.5rem' }}>
              <Map size={20} />
              <h3 style={{ fontSize: '0.8rem', letterSpacing: '3px', fontWeight: '900' }}>CALCULATED_ROUTES</h3>
            </div>
            <div style={{ width: '100%', height: '300px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
              <p style={{ opacity: 0.3, fontSize: '0.7rem', fontFamily: 'monospace' }}>[ RENDER_MAP_UI: PENDING_TECHNICAL_ASSETS ]</p>
            </div>
          </div>
        </div>
      </main>
    </section>
  );
};

export default DestinationDetail;