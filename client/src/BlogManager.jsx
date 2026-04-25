import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BlogManager = () => {
  const [blogs, setBlogs] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://yaatri-backend.onrender.com/api';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchBlogs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/blogs`, {
        headers: getAuthHeaders()
      });
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
    if (!window.confirm('WARNING: Are you sure you want to permanently purge this blog?')) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/blogs/${id}`, {
        headers: getAuthHeaders()
      });
      showFeedback('success', 'BLOG_PURGED_SUCCESSFULLY');
      setBlogs((prev) => prev.filter(blog => blog._id !== id));
    } catch (error) {
      showFeedback('error', 'ERROR_PURGING_BLOG');
    }
  };

  const handleFlag = async (id) => {
    if (!window.confirm('Notice: Flagging this blog will hide it from the public feed.')) return;

    try {
      await axios.patch(`${API_BASE_URL}/admin/blogs/${id}/flag`, {}, {
        headers: getAuthHeaders()
      });
      showFeedback('success', 'BLOG_FLAGGED_SUCCESSFULLY');
      // Optimistically update the UI to show the blog as flagged
      setBlogs((prev) => prev.map(blog => blog._id === id ? { ...blog, status: 'flagged' } : blog));
    } catch (error) {
      showFeedback('error', 'ERROR_FLAGGING_BLOG');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-green-500 border-b border-green-800 pb-2">
          Blog Moderation Panel
        </h1>

        {feedback && (
          <div className={`mb-6 p-4 rounded border font-mono tracking-tight ${feedback.type === 'success' ? 'bg-green-900 border-green-500 text-green-100' : 'bg-red-900 border-red-500 text-red-100'}`}>
             [SYSTEM_STATUS]: {feedback.text}
          </div>
        )}

        <div className="bg-gray-900 p-6 rounded-lg border border-green-700 shadow-lg shadow-green-900/20">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Active Intel Streams</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800 text-gray-300">
                  <th className="border-b border-green-800 p-3">Title</th>
                  <th className="border-b border-green-800 p-3">Author</th>
                  <th className="border-b border-green-800 p-3">Status</th>
                  <th className="border-b border-green-800 p-3">Date</th>
                  <th className="border-b border-green-800 p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.length > 0 ? (
                  blogs.map((blog) => (
                    <tr key={blog._id} className="hover:bg-gray-800/50 transition duration-150">
                      <td className="border-b border-gray-800 p-3 font-medium text-gray-200">{blog.title}</td>
                      <td className="border-b border-gray-800 p-3 text-gray-400">{blog.authorId?.username || 'UNKNOWN'}</td>
                      <td className="border-b border-gray-800 p-3 text-gray-400">
                        <span className={`px-2 py-1 rounded text-xs border ${blog.status === 'published' ? 'bg-green-900/50 border-green-900 text-green-300' : 'bg-red-900/50 border-red-900 text-red-300'}`}>
                          {blog.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="border-b border-gray-800 p-3 text-gray-400">
                        {new Date(blog.timestamp).toLocaleDateString()}
                      </td>
                      <td className="border-b border-gray-800 p-3 text-right space-x-2">
                        {blog.status === 'published' && (
                          <button 
                            onClick={() => handleFlag(blog._id)} 
                            className="text-yellow-500 hover:text-yellow-400 text-sm font-semibold border border-yellow-800 hover:border-yellow-500 px-3 py-1 rounded transition duration-200 mr-2"
                          >
                            Flag
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(blog._id)} 
                          className="text-red-500 hover:text-red-400 text-sm font-semibold border border-red-800 hover:border-red-500 px-3 py-1 rounded transition duration-200"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-gray-500 italic">No blogs currently populated.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogManager;