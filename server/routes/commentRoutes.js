const express = require('express');
const router = express.Router({ mergeParams: true }); // gives access to :blogId
const Comment = require('../models/Comment');
const Blog = require('../models/Blog');
const { protect } = require('../middleware/authMiddleware');

// GET /api/blogs/:blogId/comments
router.get('/', async (req, res) => {
  try {
    const comments = await Comment.find({ blogId: req.params.blogId })
      .populate('authorId', 'username')
      .sort({ createdAt: 1 })
      .lean();
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/blogs/:blogId/comments
router.post('/', protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId).select('_id status');
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    if (blog.status !== 'published') return res.status(403).json({ error: 'Cannot comment on unpublished posts' });

    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Comment cannot be empty' });
    if (text.length > 500) return res.status(400).json({ error: 'Comment too long (max 500 chars)' });

    const comment = await Comment.create({ blogId: req.params.blogId, authorId: req.user._id, text });
    const populated = await comment.populate('authorId', 'username');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/blogs/:blogId/comments/:commentId
router.delete('/:commentId', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const isAuthor = comment.authorId.equals(req.user._id);
    const isAdmin  = req.user.role === 'admin';
    if (!isAuthor && !isAdmin) return res.status(403).json({ error: 'Not authorized' });

    await comment.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
