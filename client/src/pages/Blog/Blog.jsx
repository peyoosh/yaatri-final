import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageSquare, Trash2, Camera, MapPin, X, Send, Plus, Award, Tag, Loader,
} from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { compressImage } from '../../utils/imageCompression';
import SearchableSelect from '../../components/Common/SearchableSelect';

export default function Blog({ onSeeBlog }) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef(null);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [destinations, setDestinations] = useState([]);
  const [guides, setGuides] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [openComments, setOpenComments] = useState({});

  // Create form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [locationId, setLocationId] = useState('');
  const [taggedHotels, setTaggedHotels] = useState([]);
  const [taggedGuides, setTaggedGuides] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      api.get('/blogs'),
      api.get('/destinations'),
      api.get('/guides'),
      api.get('/hotels'),
    ]).then(([b, d, g, h]) => {
      if (b.status === 'fulfilled') setPosts(b.value.data || []);
      if (d.status === 'fulfilled') setDestinations(d.value.data || []);
      if (g.status === 'fulfilled') setGuides(g.value.data || []);
      if (h.status === 'fulfilled') setHotels(h.value.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleLike = async (id) => {
    if (!user) { navigate('/login'); return; }
    setPosts(prev => prev.map(p => {
      if (p._id !== id) return p;
      const already = (p.likedBy || []).some(uid => uid === user._id || uid?._id === user._id);
      return { ...p, likeCount: already ? Math.max(0, (p.likeCount || 1) - 1) : (p.likeCount || 0) + 1, likedBy: already ? (p.likedBy || []).filter(uid => uid !== user._id && uid?._id !== user._id) : [...(p.likedBy || []), user._id] };
    }));
    try {
      const { data } = await api.patch(`/blogs/${id}/like`);
      setPosts(prev => prev.map(p => p._id === id ? { ...p, likeCount: data.likeCount } : p));
    } catch { /* roll back omitted for brevity */ }
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
      setOpenComments(prev => ({ ...prev, [postId]: { ...prev[postId], list: [...(prev[postId]?.list || []), data], text: '', posting: false } }));
    } catch {
      setOpenComments(prev => ({ ...prev, [postId]: { ...prev[postId], posting: false } }));
    }
  };

  const handleCommentDelete = async (postId, commentId) => {
    try {
      await api.delete(`/blogs/${postId}/comments/${commentId}`);
      setOpenComments(prev => ({ ...prev, [postId]: { ...prev[postId], list: prev[postId].list.filter(c => c._id !== commentId) } }));
    } catch {}
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setIsCompressing(true);
      const compressed = await compressImage(file);
      setImageFile(compressed);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(compressed);
    } catch { alert('Failed to compress image.'); }
    finally { setIsCompressing(false); }
  };

  const convertToBase64 = (file) => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
  });

  const closeModal = () => {
    setShowModal(false); setTitle(''); setContent(''); setLocationId('');
    setTaggedHotels([]); setTaggedGuides([]); setImageFile(null); setImagePreview(null);
  };

  const handlePublish = async () => {
    if (!locationId) { alert('Please select a destination.'); return; }
    const wordCount = (content.trim().match(/\S+/g) || []).length;
    if (wordCount > 250) { alert(`Caption is ${wordCount} words — please trim to 250 words.`); return; }
    setPublishing(true);
    try {
      let base64 = '';
      if (imageFile) base64 = await convertToBase64(imageFile);
      const selectedDest = destinations.find(d => d._id === locationId);
      await api.post('/blogs', {
        title: selectedDest?.name || title || 'Untitled Journey',
        content,
        locationId,
        taggedHotels,
        taggedGuides,
        image: base64,
      });
      const { data } = await api.get('/blogs');
      setPosts(data || []);
      closeModal();
      alert('Your journey has been shared! It will be published after admin review.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish post.');
    } finally { setPublishing(false); }
  };

  const topTravelers = [...posts]
    .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
    .slice(0, 3)
    .map(p => ({ username: p.authorId?.username || 'Explorer', likes: p.likeCount || 0, initial: (p.authorId?.username || 'E').slice(0, 1).toUpperCase(), id: p.authorId?._id }));

  const trendingTags = ['#EverestBaseCamp', '#AnnapurnaCrossing', '#MustangSecrets', '#WildChitwan', '#LakesideVibes'];

  return (
    <div className="w-full min-h-screen bg-slate-50 pt-28 pb-20 px-6 lg:px-12 xl:px-20">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── SIDEBAR ── */}
        <aside className="lg:col-span-3 flex flex-col gap-6">

          {/* Top Travelers */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-bold text-brand-blue uppercase tracking-widest block mb-4 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-brand-saffron" /> Top Travelers
            </h3>
            <div className="flex flex-col gap-3.5">
              {loading ? Array(3).fill(null).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-slate-100" />
                  <div className="flex-1 h-3 bg-slate-100 rounded" />
                </div>
              )) : topTravelers.map((t, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue font-extrabold text-xs flex items-center justify-center">
                      {t.initial}
                    </div>
                    <div>
                      <Link to={t.id ? `/profile/${t.id}` : '#'} className="text-xs font-bold text-brand-slate hover:text-brand-blue block">
                        @{t.username}
                      </Link>
                      <p className="text-[9px] text-gray-400 font-semibold">Rank #{i + 1}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-brand-pink bg-brand-pink/5 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                    <Heart className="w-3 h-3 fill-brand-pink text-brand-pink" />
                    {t.likes}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Tags */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Trending Tags
            </h3>
            <div className="flex flex-col gap-2">
              {trendingTags.map(tag => (
                <span key={tag} className="text-xs font-bold text-slate-700 hover:text-brand-blue cursor-pointer transition-colors">{tag}</span>
              ))}
            </div>
          </div>

          {/* Discover blurb */}
          <div className="text-white p-5 rounded-2xl border border-slate-800" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
            <h4 className="text-xs font-extrabold text-brand-saffron uppercase">Yaatri Co-op Journals</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed mt-2 font-medium">
              Share details about road blockage, altitude thresholds, and tea house availability directly in the feed.
            </p>
          </div>

        </aside>

        {/* ── MAIN FEED ── */}
        <main className="lg:col-span-9 flex flex-col gap-6">

          {/* Header */}
          <div className="bg-white px-6 py-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-brand-slate tracking-tight">Traveler Journals</h1>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Real hiker logs & photography</p>
            </div>
            {user ? (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-blue/15 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Share Journey
              </button>
            ) : (
              <button onClick={() => navigate('/login')} className="px-4 py-2.5 bg-brand-blue/5 hover:bg-brand-blue/10 border border-brand-blue/10 text-brand-blue font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer">
                Sign in to Share →
              </button>
            )}
          </div>

          {/* Posts feed */}
          <div className="flex flex-col gap-8">
            {loading ? Array(2).fill(null).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
                <div className="h-16 bg-slate-50 border-b border-slate-50" />
                <div className="aspect-video bg-slate-100" />
                <div className="p-6 space-y-3"><div className="h-3 bg-slate-100 rounded w-1/4" /><div className="h-3 bg-slate-100 rounded w-3/4" /></div>
              </div>
            )) : posts.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 border border-slate-100 shadow-sm text-center flex flex-col items-center gap-4">
                <Camera className="w-12 h-12 text-gray-300 animate-bounce" />
                <div>
                  <h3 className="font-bold text-brand-slate text-base">No journals posted yet</h3>
                  <p className="text-gray-400 text-xs mt-1">Be the first explorer to post an image of your trek!</p>
                </div>
              </div>
            ) : posts.map(post => {
              const isLiked = user && (post.likedBy || []).some(uid => uid === user._id || uid?._id === user._id);
              const showC = openComments[post._id];

              return (
                <motion.article
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                >
                  {/* Post header */}
                  <div className="p-5 flex items-center justify-between border-b border-slate-50 cursor-pointer" onClick={() => onSeeBlog && onSeeBlog(post)}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-brand-blue/10 text-brand-blue font-bold text-xs flex items-center justify-center border border-brand-blue/20">
                        {(post.authorId?.username || 'U').slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Link to={post.authorId?._id ? `/profile/${post.authorId._id}` : '#'} onClick={e => e.stopPropagation()} className="font-extrabold text-sm text-brand-slate hover:text-brand-blue transition-colors">
                            @{post.authorId?.username || 'Explorer'}
                          </Link>
                          <span className="px-1.5 py-0.5 bg-brand-pink/5 text-brand-pink text-[8px] font-bold rounded">TRAIL_LEADER</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5 flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-brand-blue" />
                          {post.locationId?.name || post.locationNode || 'Nepal'}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-gray-400">REF // {String(post._id).slice(-6).toUpperCase()}</span>
                  </div>

                  {/* Image */}
                  <div className="relative aspect-video max-h-[360px] bg-slate-50 overflow-hidden border-y border-slate-50 cursor-pointer" onClick={() => onSeeBlog && onSeeBlog(post)}>
                    <img
                      src={post.image || (Array.isArray(post.images) && post.images[0]) || 'https://images.unsplash.com/photo-1582650845100-3057102e3532?w=800'}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>

                  {/* Actions + caption */}
                  <div className="p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post._id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isLiked ? 'bg-brand-pink/15 text-brand-pink' : 'bg-slate-50 text-gray-500 hover:bg-slate-100'}`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-brand-pink text-brand-pink' : ''}`} />
                        <span>{post.likeCount || 0} likes</span>
                      </button>
                      <button
                        onClick={() => toggleComments(post._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-gray-500 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{showC ? (showC.list?.length ?? '…') : ''} Comments</span>
                      </button>
                    </div>

                    <div>
                      <h2 className="text-xl font-extrabold text-brand-slate tracking-tight">{post.title}</h2>
                      {post.content && <p className="text-gray-600 font-medium text-sm leading-relaxed mt-2">{post.content}</p>}
                    </div>

                    {(post.taggedHotels?.length > 0 || post.taggedGuides?.length > 0) && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                        {(post.taggedHotels || []).map((h, i) => (
                          <span key={i} className="px-2 py-0.5 bg-brand-green/10 text-brand-green font-bold text-[9px] uppercase rounded flex items-center gap-0.5">
                            🏠 {h.name || h}
                          </span>
                        ))}
                        {(post.taggedGuides || []).map((g, i) => (
                          <span key={i} className="px-2 py-0.5 bg-brand-blue/5 text-brand-blue font-bold text-[9px] uppercase rounded">
                            👤 {g.guideName || g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Inline comments */}
                  <AnimatePresence>
                    {showC && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-50 border-t border-slate-100 px-6 py-4 overflow-hidden"
                      >
                        <div className="flex flex-col gap-3 mb-4 max-h-56 overflow-y-auto no-scrollbar">
                          {showC.loading ? (
                            <p className="text-xs text-gray-400 text-center py-2">Loading…</p>
                          ) : showC.list.length === 0 ? (
                            <p className="text-[11px] text-gray-400 font-medium py-2">No comments yet — leave a word!</p>
                          ) : showC.list.map(c => (
                            <div key={c._id} className="flex justify-between items-start group p-2 bg-white rounded-lg border border-slate-100">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-100 font-extrabold text-[10px] text-gray-500 flex items-center justify-center border border-gray-200 shrink-0">
                                  {(c.authorId?.username || 'U').slice(0, 1).toUpperCase()}
                                </div>
                                <div className="text-xs">
                                  <span className="font-bold text-brand-slate">@{c.authorId?.username}: </span>
                                  <span className="text-gray-600 font-medium">{c.text}</span>
                                </div>
                              </div>
                              {user && (user._id === c.authorId?._id || user.role === 'admin') && (
                                <button onClick={() => handleCommentDelete(post._id, c._id)} className="text-gray-400 hover:text-brand-pink transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {user ? (
                          <form onSubmit={e => handleCommentSubmit(e, post._id)} className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Add a comment…"
                              value={showC.text || ''}
                              onChange={e => setOpenComments(prev => ({ ...prev, [post._id]: { ...prev[post._id], text: e.target.value } }))}
                              disabled={showC.posting}
                              maxLength={500}
                              className="flex-1 bg-white px-3.5 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:border-brand-blue"
                            />
                            <button type="submit" disabled={showC.posting || !showC.text?.trim()} className="p-2 bg-brand-blue text-white rounded-xl hover:bg-brand-blue/90 transition-all cursor-pointer disabled:opacity-50">
                              {showC.posting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            </button>
                          </form>
                        ) : (
                          <p className="text-[10px] text-gray-400 font-bold">Please <button onClick={() => navigate('/login')} className="text-brand-blue underline cursor-pointer">sign in</button> to comment.</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              );
            })}
          </div>
        </main>
      </div>

      {/* ── CREATE MODAL ── */}
      <AnimatePresence>
        {showModal && user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={closeModal}
          >
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full relative border border-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={closeModal} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-5 h-5" /></button>

              <span className="text-2xl block mb-2">📸</span>
              <span className="text-[10px] font-bold text-brand-pink uppercase tracking-widest block">JOURNAL FORM</span>
              <h3 className="text-xl font-extrabold text-brand-slate mt-1 mb-6">Share your climb journal</h3>

              <div className="flex flex-col gap-4">
                {/* Image upload */}
                <div
                  className="border-2 border-dashed border-slate-200 rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer hover:border-brand-blue hover:bg-brand-blue/5 transition-all overflow-hidden relative group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white font-semibold text-xs flex items-center gap-2"><Camera className="w-4 h-4" /> Change Photo</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-gray-300 mb-2" />
                      <p className="text-xs font-medium text-gray-500">Click to upload a photo</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG up to 5MB</p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} disabled={isCompressing} className="hidden" />

                {/* Destination */}
                <div>
                  <label className="text-xs font-bold text-brand-slate block mb-1.5">Destination Node *</label>
                  <select value={locationId} onChange={e => setLocationId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand-blue bg-white cursor-pointer"
                  >
                    <option value="">Select a destination…</option>
                    {destinations.map(d => <option key={d._id} value={d._id}>{d.name} · {d.region}</option>)}
                  </select>
                </div>

                {/* Caption */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-brand-slate">Caption content</label>
                    <span className="text-[10px] text-gray-400 font-semibold">{(content.trim().match(/\S+/g) || []).length} / 250 words</span>
                  </div>
                  <textarea
                    placeholder="Describe trail terrain, tea house hospitality, etc…"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={4}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand-blue resize-none"
                  />
                </div>

                {/* Tag hotels */}
                <div>
                  <label className="text-xs font-bold text-brand-slate block mb-1.5">Tag Hotels</label>
                  <SearchableSelect
                    options={hotels} value={taggedHotels} onChange={setTaggedHotels}
                    placeholder="Search hotels…" displayKey="name" valueKey="_id"
                    renderOption={h => <span className="text-white text-sm">{h.name}</span>}
                  />
                </div>

                {/* Tag guides */}
                <div>
                  <label className="text-xs font-bold text-brand-slate block mb-1.5">Tag Guides</label>
                  <SearchableSelect
                    options={guides} value={taggedGuides} onChange={setTaggedGuides}
                    placeholder="Search guides…" displayKey="guideName" valueKey="_id"
                    renderOption={g => <span className="text-white text-sm">{g.guideName}</span>}
                  />
                </div>

                <button
                  onClick={handlePublish}
                  disabled={publishing || isCompressing || !locationId}
                  className="w-full mt-2 py-3 bg-brand-blue hover:bg-brand-blue/90 disabled:bg-gray-300 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-blue/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isCompressing ? <><Loader className="w-4 h-4 animate-spin" /> Compressing…</> : publishing ? 'Publishing…' : 'Publish Post'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
