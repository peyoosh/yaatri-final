import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Map, Bed, Compass, ChevronLeft, Mountain, Users, Wind, Camera } from 'lucide-react';

const DestinationDetail = ({ node, onBack, onSeeBlog }) => {
  const [activeProtocol, setActiveProtocol] = useState(null);

  if (!node) return null;

  const userIntel = [
    { id: 1, user: 'trekker_88', img: 'https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=400', likes: 84 },
    { id: 2, user: 'kathmandu_eyes', img: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400', likes: 120 }
  ];

  const protocols = [
    { id: 'adventure', title: 'Adventure on foot', icon: Mountain, defaultDesc: 'Expert-led trekking modules with localized survival data specific to this node.' },
    { id: 'tradition', title: 'Living traditions', icon: Users, defaultDesc: 'Connect with heritage through neural-mapped cultural immersion protocols.' },
    { id: 'landscape', title: 'Landscape that moves', icon: Wind, defaultDesc: 'Dynamic topographic tracking optimized for shifting regional weather nodes.' },
    { id: 'tours', title: 'Guided Cultural Tours', icon: Camera, defaultDesc: 'Structured sector exploration focusing on historical and Newari lineage markers.' }
  ];

  const mockImages = [
    { id: 1, url: 'https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=600', author: '@trekker_88', likes: 342 },
    { id: 2, url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600', author: '@kathmandu_eyes', likes: 289 },
    { id: 3, url: 'https://images.unsplash.com/photo-1585016495481-91613a3ab1bc?w=600', author: '@himalayan_soul', likes: 412 }
  ];

  const mockGuides = [
    { id: 1, name: 'Pasang Sherpa', experience: '12 Years', rating: 4.9, language: 'English, Nepali, Sherpa' },
    { id: 2, name: 'Anil Gurung', experience: '8 Years', rating: 4.7, language: 'English, Nepali, Hindi' },
    { id: 3, name: 'Sita Tamang', experience: '5 Years', rating: 4.8, language: 'English, Nepali' }
  ];

  return (
    <>
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
            <h2 className="vibrant-title" style={{ fontSize: '4rem', margin: '1rem 0' }}>{node.name || node.title}</h2>
            <p style={{ color: 'var(--terai-harvest)', fontSize: '1.1rem', maxWidth: '700px', lineHeight: '1.6' }}>
              Detailed analysis of coordinate node {node.rank || (node._id ? node._id.substring(node._id.length - 4) : 'XYZ')}. This sector represents the peak of high-altitude exploration in the Nepal system. 
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
                {protocols.map((proto) => {
                  const Icon = proto.icon;
                  const desc = node.experienceProtocols?.[proto.id] || proto.defaultDesc;
                  return (
                    <div 
                      key={proto.id}
                      onClick={() => setActiveProtocol({ id: proto.id, title: proto.title, description: desc, icon: proto.icon })}
                      style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--hill-green)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                    >
                      <Icon size={20} style={{ color: 'var(--hill-green)', marginBottom: '1rem' }} />
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem' }}>{proto.title}</h4>
                      <p style={{ fontSize: '0.75rem', opacity: 0.6, lineHeight: '1.5' }}>
                        {desc.length > 80 ? desc.substring(0, 80) + '...' : desc}
                      </p>
                      <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--hill-green)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontWeight: 'bold' }}>READ MORE</span>
                      </div>
                    </div>
                  );
                })}
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
              <div style={{ width: '100%', height: '300px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ opacity: 0.3, fontSize: '0.7rem', fontFamily: 'monospace' }}>[ RENDER_MAP_UI: PENDING_TECHNICAL_ASSETS ]</p>
              </div>
            </div>
          </div>
        </main>
      </section>

      {/* PROTOCOL MODAL */}
      {activeProtocol && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setActiveProtocol(null)}>
          <div style={{
            background: 'var(--obsidian)', border: '1px solid var(--hill-green)',
            padding: '3rem', maxWidth: '600px', width: '90%', borderRadius: '8px',
            position: 'relative', maxHeight: '90vh', overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setActiveProtocol(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}
            >
              &times;
            </button>
            <activeProtocol.icon size={40} style={{ color: 'var(--hill-green)', marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--hill-green)' }}>{activeProtocol.title}</h2>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--himalayan-mist)' }}>
              {activeProtocol.description}
            </p>

            {['adventure', 'tradition', 'landscape'].includes(activeProtocol.id) && (
              <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--hill-green)', marginBottom: '1rem' }}>Top Rated Visuals</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  {mockImages.map(img => (
                    <div key={img.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={img.url} alt="Location" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{img.author}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--hill-green)' }}>
                          <Heart size={10} fill="var(--hill-green)" />
                          <span style={{ fontSize: '0.7rem' }}>{img.likes}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeProtocol.id === 'tours' && (
              <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--hill-green)', marginBottom: '1rem' }}>Available Culture Guides</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {mockGuides.map(guide => (
                    <div key={guide.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--himalayan-mist)' }}>{guide.name}</h4>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.4rem', color: 'var(--text-muted)' }}>Experience: {guide.experience} • Languages: {guide.language}</p>
                      </div>
                      <div style={{ background: 'var(--hill-green)', color: 'var(--obsidian)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        ★ {guide.rating}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DestinationDetail;