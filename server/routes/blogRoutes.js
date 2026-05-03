const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Blog = require('../models/Blog');
const { protect } = require('../middleware/authMiddleware');

// Multer config
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/'); // Make sure 'uploads' directory exists
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// GET: Fetch all published blogs for the public feed
router.get('/', async (req, res) => {
  try {
    const publishedBlogs = await Blog.find({ status: 'published' })
      .populate('authorId', 'username')
      .sort({ timestamp: -1 })
      .lean();
    res.json(publishedBlogs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST: Create a new blog
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { title, content, locationNode } = req.body;
    let imageUrl = '';
    if (req.file) {
      imageUrl = '/uploads/' + req.file.filename;
    }
    
    // Support either single image string or images array from body
    let images = req.body.images || [];
    if (typeof images === 'string') {
      try { images = JSON.parse(images); } catch(e) { images = [images]; }
    }

    const newBlog = new Blog({
      title,
      content,
      authorId: req.user._id, // Safely guaranteed by protect middleware
      locationNode,
      image: imageUrl,
      images,
      status: 'published'
    });
    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH: Report a blog
router.patch('/:id/report', protect, async (req, res) => {
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

// PATCH: Like a blog
router.patch('/:id/like', protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    blog.likeCount += 1;
    await blog.save();
    
    res.json({ success: true, likeCount: blog.likeCount });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE: Delete a blog
router.delete('/:id', protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    // Ensure only author can delete, optionally allow admin
    if ((!blog.authorId || blog.authorId.toString() !== req.user._id.toString()) && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this blog' });
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;