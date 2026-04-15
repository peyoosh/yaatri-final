import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Dashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    userCount: 0, 
    activeNodes: 0, 
    intelStreams: 0,
    revenue: "Rs. 4.2M",
    traffic: "128K/mo",
    activeGuides: 42
  });
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
  const [safetyConcerns] = useState([
    { id: 1, name: 'Suman Gurung', region: 'Khumbu Node', severity: 'High', log: 'Uplink failure during ascent.' },
    { id: 2, name: 'Rita Tamang', region: 'Mustang', severity: 'Low', log: 'Supply drop delay at node 04.' }
  ]);

  // SECURE CONFIG
  const token = localStorage.getItem('yaatri_token');
  const adminConfig = { headers: { Authorization: `Bearer ${token}` } };

  const API_BASE_URL = import.meta.env.VITE_API_URL || "https://yaatri-backend.onrender.com";

  useEffect(() => {
    const loadAdminData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [s, d, b] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/admin/stats`, adminConfig),
          axios.get(`${API_BASE_URL}/api/destinations`),
          axios.get(`${API_BASE_URL}/api/posts`)
        ]);
        setStats(prev => ({ ...prev, ...s.data }));
        setDestinations(d.data);
        setBlogPosts(b.data);
      } catch (err) {
        console.error("ADMIN_AUTH_FAILED", err);
      } finally {
        setLoading(false);
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--obsidian)', color: 'var(--hill-green)', fontFamily: 'monospace' }}>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse' }}
        >
          [ SYNCING_AUTHOR_INTERFACE... ]
        </motion.div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* SIDEBAR NAVIGATION */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">YAATRI_HUB</div>
        <nav className="sidebar-nav">
          <button className="nav-item active">User Management</button>
          <button className="nav-item">Destination Core</button>
          <button className="nav-item">Blog Moderation</button>
          <button className="nav-item">Hotel Inventory</button>
          <button className="nav-item">Guide Services</button>
        </nav>
      </aside>

      <main className="admin-main">
        {/* HEADER */}
        <header className="admin-header">
          <div className="search-bar">
            <input type="text" placeholder="GLOBAL_SEARCH_NODES..." />
          </div>
          <div className="admin-profile">
            <div className="profile-info">
              <span className="profile-name">peyoosh_admin</span>
              <span className="profile-role">CORE_AUTHOR</span>
            </div>
            <div className="profile-avatar">P</div>
          </div>
        </header>

        <div className="admin-content">
          <h2 className="page-title">AUTHOR_MANAGEMENT_FRONT</h2>
          
          {/* SUMMARY CARDS */}
          <div className="summary-grid">
            <div className="summary-card">
              <span className="card-label">TOTAL_REVENUE</span>
              <span className="card-value">{stats.revenue}</span>
            </div>
            <div className="summary-card">
              <span className="card-label">MONTHLY_TRAFFIC</span>
              <span className="card-value">{stats.traffic}</span>
            </div>
            <div className="summary-card">
              <span className="card-label">ACTIVE_GUIDES</span>
              <span className="card-value">{stats.activeGuides}</span>
            </div>
          </div>

          {/* CHART PLACEHOLDER */}
          <div className="chart-section">
            <h3 className="section-title">Most Opted Nepal Routes</h3>
            <div className="chart-placeholder">
              [ DATA_VISUALIZATION: TOPOGRAPHIC_FLOW_ANALYSIS ]
            </div>
          </div>

          {/* GUIDE SAFETY TABLE */}
          <section className="table-section">
            <h3 className="section-title">Guide Safety Concerns</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>GUIDE_NAME</th>
                    <th>REGION</th>
                    <th>SEVERITY</th>
                    <th>INCIDENT_LOG</th>
                  </tr>
                </thead>
                <tbody>
                  {safetyConcerns.map(c => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.region}</td>
                      <td><span className={`severity-tag ${c.severity.toLowerCase()}`}>{c.severity}</span></td>
                      <td>{c.log}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* USER REGISTRY */}
          <section className="table-section">
            <h3 className="section-title">System User Registry</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>USER_ID</th>
                    <th>IDENTIFIER</th>
                    <th>ROLE</th>
                    <th>OPERATIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {userList.map(u => (
                    <tr key={u.id}>
                      <td>#{u.id.toString().padStart(3, '0')}</td>
                      <td className="highlight-text" onClick={() => setViewingProfile(u)}>{u.username}</td>
                      <td>{u.role.toUpperCase()}</td>
                      <td className="actions-cell">
                        <button onClick={() => navigate(`/admin/blogs?user=${u.id}`)} className="action-btn info">VIEW_BLOGS</button>
                        <button onClick={() => blockUser(u.id)} className="action-btn warn">{u.status === 'Blocked' ? 'UNBLOCK' : 'BLOCK'}</button>
                        <button onClick={() => deleteUser(u.id)} className="action-btn danger">PURGE</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* BLOG MODERATION */}
          <section className="table-section">
            <h3 className="section-title">Intel Stream Moderation</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>AUTHOR</th>
                    <th>CAPTION_EXTRACT</th>
                    <th>OPERATIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {blogPosts.map(post => (
                    <tr key={post.id}>
                      <td>@{post.user}</td>
                      <td>{post.caption.substring(0, 50)}...</td>
                      <td className="actions-cell">
                        <button onClick={() => navigate(`/admin/users/${post.user_id || 1}`)} className="action-btn info">VIEW_AUTHOR</button>
                        <button onClick={() => deletePost(post.id)} className="action-btn danger">DELETE_STREAM</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}