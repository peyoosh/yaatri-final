const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

// GET: Fetch all published blogs for the public feed
router.get('/', async (req, res) => {
  try {
    const publishedBlogs = await Blog.find({ status: 'published' })
      .populate('authorId', 'username') 
      .sort({ timestamp: -1 });
    res.json(publishedBlogs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST: Create a new blog
router.post('/', async (req, res) => {
  try {
    const { title, content, images, locationNode } = req.body;
    const newBlog = new Blog({
      title,
      content,
      authorId: req.user ? req.user._id : null, // If using auth middleware
      locationNode,
      images,
      status: 'published'
    });
    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH: Report a blog
router.patch('/:id/report', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    blog.reportCount += 1;
    
    if (blog.reportCount > 5) {
      blog.status = 'flagged';
    } else if (blog.status === 'published') {
      blog.status = 'reported';
    }
    
    await blog.save();
    res.json({ success: true, message: 'Blog reported successfully' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;