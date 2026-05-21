import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const BlogModal = ({ isOpen, onClose, post }) => {
  const [imageZoomed, setImageZoomed] = React.useState(false);
  if (!post) return null;

  // Pick the best available image: base64/url on `image`, or first of legacy `images[]`.
  const heroImage = post.image || (Array.isArray(post.images) && post.images[0]) || null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 2000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '2rem'
        }} onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
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
                background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white',
                cursor: 'pointer', fontSize: '1.5rem', fontWeight: 'bold',
                width: '36px', height: '36px', borderRadius: '50%', zIndex: 2
              }}
            >
              &times;
            </button>

            {heroImage && (
              <div
                onClick={() => setImageZoomed(true)}
                style={{
                  width: '100%', marginBottom: '2rem', cursor: 'zoom-in',
                  borderRadius: '6px', overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
                title="Click to enlarge"
              >
                <img
                  src={heroImage}
                  alt={post.title || 'Blog image'}
                  style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', display: 'block' }}
                />
              </div>
            )}

            <h2 style={{ color: 'var(--hill-green)', fontSize: '2rem', marginBottom: '0.5rem' }}>
              {post.title}
            </h2>
            <div style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '2rem', display: 'flex', gap: '1rem', fontFamily: 'monospace', flexWrap: 'wrap' }}>
              <span>AUTHOR: <Link to={post.authorId?._id ? `/profile/${post.authorId._id}` : '#'} onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ color: '#A2D729', textDecoration: 'underline' }}>@{post.authorId?.username || 'UNKNOWN'}</Link></span>
              <span>DATE: {new Date(post.timestamp).toLocaleDateString()}</span>
              <span>STATUS: [{post.status?.toUpperCase() || 'PUBLISHED'}]</span>
              {post.locationId?.region && <span>REGION: {post.locationId.region}</span>}
            </div>

            <div style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap', opacity: 0.9 }}>
              {post.content}
            </div>
          </motion.div>

          {/* Image lightbox — pops the image out full-screen when clicked */}
          {imageZoomed && heroImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => { e.stopPropagation(); setImageZoomed(false); }}
              style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.95)', zIndex: 3000,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'zoom-out', padding: '2rem'
              }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setImageZoomed(false); }}
                style={{
                  position: 'absolute', top: '1.5rem', right: '1.5rem',
                  background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                  cursor: 'pointer', fontSize: '1.75rem', width: '44px', height: '44px',
                  borderRadius: '50%'
                }}
              >&times;</button>
              <motion.img
                src={heroImage}
                alt={post.title || 'Blog image'}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                style={{ maxWidth: '95%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '4px' }}
              />
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};

export default BlogModal;