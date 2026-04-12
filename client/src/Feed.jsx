import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Share2, Camera, ShieldAlert } from 'lucide-react';

const Feed = () => {
  const [posts, setPosts] = useState([
    { id: 1, user: 'yaatri_nepal', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800', likes: 42, caption: 'Topographic scan of the Khumbu sector complete.', status: 'Active' },
    { id: 2, user: 'himalayan_vibe', image: 'https://images.unsplash.com/photo-1582234131908-769502909282?w=800', likes: 128, caption: 'Neural mapping of Newari cultural protocols.', status: 'Active' }
  ]);
  const [newCaption, setNewCaption] = useState('');

  const handleLike = (id) => {
    setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  };

  const handlePost = () => {
    if (!newCaption) return;
    const post = {
      id: Date.now(),
      user: 'LOCAL_NODE',
      image: 'https://images.unsplash.com/photo-1582650845100-3057102e3532?w=800',
      likes: 0,
      caption: newCaption,
      status: 'Active'
    };
    setPosts([post, ...posts]);
    setNewCaption('');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 1rem' }}>
      <div style={{ marginBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '4px', color: 'var(--hill-green)' }}>SYSTEM_FEED</h2>
        <p style={{ fontSize: '0.7rem', opacity: 0.5, fontFamily: 'monospace' }}>DATA_STREAM: ENCRYPTED // SOURCE: USER_NODES</p>
      </div>

      {/* BROADCAST INPUT */}
      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Camera size={20} style={{ color: 'var(--hill-green)' }} />
          <input 
            type="text" 
            placeholder="INITIATE_BROADCAST..." 
            value={newCaption}
            onChange={(e) => setNewCaption(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem', outline: 'none', fontSize: '0.85rem' }}
          />
          <button onClick={handlePost} className="btn-primary-white" style={{ padding: '0.5rem 1rem', fontSize: '0.6rem' }}>SEND</button>
        </div>
      </div>

      {/* INTEL STREAM */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
        {posts.map(post => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={post.id} 
            style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}
          >
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--hill-green)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px' }}>{post.user.toUpperCase()}</span>
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
                  onClick={() => handleLike(post.id)}
                  style={{ cursor: 'pointer', color: 'var(--hill-green)', transition: 'transform 0.2s' }} 
                  className="hover:scale-110"
                />
                <Share2 size={24} style={{ opacity: 0.3 }} />
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
  );
};

export default Feed;