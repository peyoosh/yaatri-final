import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import { Heart, Camera, ShieldAlert } from 'lucide-react';

const Blog = ({ onSeeBlog }) => {
  const [posts, setPosts] = useState([]);
  const [newCaption, setNewCaption] = useState('');
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    api.get(`/blogs`).then(res => setPosts(res.data));
  }, []);

  const handleLike = async (id) => {
    try {
      await api.patch(`/blogs/${id}/like`);
    } catch (e) { console.warn("Liking requires backend support", e); }
    setPosts(posts.map(p => p._id === id ? { ...p, likes: (p.likeCount || 0) + 1 } : p));
  };

  const handlePost = async () => {
    if (!newCaption) return;
    const postData = {
      title: newLocation || 'INTEL_STREAM',
      content: newCaption,
      locationNode: newLocation || 'UNKNOWN_COORDINATES',
      images: ['https://images.unsplash.com/photo-1582650845100-3057102e3532?w=800']
    };
    try {
      await api.post(`/blogs`, postData);
      const updated = await api.get(`/blogs`);
      setPosts(updated.data);
      setNewCaption('');
      setNewLocation('');
    } catch (err) {
      console.error("Failed to broadcast:", err);
      if (err.response?.status === 401) alert("Unauthorized: Please log in to post.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-6rem)] bg-obsidian text-white">
      {/* LEFT SIDEBAR */}
      <aside className="w-1/5 border-r border-white/5 p-8 flex flex-col gap-12 bg-teal-steel">
        <div>
          <p className="text-[#059D72] text-[0.65rem] font-extrabold tracking-widest mb-4">TRENDING_NODES</p>
          <ul className="list-none p-0 text-sm opacity-70">
            <li className="mb-3 cursor-pointer hover:text-[#059D72] transition-colors">#KHUMBU_ASCENT</li>
            <li className="mb-3 cursor-pointer hover:text-[#059D72] transition-colors">#MUSTANG_TRAILS</li>
            <li className="mb-3 cursor-pointer hover:text-[#059D72] transition-colors">#LALITPUR_HISTORY</li>
          </ul>
        </div>

        <div>
          <p className="text-[#059D72] text-[0.65rem] font-extrabold tracking-widest mb-4">MOST_LIKED_DATA</p>
          <div className="flex flex-col gap-4">
          {[...posts].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0)).slice(0, 2).map(p => (
            <div key={p._id} className="text-xs border-l border-[#059D72] pl-2.5">
              <Link to={p.authorId?._id ? `/profile/${p.authorId._id}` : '#'} className="font-bold hover:text-toxic-lime hover:underline block">{p.authorId?.username?.toUpperCase() || 'UNKNOWN'}</Link>
              <p className="opacity-50">{p.likeCount || 0} DATA_POINTS</p>
            </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[#059D72] text-[0.65rem] font-extrabold tracking-widest mb-4">REGIONAL_BROADCASTS</p>
          <p className="text-[0.7rem] opacity-40 italic">Detecting nodes in your current sector...</p>
          <div className="mt-4 p-2.5 bg-[#059D72]/5 border border-[#059D72]/10 rounded-sm">
            <p className="text-xs font-bold">RECENT: LALITPUR_HUB</p>
            <p className="text-[0.65rem] opacity-60">2 active streams in last 10m</p>
          </div>
        </div>
      </aside>

      {/* MAIN FEED */}
      <main className="flex-1 p-16 overflow-y-auto max-h-[calc(100vh-6rem)]">
        <div className="max-w-[600px] mx-auto">
          <div className="mb-12 border-b border-white/10 pb-4">
            <h2 className="text-2xl font-extrabold tracking-widest text-[#059D72]">SYSTEM_BLOG</h2>
            <p className="text-[0.7rem] opacity-50 font-mono">DATA_STREAM: ENCRYPTED // SOURCE: USER_NODES</p>
          </div>

          {/* BROADCAST INPUT */}
          <div className="bg-teal-steel/50 p-6 border border-white/5 mb-12">
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 items-center">
                <Camera size={20} className="text-[#059D72]" />
                <input 
                  type="text" 
                  placeholder="LOCATION_OF_EXPEDITION..." 
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="flex-1 bg-transparent border-none border-b border-white/10 text-white p-2 outline-none text-sm"
                />
              </div>
              <div className="flex gap-4 items-center">
                <input 
                  type="text" 
                  placeholder="INITIATE_CAPTION_SCAN..." 
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  className="flex-1 bg-transparent border-none border-b border-white/10 text-white p-2 outline-none text-sm"
                />
              </div>
              <div className="text-right mt-4">
                <button onClick={handlePost} className="btn-primary-white py-2 px-4 text-[0.6rem]">SEND_BROADCAST</button>
              </div>
            </div>
          </div>

          {/* INTEL STREAM */}
          <div className="flex flex-col gap-16">
            {posts.map(post => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={post._id}
                onClick={() => onSeeBlog(post)}
                className="border border-white/5 mb-16 cursor-pointer bg-teal-steel"
              >
                <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#059D72]" />
                    <div>
                      <Link to={post.authorId?._id ? `/profile/${post.authorId._id}` : '#'} onClick={(e) => e.stopPropagation()} className="text-sm font-bold tracking-widest m-0 hover:text-toxic-lime hover:underline block">{post.authorId?.username?.toUpperCase() || 'UNKNOWN'}</Link>
                      <p className="text-[0.65rem] opacity-60 m-0 text-[#A6A180]">{post.locationNode}</p>
                    </div>
                  </div>
                  {post.status === 'flagged' && <ShieldAlert size={16} className="text-orange-500" />}
                </div>
                
                <div className="relative w-full aspect-square overflow-hidden">
                  <img src={post.images?.[0] || 'https://images.unsplash.com/photo-1582650845100-3057102e3532?w=800'} alt="Intel" className="w-full h-full object-cover grayscale-[20%]" />
                </div>

                <div className="p-6">
                  <div className="flex gap-6 mb-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(post._id);
                      }}
                      className="bg-toxic-lime text-obsidian px-3 py-1 rounded flex items-center gap-2 hover:scale-105 transition-transform font-bold text-xs"
                    >
                      <Heart size={16} className="fill-current" /> LIKE
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs font-extrabold text-[#059D72] mb-2">{post.likeCount || 0} DATA_POINTS</p>
                    <span className="text-[0.6rem] opacity-30 font-mono">NODE_ID: {post._id}</span>
                  </div>

                  <p className="text-sm leading-relaxed opacity-80">
                    <Link to={post.authorId?._id ? `/profile/${post.authorId._id}` : '#'} onClick={(e) => e.stopPropagation()} className="font-extrabold mr-2 text-[#F4F2F3] hover:text-toxic-lime hover:underline">{post.authorId?.username || 'UNKNOWN'}</Link>
                    {post.content}
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