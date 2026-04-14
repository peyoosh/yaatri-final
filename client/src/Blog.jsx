import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Heart, Camera, ShieldAlert } from 'lucide-react';

const Blog = ({ onSeeBlog }) => {
  const [posts, setPosts] = useState([]);
  const [newCaption, setNewCaption] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || "https://yaatri-backend.onrender.com";

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/posts`).then(res => setPosts(res.data));
  }, []);

  const handleLike = async (id) => {
    await axios.patch(`${API_BASE_URL}/api/posts/${id}/like`);
    setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  };

  const handlePost = async () => {
    if (!newCaption) return;
    const postData = {
      user: 'LOCAL_NODE',
      location: newLocation || 'UNKNOWN_COORDINATES',
      image: 'https://images.unsplash.com/photo-1582650845100-3057102e3532?w=800',
      likes: 0,
      caption: newCaption,
    };
    const res = await axios.post(`${API_BASE_URL}/api/posts`, postData);
    setPosts([res.data, ...posts]);
    setNewCaption('');
    setNewLocation('');
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 6rem)', background: 'var(--obsidian)' }}>
      {/* LEFT SIDEBAR: 20% - DATA ANALYSIS */}
      <aside className="blog-sidebar" style={{ width: '20%', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '2rem 1.5%', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <div className="sidebar-section">
          <p className="sidebar-kicker" style={{ color: 'var(--hill-green)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '2px', marginBottom: '1rem' }}>TRENDING_NODES</p>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.8rem', opacity: 0.7 }}>
            <li style={{ marginBottom: '0.8rem', cursor: 'pointer' }} className="hover:text-[var(--hill-green)] transition-colors">#KHUMBU_ASCENT</li>
            <li style={{ marginBottom: '0.8rem', cursor: 'pointer' }} className="hover:text-[var(--hill-green)] transition-colors">#MUSTANG_TRAILS</li>
            <li style={{ marginBottom: '0.8rem', cursor: 'pointer' }} className="hover:text-[var(--hill-green)] transition-colors">#LALITPUR_HISTORY</li>
          </ul>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-kicker" style={{ color: 'var(--hill-green)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '2px', marginBottom: '1rem' }}>MOST_LIKED_DATA</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[...posts].sort((a, b) => b.likes - a.likes).slice(0, 2).map(p => (
              <div key={p.id} style={{ fontSize: '0.75rem', borderLeft: '1px solid var(--hill-green)', paddingLeft: '10px' }}>
                <p style={{ fontWeight: 700 }}>{p.user.toUpperCase()}</p>
                <p style={{ opacity: 0.5 }}>{p.likes} DATA_POINTS</p>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-kicker" style={{ color: 'var(--hill-green)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '2px', marginBottom: '1rem' }}>REGIONAL_BROADCASTS</p>
          <p style={{ fontSize: '0.7rem', opacity: 0.4, fontStyle: 'italic' }}>Detecting nodes in your current sector...</p>
          <div style={{ marginTop: '1rem', padding: '10px', background: 'rgba(5, 157, 114, 0.05)', border: '1px solid rgba(5, 157, 114, 0.1)', borderRadius: '2px' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700 }}>RECENT: LALITPUR_HUB</p>
            <p style={{ fontSize: '0.65rem', opacity: 0.6 }}>2 active streams in last 10m</p>
          </div>
        </div>
      </aside>

      {/* MAIN FEED: 80% */}
      <main style={{ flex: 1, padding: '4rem 2rem', overflowY: 'auto', maxHeight: 'calc(100vh - 6rem)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '4px', color: 'var(--hill-green)' }}>SYSTEM_BLOG</h2>
        <p style={{ fontSize: '0.7rem', opacity: 0.5, fontFamily: 'monospace' }}>DATA_STREAM: ENCRYPTED // SOURCE: USER_NODES</p>
      </div>

      {/* BROADCAST INPUT */}
      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Camera size={20} style={{ color: 'var(--hill-green)' }} />
            <input 
              type="text" 
              placeholder="LOCATION_OF_EXPEDITION..." 
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem', outline: 'none', fontSize: '0.85rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="INITIATE_CAPTION_SCAN..." 
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem', outline: 'none', fontSize: '0.85rem' }}
            />
          </div>
          <div style={{ textAlign: 'right', marginTop: '1rem' }}>
            <button onClick={handlePost} className="btn-primary-white" style={{ padding: '0.5rem 1rem', fontSize: '0.6rem' }}>SEND_BROADCAST</button>
          </div>
        </div>
      </div>

      {/* INTEL STREAM */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
        {posts.map(post => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={post.id}
            onClick={() => onSeeBlog(post)}
            style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', marginBottom: '4rem', cursor: 'pointer' }}
          >
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--hill-green)' }} />
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', margin: 0 }}>{post.user.toUpperCase()}</p>
                  <p style={{ fontSize: '0.65rem', opacity: 0.6, margin: 0, color: 'var(--terai-harvest)' }}>{post.location}</p>
                </div>
              </div>
              {post.status === 'Flagged' && <ShieldAlert size={16} style={{ color: 'orange' }} />}
            </div>
            
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', overflow: 'hidden' }}>
              <img src={post.image} alt="Intel" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(20%)' }} />
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                <Heart 
                  size={24}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(post.id);
                  }}
                  style={{ cursor: 'pointer', color: 'var(--hill-green)', transition: 'transform 0.2s' }} 
                  className="hover:scale-110"
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--hill-green)', marginBottom: '0.5rem' }}>{post.likes} DATA_POINTS</p>
                <span style={{ fontSize: '0.6rem', opacity: 0.3, fontFamily: 'monospace' }}>NODE_ID: {post.id}</span>
              </div>

              <p style={{ fontSize: '0.85rem', lineHeight: '1.5', opacity: 0.8 }}>
                <span style={{ fontWeight: 900, marginRight: '0.5rem', color: 'var(--himalayan-mist)' }}>{post.user}</span>
                {post.caption}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
        </div>
      </main>
    </div>
  );
};

export default Blog;