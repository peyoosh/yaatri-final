import React, { useState, useEffect } from 'react';
import axios from 'axios';

const tableHeaderStyle = { textAlign: 'left', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--hill-green)', fontSize: '0.7rem', letterSpacing: '1px' };
const tableCellStyle = { padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' };

export default function AdminDashboard() {
  const [stats, setStats] = useState({ userCount: 0, activeNodes: 0, intelStreams: 0 });
  const [userList, setUserList] = useState([
    { id: 1, username: 'aaryush_admin', email: 'admin@yaatri.np', isAdmin: true },
    { id: 2, username: 'trekker_88', email: 'user@gmail.com', isAdmin: false }
  ]);
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

      {/* USER MANAGEMENT TABLE */}
      <section style={{ marginBottom: '4rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>System User Registry</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(255,255,255,0.01)' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>USER_ID</th>
              <th style={tableHeaderStyle}>IDENTIFIER</th>
              <th style={tableHeaderStyle}>UPLINK_EMAIL</th>
              <th style={tableHeaderStyle}>ROLE_STATUS</th>
            </tr>
          </thead>
          <tbody>
            {userList.map(u => (
              <tr key={u.id}>
                <td style={tableCellStyle}>#{u.id.toString().padStart(3, '0')}</td>
                <td style={tableCellStyle}>{u.username}</td>
                <td style={tableCellStyle}>{u.email}</td>
                <td style={tableCellStyle}>
                  <span style={{ color: u.isAdmin ? 'var(--hill-green)' : 'inherit', fontWeight: u.isAdmin ? 'bold' : 'normal' }}>
                    {u.isAdmin ? 'CORE_ADMIN' : 'EXPLORER'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* TOURS/DESTINATIONS TABLE */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem' }}>Destination Node Repository</h3>
          <button onClick={() => setEditingDest({ rank: '', title: '', region: '', stats: '', description: '', image: '', isNew: true })} style={{ background: 'var(--hill-green)', color: 'white', border: 'none', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.7rem' }}>+ NEW_NODE</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(255,255,255,0.01)' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>RANK</th>
              <th style={tableHeaderStyle}>NODE_TITLE</th>
              <th style={tableHeaderStyle}>SECTOR_REGION</th>
              <th style={tableHeaderStyle}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {destinations.map(dest => (
              <tr key={dest.rank}>
                <td style={tableCellStyle}>{dest.rank}</td>
                <td style={tableCellStyle}>{dest.title}</td>
                <td style={tableCellStyle}>{dest.region}</td>
                <td style={tableCellStyle}>
                  <button onClick={() => setEditingDest(dest)} style={{ background: 'none', border: 'none', color: 'var(--hill-green)', cursor: 'pointer', marginRight: '15px', fontSize: '0.7rem', fontWeight: 'bold' }}>EDIT</button>
                  <button style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' }}>REMOVE</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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