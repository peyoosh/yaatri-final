import React, { useState, useEffect } from 'react';
import axios from 'axios';

const tableHeaderStyle = { textAlign: 'left', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--hill-green)', fontSize: '0.7rem', letterSpacing: '1px' };
const tableCellStyle = { padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' };

export default function AdminDashboard() {
  const [stats, setStats] = useState({ userCount: 0, activeNodes: 0, intelStreams: 0 });
  const [userList, setUserList] = useState([
    { id: 1, username: 'aaryush_admin', email: 'admin@yaatri.np', isAdmin: true, status: 'Active', bio: 'Core system administrator for Yaatri Hub.' },
    { id: 2, username: 'trekker_88', email: 'user@gmail.com', isAdmin: false, status: 'Active', bio: 'Veteran explorer specializing in Khumbu terrain.' }
  ]);
  const [destinations, setDestinations] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [editingDest, setEditingDest] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [resetRequests, setResetRequests] = useState([
    { id: 1, username: 'trekker_88', timestamp: '2024-04-12 14:30', status: 'Pending' }
  ]);

  // SECURE CONFIG
  const token = localStorage.getItem('yaatri_token');
  const adminConfig = { headers: { Authorization: `Bearer ${token}` } };

  const API_BASE_URL = window.location.hostname === "localhost" 
    ? "http://localhost:5000" 
    : "https://yaatri-final.onrender.com";

  useEffect(() => {
    const loadAdminData = async () => {
      if (!token) return;
      try {
        const [s, d, b] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/admin/stats`, adminConfig),
          axios.get(`${API_BASE_URL}/api/destinations`),
          axios.get(`${API_BASE_URL}/api/posts`)
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
    await axios.delete(`${API_BASE_URL}/api/posts/${id}`, adminConfig);
    setBlogPosts(blogPosts.filter(p => p.id !== id));
  };

  const deleteDestination = async (rank) => {
    if (window.confirm(`CONFIRM_DELETION: NODE_${rank}`)) {
      await axios.delete(`${API_BASE_URL}/api/destinations/${rank}`, adminConfig);
      setDestinations(destinations.filter(d => d.rank !== rank));
    }
  };

  const saveDestination = async (e) => {
    e.preventDefault();
    const method = editingDest.isNew ? 'post' : 'put';
    const url = `${API_BASE_URL}/api/destinations${editingDest.isNew ? '' : '/' + editingDest.rank}`;
    
    try {
      await axiosmethod;
    } catch (err) {
      console.error("SAVE_FAILED", err);
    }

    setEditingDest(null);
    // Reload data
    const d = await axios.get(`${API_BASE_URL}/api/destinations`);
    setDestinations(d.data);
  };

  const blockUser = (id) => {
    setUserList(userList.map(u => u.id === id ? { ...u, status: u.status === 'Blocked' ? 'Active' : 'Blocked' } : u));
  };

  const deleteUser = (id) => {
    if (window.confirm("PURGE_PROTOCOL: CONFIRM_USER_DELETION? This action is irreversible.")) {
      setUserList(userList.filter(u => u.id !== id));
    }
  };

  const verifyPasswordReset = (id) => {
    alert(`RESET_VERIFIED for Request_ID: ${id}`);
    setResetRequests(resetRequests.filter(r => r.id !== id));
  };

  const handleProtocolChange = (index, field, value) => {
    const newProtocols = [...(editingDest.protocols || [])];
    newProtocols[index] = { ...newProtocols[index], [field]: value };
    setEditingDest({ ...editingDest, protocols: newProtocols });
  };

  const addProtocol = () => {
    setEditingDest({ 
      ...editingDest, 
      protocols: [...(editingDest.protocols || []), { title: '', desc: '' }] 
    });
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
              <th style={tableHeaderStyle}>NODE_STATUS</th>
              <th style={tableHeaderStyle}>OPERATIONS</th>
            </tr>
          </thead>
          <tbody>
            {userList.map(u => (
              <tr key={u.id}>
                <td style={tableCellStyle}>#{u.id.toString().padStart(3, '0')}</td>
                <td style={{...tableCellStyle, cursor: 'pointer', color: 'var(--hill-green)'}} onClick={() => setViewingProfile(u)}>{u.username}</td>
                <td style={tableCellStyle}>{u.email}</td>
                <td style={tableCellStyle}>
                  <span style={{ color: u.isAdmin ? 'var(--hill-green)' : 'inherit', fontWeight: u.isAdmin ? 'bold' : 'normal' }}>
                    {u.isAdmin ? 'CORE_ADMIN' : 'EXPLORER'}
                  </span>
                </td>
                <td style={tableCellStyle}>
                  <span style={{ color: u.status === 'Blocked' ? '#ff4d4d' : 'white' }}>{u.status}</span>
                </td>
                <td style={tableCellStyle}>
                  <button onClick={() => blockUser(u.id)} style={{ background: 'none', border: 'none', color: 'orange', cursor: 'pointer', marginRight: '10px', fontSize: '0.7rem', fontWeight: 'bold' }}>{u.status === 'Blocked' ? 'UNBLOCK' : 'BLOCK'}</button>
                  <button onClick={() => deleteUser(u.id)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' }}>DELETE</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* PASSWORD RESET VERIFICATION */}
      <section style={{ marginBottom: '4rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Pending Password Resets</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {resetRequests.length > 0 ? resetRequests.map(req => (
            <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.85rem' }}><strong>@{req.username}</strong> requested reset at {req.timestamp}</span>
              <button onClick={() => verifyPasswordReset(req.id)} style={{ background: 'var(--hill-green)', color: '#fff', border: 'none', padding: '5px 15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem' }}>VERIFY_RESET</button>
            </div>
          )) : (
            <p style={{ fontSize: '0.7rem', opacity: 0.3 }}>[ NO_PENDING_REQUESTS ]</p>
          )}
        </div>
      </section>

      {/* TOURS/DESTINATIONS TABLE */}
      <section style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem' }}>Core Node Registry</h3>
          <button onClick={() => setEditingDest({ rank: '', title: '', region: '', stats: '', description: '', image: '', protocols: [], isNew: true })} style={{ background: 'var(--hill-green)', color: 'white', border: 'none', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.7rem' }}>+ ADD_DESTINATION</button>
        </div>

        {/* DESTINATION & DETAIL EDITOR */}
        {editingDest && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hill-green)', padding: '2rem', marginBottom: '3rem' }}>
            <h4 style={{ color: 'var(--hill-green)', marginBottom: '1.5rem', fontSize: '0.8rem' }}>NODE_EDITOR // DETAILS_CONFIGURATION</h4>
            <form onSubmit={saveDestination} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <input type="text" placeholder="RANK (e.g. 05)" value={editingDest.rank} onChange={e => setEditingDest({...editingDest, rank: e.target.value})} style={{ padding: '12px', background: '#000', border: '1px solid #333', color: 'white' }} />
                <input type="text" placeholder="TITLE" value={editingDest.title} onChange={e => setEditingDest({...editingDest, title: e.target.value})} style={{ padding: '12px', background: '#000', border: '1px solid #333', color: 'white' }} />
                <input type="text" placeholder="REGION" value={editingDest.region} onChange={e => setEditingDest({...editingDest, region: e.target.value})} style={{ padding: '12px', background: '#000', border: '1px solid #333', color: 'white' }} />
                <input type="text" placeholder="IMAGE_URL" value={editingDest.image} onChange={e => setEditingDest({...editingDest, image: e.target.value})} style={{ padding: '12px', background: '#000', border: '1px solid #333', color: 'white' }} />
              </div>
              <textarea placeholder="SYSTEM_DESCRIPTION" value={editingDest.description} onChange={e => setEditingDest({...editingDest, description: e.target.value})} style={{ padding: '12px', background: '#000', border: '1px solid #333', color: 'white', minHeight: '80px' }} />
              
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--terai-harvest)', marginBottom: '1rem' }}>EXPERIENCE_PROTOCOLS (DESTINATION_DETAILS)</p>
                {editingDest.protocols?.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <input type="text" placeholder="Protocol Title" value={p.title} onChange={e => handleProtocolChange(i, 'title', e.target.value)} style={{ flex: 1, padding: '8px', background: '#111', border: '1px solid #222', color: 'white', fontSize: '0.8rem' }} />
                    <input type="text" placeholder="Description" value={p.desc} onChange={e => handleProtocolChange(i, 'desc', e.target.value)} style={{ flex: 2, padding: '8px', background: '#111', border: '1px solid #222', color: 'white', fontSize: '0.8rem' }} />
                  </div>
                ))}
                <button type="button" onClick={addProtocol} style={{ background: 'none', border: '1px dashed var(--terai-harvest)', color: 'var(--terai-harvest)', padding: '5px 15px', cursor: 'pointer', fontSize: '0.7rem' }}>+ APPEND_PROTOCOL_DATA</button>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" style={{ background: 'white', color: 'black', border: 'none', padding: '10px 30px', fontWeight: 'bold', cursor: 'pointer' }}>COMMIT_CHANGES</button>
                <button type="button" onClick={() => setEditingDest(null)} style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '10px 30px', cursor: 'pointer' }}>ABORT</button>
              </div>
            </form>
          </div>
        )}

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
                  <button onClick={() => setEditingDest({ ...dest, isNew: false })} style={{ background: 'none', border: 'none', color: 'var(--hill-green)', cursor: 'pointer', marginRight: '15px', fontSize: '0.7rem', fontWeight: 'bold' }}>EDIT</button>
                  <button onClick={() => deleteDestination(dest.rank)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' }}>REMOVE</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* BLOG MODERATION */}
      <section style={{ marginTop: '4rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
        <h3>Intel Stream Moderation (Blog Delete)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '2rem' }}>
          {blogPosts.map(post => (
            <div key={post.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.9rem' }}><strong>@{post.user}</strong> — {post.caption.substring(0, 40)}...</span>
              <button onClick={() => deletePost(post.id)} style={{ background: '#ff4d4d', color: '#fff', border: 'none', padding: '5px 15px', cursor: 'pointer' }}>DELETE_STREAM</button>
            </div>
          ))}
        </div>
      </section>

      {/* PROFILE VIEWER OVERLAY */}
      {viewingProfile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--obsidian)', border: '1px solid var(--hill-green)', padding: '2rem', width: '400px', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color: 'var(--hill-green)', marginBottom: '1.5rem', letterSpacing: '2px' }}>INTEL_NODE: {viewingProfile.username}</h3>
            <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: 0.8 }}>
              <p><strong>UPLINK:</strong> {viewingProfile.email}</p>
              <p><strong>AUTH_STATUS:</strong> {viewingProfile.isAdmin ? 'ADMIN' : 'USER'}</p>
              <p><strong>NODE_STATUS:</strong> {viewingProfile.status}</p>
              <p><strong>EXPEDITION_BIO:</strong> {viewingProfile.bio}</p>
            </div>
            <button onClick={() => setViewingProfile(null)} style={{ marginTop: '2rem', width: '100%', padding: '12px', background: 'white', color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>ABORT_VIEW</button>
          </div>
        </div>
      )}
    </div>
  );
}