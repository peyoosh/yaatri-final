import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Heart, MessageSquare, User, ShieldCheck } from 'lucide-react';

const BlogModal = ({ isOpen, onClose, post }) => {
  if (!isOpen || !post) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 3000,
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* MODAL WINDOW */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        style={{
          width: '80%',
          height: '85vh',
          background: 'var(--obsidian)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 0 50px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}
      >
        {/* TOP CONTROL BAR */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--hill-green)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontWeight: '900',
              fontSize: '0.75rem',
              letterSpacing: '2px'
            }}
          >
            <ChevronLeft size={18} /> RETURN_TO_NODE
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 900, margin: 0 }}>@{post.authorId?.username?.toUpperCase() || 'UNKNOWN'}</p>
              <p style={{ fontSize: '0.6rem', color: 'var(--hill-green)', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                <ShieldCheck size={10} /> AUTHENTICATED_EXPLORER
              </p>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--hill-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color="white" />
            </div>
          </div>
        </div>

        {/* MAIN BODY: 2-COLUMN VIEW */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* LEFT: MEDIA CONTENT (70%) */}
          <div style={{ flex: '0 0 70%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <img 
              src={post.images?.[0] || post.img || post.image || 'https://images.unsplash.com/photo-1582650845100-3057102e3532?w=800'} 
              alt="Broadcast Content" 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
            />
          </div>

          {/* RIGHT: DETAILS & COMMENTS (30%) */}
          <div style={{ flex: '0 0 30%', borderLeft: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
              <h3 style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: 'var(--terai-harvest)', marginBottom: '1.5rem' }}>INTEL_LOG</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.6', opacity: 0.8, marginBottom: '3rem', whiteSpace: 'pre-wrap' }}>
                {post.content || post.caption || "System-generated summary: User broadcast captured during regional expedition. Topographic analysis suggests optimal route markers."}
              </p>

              <h3 style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: 'var(--terai-harvest)', marginBottom: '1.5rem' }}>DATA_FEEDBACK</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', borderLeft: '1px solid var(--hill-green)', paddingLeft: '1rem' }}>
                  <span style={{ fontWeight: 900, color: 'var(--hill-green)' }}>@trek_bot:</span> Analysis nodes aligned. Great shot.
                </div>
                <div style={{ fontSize: '0.8rem', borderLeft: '1px solid var(--hill-green)', paddingLeft: '1rem' }}>
                  <span style={{ fontWeight: 900, color: 'var(--hill-green)' }}>@lalitpur_studio:</span> Protocol verified.
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BlogModal;