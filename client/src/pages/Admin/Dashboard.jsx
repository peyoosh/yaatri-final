import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Layout and Core Components
import AdminLayout from './AdminLayout';
import ErrorBoundary from './ErrorBoundary';
import SkeletonLoader from './SkeletonLoader';
import NotificationBar from './NotificationBar';

// Hub Components
import DestinationManager from './DestinationManager';
import UserManager from '../../UserManager';
import BlogManager from './BlogManager';
import GuideManager from './GuideManager';
import HotelManager from './HotelManager';

import './Dashboard.css';

// Setup Axios Global Interceptor
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://yaatri-backend.onrender.com/api';
const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [userList, setUserList] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [editingDest, setEditingDest] = useState(null);
  const [safetyConcerns] = useState([
    { id: 1, name: 'Suman Gurung', region: 'Khumbu Node', severity: 'High', log: 'Uplink failure during ascent.' },
    { id: 2, name: 'Rita Tamang', region: 'Mustang', severity: 'Low', log: 'Supply drop delay at node 04.' }
  ]);

  // SECURE CONFIG
  const loggedInUser = JSON.parse(localStorage.getItem('yaatri_user'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/auth?mode=login');
      return;
    }

    const loadAdminData = async () => {
      try {
        setLoading(true);
        const [s, d, b, u] = await Promise.all([
          apiClient.get('/api/admin/stats', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          apiClient.get('/api/destinations'),
          apiClient.get('/api/admin/blogs'),
          apiClient.get('/api/users')
        ]);

        setStats(prev => ({ ...prev, ...s.data }));
        setDestinations(d.data);
        setBlogPosts(b.data);
        setUserList(u.data);
      } catch (err) {
        console.error("ADMIN_AUTH_FAILED", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/auth?mode=login');
        }
      } finally {
        setLoading(false);
      }
    };
    loadAdminData();
  }, []); // Empty array ensures this only runs ONCE on mount

  const deletePost = async (id) => {
    await apiClient.delete(`/api/blogs/${id}`);
    setBlogPosts(blogPosts.filter(p => p._id !== id));
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
        <Route element={<AdminLayout user={loggedInUser} />}>
          <Route index element={<Navigate to="usermanagement" replace />} />
          <Route path="usermanagement" element={
            <ErrorBoundary>
              <UserManager stats={stats} userList={userList} blockUser={blockUser} deleteUser={deleteUser} />
            </ErrorBoundary>
          } />
          <Route path="destinationmanagement" element={
            <ErrorBoundary>
              <DestinationManager />
            </ErrorBoundary>
          } />
          <Route path="blogmanagement" element={
            <ErrorBoundary>
              <BlogManager blogPosts={blogPosts} deletePost={deletePost} />
            </ErrorBoundary>
          } />
          <Route path="hotelmanagement" element={<ErrorBoundary><HotelManager /></ErrorBoundary>} />
          <Route path="userguidemanagement" element={
            <ErrorBoundary>
              <GuideManager safetyConcerns={safetyConcerns} />
            </ErrorBoundary>
          } />
        </Route>
      </Routes>
    </>
  );
}