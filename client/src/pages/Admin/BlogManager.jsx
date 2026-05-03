import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const BlogManager = () => {
  const [blogs, setBlogs] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const fetchBlogs = async () => {
    try {
      const response = await api.get(`/admin/blogs`);
      const fetchedData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setBlogs(fetchedData);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      showFeedback('error', 'FAILED_TO_FETCH_BLOGS');
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDelete = async (id) => {
    if (!id) {
      showFeedback('error', 'INVALID_BLOG_ID');
      return;
    }

    if (!window.confirm('WARNING: Are you sure you want to permanently purge this blog?')) return;
    
    try {
      await api.delete(`/admin/blogs/${id}`);
      showFeedback('success', 'BLOG_PURGED_SUCCESSFULLY');
      setBlogs((prev) => prev.filter(blog => blog._id !== id));
    } catch (error) {
      console.error('Error deleting blog:', error);
      if (error.response && error.response.status === 404) {
        showFeedback('error', 'BLOG_NOT_FOUND_OR_ALREADY_DELETED');
        setBlogs((prev) => prev.filter(blog => blog._id !== id));
      } else {
        showFeedback('error', 'ERROR_PURGING_BLOG');
      }
    }
  };

  const handleFlag = async (id) => {
    if (!window.confirm('Notice: Flagging this blog will hide it from the public feed.')) return;

    try {
      await api.patch(`/admin/blogs/${id}/flag`);
      showFeedback('success', 'BLOG_FLAGGED_SUCCESSFULLY');
      setBlogs((prev) => prev.map(blog => blog._id === id ? { ...blog, status: 'flagged' } : blog));
    } catch (error) {
      if (error.response && error.response.status === 404) {
        showFeedback('error', 'BLOG_NOT_FOUND');
      } else {
        showFeedback('error', 'ERROR_FLAGGING_BLOG');
      }
    }
  };

  return (
    <>
      <h2 className="page-title">BLOG_MODERATION_PANEL</h2>

      {feedback && (
        <div className={`notification-bar`} style={{ 
          marginBottom: '2rem', 
          borderRadius: '4px',
          backgroundColor: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: feedback.type === 'success' ? 'var(--hill-green)' : 'var(--danger-red)',
          border: `1px solid ${feedback.type === 'success' ? 'var(--hill-green)' : 'var(--danger-red)'}`
        }}>
          [SYSTEM_STATUS]: {feedback.text}
        </div>
      )}

      <section className="table-section">
        <h3 className="section-title">Active Intel Streams</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>TITLE</th>
                <th>AUTHOR</th>
                <th>STATUS</th>
                <th>DATE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {blogs.length > 0 ? (
                blogs.map((blog) => (
                  <tr key={blog._id}>
                    <td className="highlight-text">{blog.title}</td>
                    <td>
                      {blog.authorId?._id ? (
                        <Link to={`/profile/${blog.authorId._id}`} className="hover:text-toxic-lime hover:underline">
                          {blog.authorId.username}
                        </Link>
                      ) : (
                        'UNKNOWN'
                      )}
                    </td>
                    <td>
                      <span className={`severity-tag ${blog.status === 'published' ? 'low' : 'high'}`}>
                        {blog.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                    <td>{new Date(blog.timestamp).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      {blog.status === 'published' && (
                        <button onClick={() => handleFlag(blog._id)} className="action-btn warn">FLAG</button>
                      )}
                      <button onClick={() => handleDelete(blog._id)} className="action-btn danger bg-toxic-lime text-obsidian px-2 py-1 rounded">Delete Blog</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No blogs currently populated.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

export default BlogManager;
