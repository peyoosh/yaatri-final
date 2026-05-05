import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Camera, X, MapPin, Image as ImageIcon, MessageSquare, ShieldAlert } from 'lucide-react';

const Blog = ({ onSeeBlog }) => {
  const [posts, setPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get(`/blogs`);
      setPosts(res.data);
    } catch (e) {
      console.error("Failed to fetch posts", e);
    }
  };

  const handleLike = async (id) => {
    try {
      await api.patch(`/blogs/${id}/like`);
    } catch (e) { 
      console.warn("Liking requires backend support", e); 
    }
    setPosts(posts.map(p => p._id === id ? { ...p, likes: (p.likeCount || 0) + 1 } : p));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewCaption('');
    setNewLocation('');
    setImageFile(null);
    setImagePreview(null);
  };

  const handlePost = async () => {
    if (!newCaption) {
      alert("Please enter a caption.");
      return;
    }
    
    const formData = new FormData();
    formData.append('title', newLocation || 'Unknown Journey');
    formData.append('content', newCaption);
    formData.append('locationNode', newLocation || 'Nepal');
    
    if (imageFile) {
      formData.append('image', imageFile);
    } else {
      formData.append('images', JSON.stringify(['https://images.unsplash.com/photo-1582650845100-3057102e3532?w=800']));
    }

    try {
      await api.post(`/blogs`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchPosts();
      closeModal();
    } catch (err) {
      console.error("Failed to post:", err);
      if (err.response?.status === 401) {
        alert("Unauthorized: Please log in to post.");
      } else {
        alert("Failed to create post. Please try again.");
      }
    }
  };

  const getImageUrl = (post) => {
    if (post.image) {
      const baseUrl = api.defaults.baseURL.replace(/\/api$/, '');
      return `${baseUrl}${post.image}`;
    }
    if (post.images && post.images.length > 0) {
      return post.images[0];
    }
    return 'https://images.unsplash.com/photo-1582650845100-3057102e3532?w=800';
  };

  return (
    <div className="flex min-h-[calc(100vh-6rem)] bg-obsidian text-white font-sans">
      {/* LEFT SIDEBAR */}
      <aside className="w-1/4 lg:w-1/5 border-r border-white/10 p-8 flex flex-col gap-12 bg-obsidian/50 hidden md:flex">
        <div>
          <p className="text-[#059D72] text-xs font-bold uppercase tracking-wider mb-4">Trending Tags</p>
          <ul className="list-none p-0 text-sm text-[#A6A180]">
            <li className="mb-3 cursor-pointer hover:text-white transition-colors">#AnnapurnaCircuit</li>
            <li className="mb-3 cursor-pointer hover:text-white transition-colors">#KathmanduValley</li>
            <li className="mb-3 cursor-pointer hover:text-white transition-colors">#PokharaDiaries</li>
            <li className="mb-3 cursor-pointer hover:text-white transition-colors">#EverestBaseCamp</li>
          </ul>
        </div>

        <div>
          <p className="text-[#059D72] text-xs font-bold uppercase tracking-wider mb-4">Top Travelers</p>
          <div className="flex flex-col gap-4">
          {[...posts].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0)).slice(0, 3).map((p, idx) => (
            <div key={`${p._id}-${idx}`} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1A434E] flex items-center justify-center text-xs font-bold">
                {p.authorId?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <Link to={p.authorId?._id ? `/profile/${p.authorId._id}` : '#'} className="font-semibold text-sm hover:text-[#A2D729] block truncate">
                  {p.authorId?.username || 'Unknown Explorer'}
                </Link>
                <p className="text-xs text-[#A6A180]">{p.likeCount || 0} Likes</p>
              </div>
            </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-8 border-t border-white/10">
          <p className="text-[#059D72] text-xs font-bold uppercase tracking-wider mb-4">Discover</p>
          <p className="text-xs text-[#A6A180] leading-relaxed">
            Share your experiences, connect with fellow travelers, and find inspiration for your next adventure in Nepal.
          </p>
        </div>
      </aside>

      {/* MAIN FEED */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto relative">
        <div className="max-w-[700px] mx-auto">
          {/* HEADER & CREATE BUTTON */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 pb-6 border-b border-white/10 gap-4">
            <div>
              <h2 className="text-3xl font-black text-[#F4F2F3] tracking-tight">Traveler Journals</h2>
              <p className="text-[#A6A180] text-sm mt-1">Stories from the trails of Nepal</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="bg-[#059D72] hover:bg-[#A2D729] hover:text-[#0D0A02] text-white py-2 px-5 rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[#059D72]/20"
            >
              <Camera size={16} /> Share Journey
            </button>
          </div>

          {/* POSTS STREAM */}
          <div className="flex flex-col gap-12">
            {posts.map(post => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                key={post._id}
                onClick={() => onSeeBlog && onSeeBlog(post)}
                className="bg-[#1A434E]/30 rounded-2xl border border-white/10 overflow-hidden cursor-pointer hover:border-white/20 transition-all group"
              >
                {/* POST HEADER */}
                <div className="p-5 flex justify-between items-center bg-[#1A434E]/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#059D72] flex items-center justify-center text-white font-bold text-lg shadow-inner">
                      {post.authorId?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <Link to={post.authorId?._id ? `/profile/${post.authorId._id}` : '#'} onClick={(e) => e.stopPropagation()} className="text-sm font-bold text-[#F4F2F3] hover:text-[#A2D729] transition-colors">
                        {post.authorId?.username || 'Unknown Explorer'}
                      </Link>
                      <div className="flex items-center gap-1 text-xs text-[#A6A180] mt-0.5">
                        <MapPin size={10} className="text-[#059D72]" />
                        {post.locationNode || post.title || 'Nepal'}
                      </div>
                    </div>
                  </div>
                  {post.status === 'flagged' && <ShieldAlert size={18} className="text-red-400" title="Flagged Content" />}
                </div>
                
                {/* POST IMAGE */}
                <div className="relative w-full aspect-[4/3] sm:aspect-video overflow-hidden bg-black/50">
                  <img 
                    src={getImageUrl(post)} 
                    alt="Travel" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    loading="lazy"
                  />
                </div>

                {/* POST FOOTER/ACTIONS */}
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(post._id);
                      }}
                      className="flex items-center gap-1.5 text-[#F4F2F3] hover:text-[#A2D729] transition-colors"
                    >
                      <Heart size={22} className={post.likeCount > 0 ? "fill-red-500 text-red-500" : ""} />
                      <span className="font-semibold text-sm">{post.likeCount || 0}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-[#F4F2F3] hover:text-[#059D72] transition-colors">
                      <MessageSquare size={20} />
                    </button>
                  </div>

                  <p className="text-sm text-[#F4F2F3] leading-relaxed">
                    <Link to={post.authorId?._id ? `/profile/${post.authorId._id}` : '#'} onClick={(e) => e.stopPropagation()} className="font-bold mr-2 hover:underline">
                      {post.authorId?.username || 'Unknown'}
                    </Link>
                    <span className="opacity-90">{post.content}</span>
                  </p>
                </div>
              </motion.div>
            ))}
            
            {posts.length === 0 && (
              <div className="text-center py-20 text-[#A6A180]">
                <Camera size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-semibold">No journeys shared yet.</p>
                <p className="text-sm">Be the first to share your adventure!</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* CREATE POST MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0D0A02]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={closeModal}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#1A434E] border border-white/10 p-6 sm:p-8 rounded-2xl w-full max-w-lg relative shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={closeModal} 
                className="absolute top-4 right-4 text-white/50 hover:text-white bg-black/20 rounded-full p-1 transition-colors"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-2xl font-bold mb-6 text-[#F4F2F3]">Share Your Journey</h3>
              
              {/* Image Upload Area */}
              <div 
                className="border-2 border-dashed border-[#059D72]/50 bg-black/20 rounded-xl h-48 sm:h-56 mb-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#A2D729] hover:bg-black/30 transition-all overflow-hidden relative group"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white font-semibold flex items-center gap-2"><Camera size={18} /> Change Photo</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-[#059D72]/20 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                      <ImageIcon size={32} className="text-[#059D72]" />
                    </div>
                    <p className="text-sm text-white/70 font-medium">Click to upload a photo</p>
                    <p className="text-xs text-white/40 mt-1">JPG, PNG up to 5MB</p>
                  </>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />

              <div className="flex flex-col gap-4">
                 {/* Location */}
                 <div className="flex items-center bg-black/20 rounded-xl p-3 border border-white/5 focus-within:border-[#059D72] focus-within:bg-black/30 transition-all">
                    <MapPin size={18} className="text-[#059D72] mr-3" />
                    <input 
                      type="text" 
                      placeholder="Where was this taken? (e.g. Pokhara, Nepal)" 
                      className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-white/40" 
                      value={newLocation} 
                      onChange={(e) => setNewLocation(e.target.value)} 
                    />
                 </div>

                 {/* Caption */}
                 <div className="flex items-start bg-black/20 rounded-xl p-3 border border-white/5 focus-within:border-[#059D72] focus-within:bg-black/30 transition-all">
                    <MessageSquare size={18} className="text-[#059D72] mr-3 mt-1" />
                    <textarea 
                      placeholder="Write a caption about your experience..." 
                      className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-white/40 resize-none min-h-[100px]" 
                      value={newCaption} 
                      onChange={(e) => setNewCaption(e.target.value)} 
                    />
                 </div>

                 <button 
                  onClick={handlePost} 
                  className="w-full mt-4 bg-[#059D72] hover:bg-[#A2D729] hover:text-[#0D0A02] text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-[#059D72]/20 flex items-center justify-center gap-2"
                 >
                   Publish Post
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Blog;