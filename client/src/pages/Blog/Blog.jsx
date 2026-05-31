import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Camera, X, MapPin, Image as ImageIcon, MessageSquare, ShieldAlert, Loader, Tag } from 'lucide-react';
import { compressImage } from '../../utils/imageCompression';
import SearchableSelect from '../../components/Common/SearchableSelect';

const Blog = ({ onSeeBlog }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newLocationId, setNewLocationId] = useState('');
  const [destinations, setDestinations] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [availableHotels, setAvailableHotels] = useState([]);
  const [availableGuides, setAvailableGuides] = useState([]);
  const [taggedHotels, setTaggedHotels] = useState([]);
  const [taggedGuides, setTaggedGuides] = useState([]);
  
  // Loading states
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(true);
  const [isLoadingHotels, setIsLoadingHotels] = useState(true);
  const [isLoadingGuides, setIsLoadingGuides] = useState(true);
  const [openComments, setOpenComments] = useState({}); // { [postId]: { list, loading, text, posting } }

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPosts();
    fetchDestinations();
    fetchHotels();
    fetchGuides();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoadingPosts(true);
      const res = await api.get(`/blogs`);
      setPosts(res.data);
    } catch (e) {
      console.error("Failed to fetch posts", e);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const fetchDestinations = async () => {
    try {
      setIsLoadingDestinations(true);
      const res = await api.get(`/destinations`);
      setDestinations(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to fetch destinations", e);
    } finally {
      setIsLoadingDestinations(false);
    }
  };

  const fetchHotels = async () => {
    try {
      setIsLoadingHotels(true);
      const res = await api.get('/hotels');
      setAvailableHotels(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to fetch hotels", e);
    } finally {
      setIsLoadingHotels(false);
    }
  };

  const fetchGuides = async () => {
    try {
      setIsLoadingGuides(true);
      const res = await api.get('/guides');
      setAvailableGuides(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to fetch guides", e);
    } finally {
      setIsLoadingGuides(false);
    }
  };

  const handleLike = async (id) => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Optimistic toggle
    setPosts(prev => prev.map(p => {
      if (p._id !== id) return p;
      const alreadyLiked = (p.likedBy || []).some(uid => uid === user._id || uid?._id === user._id);
      return {
        ...p,
        likeCount: alreadyLiked ? Math.max(0, (p.likeCount || 1) - 1) : (p.likeCount || 0) + 1,
        likedBy: alreadyLiked
          ? (p.likedBy || []).filter(uid => uid !== user._id && uid?._id !== user._id)
          : [...(p.likedBy || []), user._id],
      };
    }));
    try {
      const { data } = await api.patch(`/blogs/${id}/like`);
      // Reconcile with authoritative server count
      setPosts(prev => prev.map(p => p._id === id ? { ...p, likeCount: data.likeCount } : p));
    } catch (e) {
      // Roll back optimistic update on failure
      setPosts(prev => prev.map(p => {
        if (p._id !== id) return p;
        const wasLiked = !(p.likedBy || []).some(uid => uid === user._id || uid?._id === user._id);
        return {
          ...p,
          likeCount: wasLiked ? Math.max(0, (p.likeCount || 1) - 1) : (p.likeCount || 0) + 1,
          likedBy: wasLiked
            ? (p.likedBy || []).filter(uid => uid !== user._id && uid?._id !== user._id)
            : [...(p.likedBy || []), user._id],
        };
      }));
      if (e.response?.status === 401) navigate('/login');
    }
  };

  const toggleComments = async (postId) => {
    if (openComments[postId]) {
      setOpenComments(prev => { const n = { ...prev }; delete n[postId]; return n; });
      return;
    }
    setOpenComments(prev => ({ ...prev, [postId]: { list: [], loading: true, text: '', posting: false } }));
    try {
      const { data } = await api.get(`/blogs/${postId}/comments`);
      setOpenComments(prev => ({ ...prev, [postId]: { ...prev[postId], list: data, loading: false } }));
    } catch {
      setOpenComments(prev => ({ ...prev, [postId]: { ...prev[postId], loading: false } }));
    }
  };

  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    const text = openComments[postId]?.text?.trim();
    if (!text) return;
    setOpenComments(prev => ({ ...prev, [postId]: { ...prev[postId], posting: true } }));
    try {
      const { data } = await api.post(`/blogs/${postId}/comments`, { text });
      setOpenComments(prev => ({
        ...prev,
        [postId]: { ...prev[postId], list: [...(prev[postId]?.list || []), data], text: '', posting: false }
      }));
    } catch {
      setOpenComments(prev => ({ ...prev, [postId]: { ...prev[postId], posting: false } }));
    }
  };

  const handleCommentDelete = async (postId, commentId) => {
    try {
      await api.delete(`/blogs/${postId}/comments/${commentId}`);
      setOpenComments(prev => ({
        ...prev,
        [postId]: { ...prev[postId], list: prev[postId].list.filter(c => c._id !== commentId) }
      }));
    } catch { /* silent */ }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      
      const compressedFile = await compressImage(file);
      
      setImageFile(compressedFile);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Image compression error:', error);
      alert('Failed to compress image. Please try a different file.');
    } finally {
      setIsCompressing(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewCaption('');
    setNewLocationId('');
    setImageFile(null);
    setImagePreview(null);
    setTaggedHotels([]);
    setTaggedGuides([]);
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePost = async (retryCount = 0) => {
    const maxRetries = 2;

    const wordCount = (newCaption.trim().match(/\S+/g) || []).length;
    if (wordCount > 250) {
      alert(`Caption is ${wordCount} words — please trim it to 250 words or fewer.`);
      return;
    }
    if (!newLocationId) {
      alert("Please select a destination for your journey.");
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      setIsPublishing(true);

      const selectedDest = destinations.find(d => d._id === newLocationId);
      const locationTitle = selectedDest?.name || 'Unknown Destination';

      let base64String = '';
      if (imageFile) {
        base64String = await convertToBase64(imageFile);
      }

      const payload = {
        title: locationTitle,
        content: newCaption.trim(),
        locationId: newLocationId,
        taggedHotels,
        taggedGuides,
        image: base64String,
      };

      const response = await api.post('/blogs', payload, {
        signal: controller.signal,
      });

      await fetchPosts();
      closeModal();
      alert('Your journey has been shared! It will be published after admin review.');
    } catch (err) {
      console.error('Failed to post blog:', err);
      
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') {
        alert('Blog upload timed out. Please check your connection and try again.');
      } else if (err.response?.status === 401) {
        alert('Authentication failed. Please log in again.');
        navigate('/login');
      } else if (err.response?.status === 400) {
        const errorMsg = err.response?.data?.message
          || err.response?.data?.error
          || 'Please check your input and try again.';
        alert(`Validation error: ${errorMsg}`);
      } else if (err.response?.status === 500) {
        if (retryCount < maxRetries) {
          setTimeout(() => handlePost(retryCount + 1), 1000);
          return;
        } else {
          alert('Server error. Please try again later.');
        }
      } else {
        const errorMsg = err.response?.data?.error || err.message || 'An unexpected error occurred.';
        alert(`Failed to share your journey: ${errorMsg}`);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsPublishing(false);
    }
  };

  const getImageUrl = (post) => {
    if (post.image) {
      return post.image;
    }
    if (post.images && post.images.length > 0) {
      return post.images[0];
    }
    return 'https://images.unsplash.com/photo-1582650845100-3057102e3532?w=800';
  };

  // Loading skeleton component for blog posts
  const BlogPostSkeleton = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-teal-steel/30 rounded-2xl border border-white/10 overflow-hidden"
    >
      {/* Header skeleton */}
      <div className="p-5 flex justify-between items-center bg-teal-steel/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-steel animate-pulse"></div>
          <div>
            <div className="h-4 bg-teal-steel rounded w-24 animate-pulse mb-1"></div>
            <div className="h-3 bg-teal-steel rounded w-16 animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Image skeleton */}
      <div className="relative w-full aspect-4/3 sm:aspect-video bg-teal-steel animate-pulse"></div>

      {/* Footer skeleton */}
      <div className="p-5">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-6 h-6 bg-teal-steel rounded animate-pulse"></div>
          <div className="w-6 h-6 bg-teal-steel rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-teal-steel rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-teal-steel rounded w-1/2 animate-pulse"></div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex min-h-[calc(100vh-6rem)] bg-obsidian text-white font-sans">
      {/* LEFT SIDEBAR */}
      <aside className="w-1/4 lg:w-1/5 border-r border-white/10 p-8 flex-col gap-12 bg-obsidian/50 hidden md:flex">
        <div>
          <p className="text-hill-green text-xs font-bold uppercase tracking-wider mb-4">Trending Tags</p>
          <ul className="list-none p-0 text-sm text-terai-harvest">
            <li className="mb-3 cursor-pointer hover:text-white transition-colors">#AnnapurnaCircuit</li>
            <li className="mb-3 cursor-pointer hover:text-white transition-colors">#KathmanduValley</li>
            <li className="mb-3 cursor-pointer hover:text-white transition-colors">#PokharaDiaries</li>
            <li className="mb-3 cursor-pointer hover:text-white transition-colors">#EverestBaseCamp</li>
          </ul>
        </div>

        <div>
          <p className="text-hill-green text-xs font-bold uppercase tracking-wider mb-4">Top Travelers</p>
          <div className="flex flex-col gap-4">
          {isLoadingPosts ? (
            // Show loading skeletons for top travelers
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={`traveler-skeleton-${idx}`} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-steel animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-teal-steel rounded animate-pulse w-20 mb-1"></div>
                  <div className="h-3 bg-teal-steel rounded animate-pulse w-12"></div>
                </div>
              </div>
            ))
          ) : (
            [...posts].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0)).slice(0, 3).map((p, idx) => (
              <div key={`${p._id}-${idx}`} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-steel flex items-center justify-center text-xs font-bold">
                  {p.authorId?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <Link to={p.authorId?._id ? `/profile/${p.authorId._id}` : '#'} className="font-semibold text-sm hover:text-toxic-lime block truncate">
                    {p.authorId?.username || 'Unknown Explorer'}
                  </Link>
                  <p className="text-xs text-terai-harvest">{p.likeCount || 0} Likes</p>
                </div>
              </div>
            ))
          )}
          </div>
        </div>

        <div className="mt-auto pt-8 border-t border-white/10">
          <p className="text-hill-green text-xs font-bold uppercase tracking-wider mb-4">Discover</p>
          <p className="text-xs text-terai-harvest leading-relaxed">
            Share your experiences, connect with fellow travelers, and find inspiration for your next adventure in Nepal.
          </p>
        </div>
      </aside>

      {/* MAIN FEED */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto relative">
        <div className="max-w-175 mx-auto">
          {/* HEADER & CREATE BUTTON */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 pb-6 border-b border-white/10 gap-4">
            <div>
              <h2 className="text-3xl font-black text-himalayan-mist tracking-tight">Traveler Journals</h2>
              <p className="text-terai-harvest text-sm mt-1">Stories from the trails of Nepal</p>
            </div>
            {user ? (
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="bg-hill-green hover:bg-toxic-lime hover:text-obsidian text-white py-2 px-5 rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-hill-green/20"
              >
                <Camera size={16} /> Share Journey
              </button>
            ) : (
              <button 
                onClick={() => navigate('/login')} 
                className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-5 rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-lg"
              >
                <Camera size={16} /> Login to Share
              </button>
            )}
          </div>

          {/* POSTS STREAM */}
          <div className="flex flex-col gap-12">
            {isLoadingPosts ? (
              // Show loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <BlogPostSkeleton key={`skeleton-${index}`} />
              ))
            ) : posts.length > 0 ? (
              posts.map(post => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  key={post._id}
                  onClick={() => onSeeBlog && onSeeBlog(post)}
                  className="bg-teal-steel/30 rounded-2xl border border-white/10 overflow-hidden cursor-pointer hover:border-white/20 transition-all group"
                >
                  {/* POST HEADER */}
                  <div className="p-5 flex justify-between items-center bg-teal-steel/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-hill-green flex items-center justify-center text-white font-bold text-lg shadow-inner">
                        {post.authorId?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <Link to={post.authorId?._id ? `/profile/${post.authorId._id}` : '#'} onClick={(e) => e.stopPropagation()} className="text-sm font-bold text-himalayan-mist hover:text-toxic-lime transition-colors">
                          {post.authorId?.username || 'Unknown Explorer'}
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-terai-harvest mt-0.5">
                          <MapPin size={10} className="text-hill-green" />
                          {post.locationNode || post.title || 'Nepal'}
                        </div>
                      </div>
                    </div>
                    {post.status === 'flagged' && <ShieldAlert size={18} className="text-red-400" title="Flagged Content" />}
                  </div>
                  
                  {/* POST IMAGE */}
                  <div className="relative w-full aspect-4/3 sm:aspect-video overflow-hidden bg-black/50">
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
                        className="flex items-center gap-1.5 text-himalayan-mist hover:text-toxic-lime transition-colors"
                      >
                        <Heart size={22} className={
                          user && (post.likedBy || []).some(uid => uid === user._id || uid?._id === user._id)
                            ? "fill-red-500 text-red-500"
                            : ""
                        } />
                        <span className="font-semibold text-sm">{post.likeCount || 0}</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleComments(post._id); }}
                        className={`flex items-center gap-1.5 transition-colors ${openComments[post._id] ? 'text-hill-green' : 'text-himalayan-mist hover:text-hill-green'}`}
                      >
                        <MessageSquare size={20} />
                        <span className="text-sm font-semibold">{(openComments[post._id]?.list || []).length || ''}</span>
                      </button>
                    </div>

                    <p className="text-sm text-himalayan-mist leading-relaxed">
                      <Link to={post.authorId?._id ? `/profile/${post.authorId._id}` : '#'} onClick={(e) => e.stopPropagation()} className="font-bold mr-2 hover:underline">
                        {post.authorId?.username || 'Unknown'}
                      </Link>
                      <span className="opacity-90">{post.content}</span>
                    </p>

                    {/* Tagged Items */}
                    {(post.taggedHotels?.length > 0 || post.taggedGuides?.length > 0) && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {post.taggedHotels?.map((hotel, idx) => (
                          <span key={`hotel-${idx}`} className="inline-flex items-center gap-1 bg-hill-green/20 text-toxic-lime text-xs px-2 py-1 rounded-full">
                            <Tag size={10} />
                            {hotel.name || 'Hotel'}
                          </span>
                        ))}
                        {post.taggedGuides?.map((guide, idx) => (
                          <span key={`guide-${idx}`} className="inline-flex items-center gap-1 bg-hill-green/20 text-toxic-lime text-xs px-2 py-1 rounded-full">
                            <Tag size={10} />
                            {guide.guideName || 'Guide'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* COMMENTS SECTION */}
                  {openComments[post._id] && (
                    <div className="border-t border-hill-green/10 px-5 pb-4 bg-obsidian/60" onClick={e => e.stopPropagation()}>
                      {/* Comment list */}
                      <div className="py-3 space-y-3 max-h-52 overflow-y-auto">
                        {openComments[post._id].loading ? (
                          <p className="text-xs text-terai-harvest text-center py-2">Loading...</p>
                        ) : openComments[post._id].list.length === 0 ? (
                          <p className="text-xs text-terai-harvest text-center py-2">No comments yet — be the first!</p>
                        ) : openComments[post._id].list.map(c => (
                          <div key={c._id} className="flex items-start gap-2 group">
                            <div className="w-6 h-6 rounded-full bg-hill-green/40 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                              {c.authorId?.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-himalayan-mist mr-2">{c.authorId?.username || 'User'}</span>
                              <span className="text-xs text-himalayan-mist/80 break-words">{c.text}</span>
                            </div>
                            {(user && (user._id === c.authorId?._id || user.role === 'admin')) && (
                              <button
                                onClick={() => handleCommentDelete(post._id, c._id)}
                                className="text-red-400/40 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              >✕</button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add comment input */}
                      <form onSubmit={e => handleCommentSubmit(e, post._id)} className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={openComments[post._id]?.text || ''}
                          onChange={e => setOpenComments(prev => ({ ...prev, [post._id]: { ...prev[post._id], text: e.target.value } }))}
                          placeholder={user ? "Add a comment..." : "Sign in to comment"}
                          disabled={!user || openComments[post._id]?.posting}
                          maxLength={500}
                          className="flex-1 bg-teal-steel/30 border border-hill-green/20 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-hill-green disabled:opacity-50"
                        />
                        <button
                          type="submit"
                          disabled={!user || !openComments[post._id]?.text?.trim() || openComments[post._id]?.posting}
                          className="bg-hill-green hover:bg-[#047D57] disabled:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {openComments[post._id]?.posting ? '...' : 'Post'}
                        </button>
                      </form>
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 text-terai-harvest">
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
        {isModalOpen && user && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-obsidian/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={closeModal}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-teal-steel border border-white/10 p-6 sm:p-8 rounded-2xl w-full max-w-lg relative shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={closeModal} 
                className="absolute top-4 right-4 text-white/50 hover:text-white bg-black/20 rounded-full p-1 transition-colors"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-2xl font-bold mb-6 text-himalayan-mist">Share Your Journey</h3>
              
              {/* Image Upload Area */}
              <div 
                className="border-2 border-dashed border-hill-green/50 bg-black/20 rounded-xl h-48 sm:h-56 mb-6 flex flex-col items-center justify-center cursor-pointer hover:border-toxic-lime hover:bg-black/30 transition-all overflow-hidden relative group"
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
                    <div className="bg-hill-green/20 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                      <ImageIcon size={32} className="text-hill-green" />
                    </div>
                    <p className="text-sm text-white/70 font-medium">Click to upload a photo</p>
                    <p className="text-xs text-white/40 mt-1">JPG, PNG up to 5MB</p>
                  </>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} disabled={isCompressing} />

              <div className="flex flex-col gap-4">
                 {/* Destination Selection */}
                 <div className="flex items-center bg-black/20 rounded-xl p-3 border border-white/5 focus-within:border-hill-green focus-within:bg-black/30 transition-all">
                    <MapPin size={18} className="text-hill-green mr-3 shrink-0" />
                    <select 
                      value={newLocationId} 
                      onChange={(e) => setNewLocationId(e.target.value)}
                      disabled={isLoadingDestinations}
                      className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-white/40 disabled:opacity-50"
                    >
                      <option value="" style={{ background: '#0D0A02', color: '#888' }}>
                        {isLoadingDestinations ? 'Loading destinations...' : 'Select a destination...'}
                      </option>
                      {destinations.map(dest => (
                        <option key={dest._id} value={dest._id} style={{ background: '#0D0A02' }}>
                          {dest.name} • {dest.region}
                        </option>
                      ))}
                    </select>
                    {isLoadingDestinations && <Loader size={16} className="animate-spin ml-2" />}
                 </div>

                 {/* Caption */}
                 {(() => {
                   const captionWordCount = (newCaption.trim().match(/\S+/g) || []).length;
                   const overLimit = captionWordCount > 250;
                   return (
                     <div className="relative flex items-start bg-black/20 rounded-xl p-3 border border-white/5 focus-within:border-hill-green focus-within:bg-black/30 transition-all">
                       <MessageSquare size={18} className="text-hill-green mr-3 mt-1" />
                       <textarea
                         placeholder="Write a caption about your experience..."
                         className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-white/40 resize-none min-h-25 pb-6"
                         value={newCaption}
                         onChange={(e) => setNewCaption(e.target.value)}
                       />
                       <span
                         className={`absolute bottom-2 right-3 text-xs ${overLimit ? 'text-red-400' : 'text-white/40'}`}
                       >
                         {captionWordCount} 0 / 250 words
                       </span>
                     </div>
                   );
                 })()}

                 {/* Tagging Section */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                     <label className="text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
                       <Tag size={16} className="text-hill-green" />
                       Tag Hotels
                     </label>
                     <SearchableSelect
                       options={availableHotels}
                       value={taggedHotels}
                       onChange={setTaggedHotels}
                       placeholder="Search hotels..."
                       displayKey="name"
                       valueKey="_id"
                       loading={isLoadingHotels}
                       renderOption={(hotel) => (
                         <span className="text-white text-sm">
                           {hotel.name}
                           {hotel.userId && (
                             <span className="text-white/60 ml-2">({hotel.userId.username})</span>
                           )}
                         </span>
                       )}
                     />
                   </div>
                   <div>
                     <label className="text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
                       <Tag size={16} className="text-hill-green" />
                       Tag Guides
                     </label>
                     <SearchableSelect
                       options={availableGuides}
                       value={taggedGuides}
                       onChange={setTaggedGuides}
                       placeholder="Search guides..."
                       displayKey="guideName"
                       valueKey="_id"
                       loading={isLoadingGuides}
                       renderOption={(guide) => (
                         <span className="text-white text-sm">
                           {guide.guideName}
                           {guide.userId && (
                             <span className="text-white/60 ml-2">({guide.userId.username})</span>
                           )}
                         </span>
                       )}
                     />
                   </div>
                 </div>

                 <button 
                  onClick={handlePost}
                  disabled={isPublishing || isCompressing}
                  className="w-full mt-4 bg-hill-green hover:bg-toxic-lime hover:text-obsidian disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-hill-green/20 flex items-center justify-center gap-2"
                 >
                   {isCompressing ? <><Loader size={16} className="animate-spin" /> Compressing...</> : isPublishing ? 'Publishing...' : 'Publish Post'}
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