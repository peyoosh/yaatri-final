import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BlogModal = ({ isOpen, onClose, post }) => {
  if (!post) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 2000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '2rem'
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              backgroundColor: 'var(--obsidian)',
              border: '1px solid var(--hill-green)',
              borderRadius: '8px',
              width: '100%', maxWidth: '800px', maxHeight: '85vh',
              overflowY: 'auto', padding: '2.5rem', position: 'relative'
            }}
          >
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: '1.5rem', right: '1.5rem',
                background: 'none', border: 'none', color: 'white',
                cursor: 'pointer', fontSize: '1.5rem', fontWeight: 'bold'
              }}
            >
              &times;
            </button>

            <h2 style={{ color: 'var(--hill-green)', fontSize: '2rem', marginBottom: '0.5rem' }}>
              {post.title}
            </h2>
            <div style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '2rem', display: 'flex', gap: '1rem', fontFamily: 'monospace' }}>
              <span>AUTHOR: @{post.authorId?.username || 'UNKNOWN'}</span>
              <span>DATE: {new Date(post.timestamp).toLocaleDateString()}</span>
              <span>STATUS: [{post.status?.toUpperCase() || 'PUBLISHED'}]</span>
            </div>

            <div style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap', opacity: 0.9 }}>
              {post.content}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BlogModal;