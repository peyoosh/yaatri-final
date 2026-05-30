import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Layout and Core Components
import AdminLayout from './AdminLayout';
import ErrorBoundary from './ErrorBoundary';
import SkeletonLoader from './SkeletonLoader';
import NotificationBar from './NotificationBar';

// Hub Components
import DestinationManager from './DestinationManager';
import UserManager from './UserManager';
import BlogManager from './BlogManager';
import GuideManager from './GuideManager';
import HotelManager from './HotelManager';
import DashboardOverview from './DashboardOverview';
import MessagesManager from './MessagesManager';
import BookingsManager from './BookingsManager';

import './Dashboard.css';
import api from '../../api/axios';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [userList, setUserList] = useState([]);
  const [blogList, setBlogList] = useState([]);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(true);
  const [safetyConcerns] = useState([
    { id: 1, name: 'Suman Gurung', region: 'Khumbu Node', severity: 'High', log: 'Uplink failure during ascent.' },
    { id: 2, name: 'Rita Tamang', region: 'Mustang', severity: 'Low', log: 'Supply drop delay at node 04.' }
  ]);

  // SECURE CONFIG (cached parse; gate rendered AFTER all hooks have run)
  const loggedInUser = (() => {
    try { return JSON.parse(localStorage.getItem('yaatri_user')); } catch { return null; }
  })();
  const isAdminUser = !!loggedInUser?.isAdmin;

  useEffect(() => {
    if (!isAdminUser) return; // Skip the admin data fetch if not an admin; render will redirect below.

    const token = localStorage.getItem('yaatri_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const loadAdminData = async () => {
      try {
        setLoading(true);
        // Use allSettled so if one fails, the others still succeed
        const [s, u, b] = await Promise.allSettled([
          api.get('/admin/stats'),
          api.get('/users'),
          api.get('/admin/blogs') // Fetch all blogs for the admin panel
        ]);

        if (s.status === 'fulfilled') setStats(prev => ({ ...prev, ...s.value.data }));
        if (u.status === 'fulfilled') setUserList(u.value.data);
        if (b.status === 'fulfilled') {
          setBlogList(b.value.data);
          setIsLoadingBlogs(false);
        } else {
          setIsLoadingBlogs(false);
        }
      } catch (err) {
        console.error("ADMIN_AUTH_FAILED", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    loadAdminData();
  }, [isAdminUser, navigate]);

  // Render-time gate — runs AFTER all hooks have been declared so the hook count stays stable.
  if (!isAdminUser) {
    return <Navigate to="/login" replace />;
  }

  const blockUser = async (id) => {
    const userToBlock = userList.find(u => u.id === id || u._id === id);
    if (!userToBlock) return;
    
    const newStatus = userToBlock.status === 'Blocked' ? 'Active' : 'Blocked';
    try {
      await api.patch(`/users/${id}/status`, { status: newStatus });
      setUserList(userList.map(u => (u.id === id || u._id === id) ? { ...u, status: newStatus } : u));
    } catch (err) {
      console.error("Error updating user status:", err);
      alert("Failed to update user status in the database.");
    }
  };

  const deleteUser = async (id) => {
    if (window.confirm("PURGE_PROTOCOL: CONFIRM_USER_DELETION? This action is irreversible.")) {
      try {
        await api.delete(`/users/${id}`);
        setUserList(userList.filter(u => u.id !== id && u._id !== id));
      } catch (err) {
        console.error("Error deleting user:", err);
        if (err.response && err.response.status === 404) {
          alert("User not found or already deleted.");
          setUserList(userList.filter(u => u.id !== id && u._id !== id));
        } else {
          alert("Failed to purge user from the database.");
        }
      }
    }
  };

  const updateUserRole = async (id, payload) => {
    try {
      const response = await api.patch(`/admin/users/${id}/role`, payload);
      setUserList(userList.map(u => (u.id === id || u._id === id) ? { ...u, ...response.data } : u));
    } catch (err) {
      console.error("Error updating user role:", err);
      throw err;
    }
  };

  const updateBlogStatus = async (id, newStatus) => {
    try {
      await api.patch(`/admin/blogs/${id}/status`, { status: newStatus });
      // Update the local state to reflect the change immediately
      setBlogList(blogList.map(b => (b._id === id) ? { ...b, status: newStatus } : b));
    } catch (err) {
      console.error("Error updating blog status:", err);
      alert("Failed to update blog status.");
    }
  };

  const deleteBlog = async (id) => {
    if (window.confirm("CONFIRM_DELETION: Are you sure you want to delete this blog post? This action cannot be undone.")) {
      try {
        await api.delete(`/admin/blogs/${id}`);
        setBlogList(blogList.filter(b => b._id !== id));
        alert("Blog deleted successfully.");
      } catch (err) {
        console.error("Error deleting blog:", err);
        if (err.response?.status === 404) {
          alert("Blog not found or already deleted.");
          setBlogList(blogList.filter(b => b._id !== id));
        } else {
          alert("Failed to delete blog from database.");
        }
      }
    }
  };

  // Check for Test Environment
  const isTestEnv = api.defaults.baseURL.includes('localhost') || api.defaults.baseURL.includes('127.0.0.1');
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
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={
            <ErrorBoundary>
              <DashboardOverview stats={stats} />
            </ErrorBoundary>
          } />
          <Route path="usermanagement" element={
            <ErrorBoundary>
              <UserManager userList={userList} blockUser={blockUser} deleteUser={deleteUser} updateUserRole={updateUserRole} />
            </ErrorBoundary>
          } />
          <Route path="destinationmanagement" element={
            <ErrorBoundary>
              <DestinationManager />
            </ErrorBoundary>
          } />
          <Route path="blogmanagement" element={
            <ErrorBoundary>
            <BlogManager blogList={blogList} updateBlogStatus={updateBlogStatus} deleteBlog={deleteBlog} loading={isLoadingBlogs} />
            </ErrorBoundary>
          } />
          <Route path="hotelmanagement" element={<ErrorBoundary><HotelManager /></ErrorBoundary>} />
          <Route path="userguidemanagement" element={
            <ErrorBoundary>
              <GuideManager safetyConcerns={safetyConcerns} />
            </ErrorBoundary>
          } />
          <Route path="messages" element={
            <ErrorBoundary>
              <MessagesManager />
            </ErrorBoundary>
          } />
          <Route path="bookings" element={
            <ErrorBoundary>
              <BookingsManager />
            </ErrorBoundary>
          } />
        </Route>
      </Routes>
    </>
  );
}