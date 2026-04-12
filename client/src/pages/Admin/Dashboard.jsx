import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ userCount: 0, activeNodes: 0, intelStreams: 0 });
  const [destinations, setDestinations] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [editingDest, setEditingDest] = useState(null);

  // SECURE CONFIG
  const adminConfig = { headers: { Authorization: 'YAATRI_SECRET_KEY_2024' } };

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [s, d, b] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/stats', adminConfig),
          axios.get('http://localhost:5000/api/destinations'),
          axios.get('http://localhost:5000/api/posts')
        ]);
        setStats(s.data);
        setDestinations(d.data);
        setBlogPosts(b.data);
      } catch (err) {
        console.error("ADMIN_AUTH_FAILED", err);
      }
    };
    loadAdminData();
  }, []);

  const deletePost = async (id) => {
    await axios.delete(`http://localhost:5000/api/posts/${id}`, adminConfig);
    setBlogPosts(blogPosts.filter(p => p.id !== id));
  };

  const saveDestination = async (e) => {
    e.preventDefault();
    const method = editingDest.isNew ? 'post' : 'put';
    const url = `http://localhost:5000/api/destinations${editingDest.isNew ? '' : '/' + editingDest.rank}`;
    
    await axiosmethod;
    setEditingDest(null);
    // Reload data
    const d = await axios.get('http://localhost:5000/api/destinations');
    setDestinations(d.data);
  };

  return (
    <div style={{ padding: '4rem 10%', background: 'var(--obsidian)', minHeight: '100vh', color: 'white' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--hill-green)', letterSpacing: '4px' }}>ADMIN_CONTROL_CENTER</h2>
      
      {/* METRICS ROW */}
      <div style={{ display: 'flex', gap: '2rem', margin: '2rem 0' }}>
        <div style={{ flex: 1, padding: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>USER_COUNT</p>
          <h4 style={{ fontSize: '2rem' }}>{stats.userCount}</h4>
        </div>
        <div style={{ flex: 1, padding: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>ACTIVE_NODES</p>
          <h4 style={{ fontSize: '2rem' }}>{stats.activeNodes}</h4>
        </div>
        <div style={{ flex: 1, padding: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>INTEL_STREAMS</p>
          <h4 style={{ fontSize: '2rem' }}>{stats.intelStreams}</h4>
        </div>
      </div>

      {/* DESTINATION CRUD */}
      <section style={{ marginTop: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3>Manage Terrain Data</h3>
          <button onClick={() => setEditingDest({ rank: '', title: '', region: '', stats: '', description: '', image: '', isNew: true })} style={{ background: 'var(--hill-green)', color: 'white', border: 'none', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer' }}>+ ADD_NEW_NODE</button>
        </div>

        {editingDest && (
          <form onSubmit={saveDestination} style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input type="text" placeholder="RANK (e.g. 05)" value={editingDest.rank} onChange={e => setEditingDest({...editingDest, rank: e.target.value})} style={{ padding: '10px', background: '#000', border: '1px solid #333', color: 'white' }} />
              <input type="text" placeholder="TITLE" value={editingDest.title} onChange={e => setEditingDest({...editingDest, title: e.target.value})} style={{ padding: '10px', background: '#000', border: '1px solid #333', color: 'white' }} />
              <input type="text" placeholder="REGION" value={editingDest.region} onChange={e => setEditingDest({...editingDest, region: e.target.value})} style={{ padding: '10px', background: '#000', border: '1px solid #333', color: 'white' }} />
              <input type="text" placeholder="IMAGE_URL" value={editingDest.image} onChange={e => setEditingDest({...editingDest, image: e.target.value})} style={{ padding: '10px', background: '#000', border: '1px solid #333', color: 'white' }} />
            </div>
            <textarea placeholder="FULL_CONTENT_DESCRIPTION" value={editingDest.description} onChange={e => setEditingDest({...editingDest, description: e.target.value})} style={{ padding: '10px', background: '#000', border: '1px solid #333', color: 'white', minHeight: '100px' }} />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" style={{ background: 'white', color: 'black', border: 'none', padding: '10px 30px', fontWeight: 'bold', cursor: 'pointer' }}>SAVE_CHANGES</button>
              <button type="button" onClick={() => setEditingDest(null)} style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '10px 30px', cursor: 'pointer' }}>CANCEL</button>
            </div>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {destinations.map(dest => (
            <div key={dest.rank} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span><strong>[{dest.rank}]</strong> {dest.title} — {dest.region}</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setEditingDest(dest)} style={{ background: '#333', color: '#fff', border: 'none', padding: '5px 15px', cursor: 'pointer' }}>EDIT</button>
                <button style={{ background: '#ff4d4d', color: '#fff', border: 'none', padding: '5px 15px', cursor: 'pointer' }}>REMOVE</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BLOG MODERATION */}
      <section style={{ marginTop: '4rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
        <h3>Stream Moderation</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '2rem' }}>
          {blogPosts.map(post => (
            <div key={post.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.9rem' }}><strong>@{post.user}</strong> — {post.caption.substring(0, 40)}...</span>
              <button onClick={() => deletePost(post.id)} style={{ background: '#ff4d4d', color: '#fff', border: 'none', padding: '5px 15px', cursor: 'pointer' }}>DELETE_STREAM</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}