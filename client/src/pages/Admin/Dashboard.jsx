import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout and Core Components
import AdminLayout from './AdminLayout';
import ErrorBoundary from '../../components/admin/ErrorBoundary';
import SkeletonLoader from '../../components/admin/SkeletonLoader';
import NotificationBar from '../../components/admin/NotificationBar';

// Hub Components
import DestinationManager from '../../components/admin/DestinationManager';
import UserManager from '../../UserManager';
import BlogManager from './BlogManager';
import GuideManager from './GuideManager';
import HotelManager from './HotelManager';

import './Dashboard.css';

// Setup Axios Global Interceptor
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://yaatri-backend.onrender.com";
const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('yaatri_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [userList, setUserList] = useState([
    { id: 1, username: 'peyoosh_admin', email: 'peyoosh@yaatri.np', role: 'author', status: 'Active', bio: 'Core system administrator for Yaatri Hub.' },
    { id: 2, username: 'trekker_88', email: 'user@gmail.com', role: 'explorer', status: 'Active', bio: 'Veteran explorer specializing in Khumbu terrain.' }
  ]);
  const [destinations, setDestinations] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [editingDest, setEditingDest] = useState(null);
  const [safetyConcerns] = useState([
    { id: 1, name: 'Suman Gurung', region: 'Khumbu Node', severity: 'High', log: 'Uplink failure during ascent.' },
    { id: 2, name: 'Rita Tamang', region: 'Mustang', severity: 'Low', log: 'Supply drop delay at node 04.' }
  ]);

  // SECURE CONFIG
  const token = localStorage.getItem('yaatri_token');
  const loggedInUser = JSON.parse(localStorage.getItem('yaatri_user'));

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setLoading(true);
        const [s, d, b] = await Promise.all([
          apiClient.get('/api/admin/stats'),
          apiClient.get('/api/destinations'),
          apiClient.get('/api/posts')
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
    await apiClient.delete(`/api/posts/${id}`);
    setBlogPosts(blogPosts.filter(p => p.id !== id));
  };

  const deleteDestination = async (rank) => {
    if (window.confirm(`CONFIRM_DELETION: NODE_${rank}`)) {
      await apiClient.delete(`/api/destinations/${rank}`);
      setDestinations(destinations.filter(d => d.rank !== rank));
    }
  };

  const saveDestination = async (e) => {
    e.preventDefault();
    if (!editingDest) return;

    const method = editingDest.isNew ? 'post' : 'put';
    const url = `/api/destinations${editingDest.isNew ? '' : '/' + editingDest.rank}`;

    try {
      await apiClientmethod;
      const d = await apiClient.get('/api/destinations');
      setDestinations(d.data);
      setEditingDest(null);
    } catch (err) {
      console.error("SAVE_FAILED", err);
    }
  };

  const blockUser = (id) => {
    setUserList(userList.map(u => u.id === id ? { ...u, status: u.status === 'Blocked' ? 'Active' : 'Blocked' } : u));
  };

  const deleteUser = (id) => {
    if (window.confirm("PURGE_PROTOCOL: CONFIRM_USER_DELETION? This action is irreversible.")) {
      setUserList(userList.filter(u => u.id !== id));
    }
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

  // Check for Test Environment
  const isTestEnv = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
  const notificationMessage = isTestEnv ? "[TEST] environment active. Data is not reflective of the live [YAATRI] database." : null;

  if (loading) {
    return (
      <div className="admin-layout">
        <aside className="admin-sidebar"><div className="sidebar-brand">YAATRI_HUB</div></aside>
        <main className="admin-main">
          <header className="admin-header" />
          <div className="admin-content">
            <SkeletonLoader />
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <NotificationBar message={notificationMessage} />
      <Routes>
        <Route path="/" element={<AdminLayout user={loggedInUser} />}>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={
            <ErrorBoundary>
              <UserManager stats={stats} userList={userList} blockUser={blockUser} deleteUser={deleteUser} />
            </ErrorBoundary>
          } />
          <Route path="destinations" element={
            <ErrorBoundary>
              <DestinationManager 
                destinations={destinations}
                editingDest={editingDest}
                setEditingDest={setEditingDest}
                deleteDestination={deleteDestination}
                saveDestination={saveDestination}
                handleProtocolChange={handleProtocolChange}
                addProtocol={addProtocol}
              />
            </ErrorBoundary>
          } />
          <Route path="blogs" element={
            <ErrorBoundary>
              <BlogManager blogPosts={blogPosts} deletePost={deletePost} />
            </ErrorBoundary>
          } />
          <Route path="hotels" element={<ErrorBoundary><HotelManager /></ErrorBoundary>} />
          <Route path="guides" element={
            <ErrorBoundary>
              <GuideManager safetyConcerns={safetyConcerns} />
            </ErrorBoundary>
          } />
        </Route>
      </Routes>
    </>
  );
}