import React, { useState, useEffect } from 'react';
import api from '../api/axios';
// import BlogCard from '../components/BlogCard'; 

const BlogPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state for publishing a new blog
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Fetch published blogs on component mount
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/blogs`);
      setBlogs(res.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching blogs:", err);
      setError("Failed to load blogs. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Handle submitting a new blog
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      setIsPublishing(true);
      const newBlogData = { title, content, images: [] };

      const res = await api.post(`/blogs`, newBlogData, {
        signal: controller.signal
      });

      await fetchBlogs();
      setTitle('');
      setContent('');
    } catch (err) {
      console.error('Error publishing blog:', err);
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') {
        alert('Blog post request timed out. Please retry with a smaller payload.');
      } else if (err.response?.status === 400) {
        alert(`Validation error: ${err.response.data?.error || 'Please check your fields.'}`);
      } else if (err.response?.status === 401) {
        alert('Unauthorized: Please log in to publish a blog.');
      } else {
        alert('Failed to publish the blog. Please try again later.');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading blogs...</p>
      </div>
    );
  }

  return (
    <div className="blog-page">
      <h1 className="page-title">Community Blogs</h1>

      {/* --- PUBLISH BLOG FORM --- */}
      <div className="publish-form-container">
        <h2>Write a new blog</h2>
        <form onSubmit={handleSubmit} className="publish-form">
          <input 
            type="text" 
            placeholder="Blog Title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
            className="form-input"
          />
          <textarea 
            placeholder="Share your travel experience..." 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            required 
            className="form-textarea"
          />
          <button type="submit" disabled={isPublishing} className="publish-button">
            {isPublishing ? 'Publishing...' : 'Publish Blog'}
          </button>
        </form>
      </div>

      {/* --- BLOG LIST & EMPTY STATE --- */}
      {error && <div className="error-message">{error}</div>}
      
      {blogs.length === 0 ? (
        <div className="empty-state">
          <h2 className="empty-state-title">No active trails found</h2>
          <p className="empty-state-text">Be the first to share your travel story!</p>
        </div>
      ) : (
        <div className="blog-list">
          {blogs.map(blog => (
             /* <BlogCard key={blog._id} data={blog} /> */
             <div key={blog._id} className="blog-item">
               {/* Displays the first uploaded image, or a Nepal default photo */}
               <img 
                 src={blog.images?.[0] || 'https://images.unsplash.com/photo-1623492701902-47dc207df5dc?w=800'} 
                 alt={blog.title || 'Nepal Travel Blog'} 
                 className="blog-item-image"
               />
               <h3>{blog.title || "Untitled Travel Story"}</h3>
               <p>{blog.content || "No description available"}</p>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogPage;