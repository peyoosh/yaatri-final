import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import DestinationManager from '../../components/admin/DestinationManager';
import UserManager from '../../UserManager';
import BlogManager from './BlogManager';
import GuideManager from './GuideManager';
import HotelManager from './HotelManager';
import './Dashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeHub, setActiveHub] = useState('users');
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
    { id: 1, username: 'peyoosh_admin', email: 'peyoosh@yaatri.np', role: 'author', status: 'Active', bio: 'Core system administrator for Yaatri Hub.' },
    { id: 2, username: 'trekker_88', email: 'user@gmail.com', role: 'explorer', status: 'Active', bio: 'Veteran explorer specializing in Khumbu terrain.' }
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
          <button 
            className={`nav-item ${activeHub === 'users' ? 'active' : ''}`} 
            onClick={() => setActiveHub('users')}
          >
            User Management
          </button>
          <button 
            className={`nav-item ${activeHub === 'destinations' ? 'active' : ''}`} 
            onClick={() => setActiveHub('destinations')}
          >
            Destination Core
          </button>
          <button 
            className={`nav-item ${activeHub === 'blogs' ? 'active' : ''}`} 
            onClick={() => setActiveHub('blogs')}
          >
            Blog Moderation
          </button>
          <button 
            className={`nav-item ${activeHub === 'hotels' ? 'active' : ''}`} 
            onClick={() => setActiveHub('hotels')}
          >
            Hotel Inventory
          </button>
          <button 
            className={`nav-item ${activeHub === 'guides' ? 'active' : ''}`} 
            onClick={() => setActiveHub('guides')}
          >
            Guide Services
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        {/* HEADER */}
        <header className="admin-header">
          <button onClick={() => navigate('/')} className="action-btn info" style={{ marginRight: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} />
            EXIT_TO_HOME
          </button>
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
          {activeHub === 'users' && (
            <UserManager
              stats={stats}
              userList={userList}
              setViewingProfile={setViewingProfile}
              blockUser={blockUser}
              deleteUser={deleteUser}
              setActiveHub={setActiveHub}
            />
          )}

          {activeHub === 'destinations' && (
            <DestinationManager 
              destinations={destinations}
              editingDest={editingDest}
              setEditingDest={setEditingDest}
              deleteDestination={deleteDestination}
              saveDestination={saveDestination}
              handleProtocolChange={handleProtocolChange}
              addProtocol={addProtocol}
            />
          )}
          
          {activeHub === 'blogs' && (
            <BlogManager blogPosts={blogPosts} deletePost={deletePost} />
          )}
          {activeHub === 'hotels' && <HotelManager />}
          {activeHub === 'guides' && (
            <GuideManager safetyConcerns={safetyConcerns} />
          )}
        </div>
      </main>
    </div>
  );
}