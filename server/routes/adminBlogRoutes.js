const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const { validateAdmin } = require('../middleware/authMiddleware');

// GET: Fetch all blogs (published, reported, flagged) for Management Panel
router.get('/', validateAdmin, async (req, res) => {
  try {
    const allBlogs = await Blog.find()
      .populate('authorId', 'username email')
      .sort({ timestamp: -1 });
    res.json(allBlogs || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH: Admin specifically flagging a blog
router.patch('/:id/flag', validateAdmin, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id, 
      { status: 'flagged' }, 
      { new: true }
    );
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;