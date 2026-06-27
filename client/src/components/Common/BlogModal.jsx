import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MapPin, Calendar } from 'lucide-react';

const BlogModal = ({ isOpen, onClose, post }) => {
  const [imageZoomed, setImageZoomed] = React.useState(false);
  if (!post) return null;

  const heroImage = post.image || (Array.isArray(post.images) && post.images[0]) || null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[88vh] overflow-y-auto relative border border-slate-100 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Hero image */}
            {heroImage && (
              <div
                className="relative w-full aspect-video overflow-hidden rounded-t-3xl cursor-zoom-in bg-slate-100"
                onClick={() => setImageZoomed(true)}
                title="Click to enlarge"
              >
                <img
                  src={heroImage}
                  alt={post.title || 'Journal image'}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-6 sm:p-8">
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">
                <span className="flex items-center gap-1">
                  <Link
                    to={post.authorId?._id ? `/profile/${post.authorId._id}` : '#'}
                    onClick={e => { e.stopPropagation(); onClose(); }}
                    className="text-brand-blue hover:underline"
                  >
                    @{post.authorId?.username || 'UNKNOWN'}
                  </Link>
                </span>
                {post.timestamp && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                )}
                {post.locationId?.region && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-brand-pink" />
                    {post.locationId.region}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  post.status === 'published'
                    ? 'bg-brand-green/10 text-brand-green border border-brand-green/20'
                    : 'bg-brand-saffron/10 text-brand-saffron border border-brand-saffron/20'
                }`}>
                  {(post.status || 'published').toUpperCase()}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-brand-slate mb-4 leading-tight">
                {post.title}
              </h2>

              {/* Like count */}
              {post.likeCount > 0 && (
                <div className="flex items-center gap-1.5 text-brand-pink text-xs font-bold mb-5">
                  <Heart className="w-4 h-4 fill-brand-pink" />
                  {post.likeCount} likes
                </div>
              )}

              {/* Body */}
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                {post.content || <span className="text-gray-400 italic">No caption provided.</span>}
              </div>

              {/* Tags */}
              {(post.taggedHotels?.length > 0 || post.taggedGuides?.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-100">
                  {(post.taggedHotels || []).map((h, i) => (
                    <span key={i} className="px-2.5 py-1 bg-brand-green/10 text-brand-green text-[10px] font-bold rounded-full">
                      🏠 {h.name || h}
                    </span>
                  ))}
                  {(post.taggedGuides || []).map((g, i) => (
                    <span key={i} className="px-2.5 py-1 bg-brand-blue/10 text-brand-blue text-[10px] font-bold rounded-full">
                      👤 {g.guideName || g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Full-screen image lightbox */}
          <AnimatePresence>
            {imageZoomed && heroImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={e => { e.stopPropagation(); setImageZoomed(false); }}
                className="fixed inset-0 bg-black/95 z-[3000] flex items-center justify-center cursor-zoom-out p-6"
              >
                <button
                  onClick={e => { e.stopPropagation(); setImageZoomed(false); }}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <motion.img
                  src={heroImage}
                  alt={post.title || 'Journal image'}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="max-w-full max-h-[90vh] object-contain rounded-xl"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BlogModal;
