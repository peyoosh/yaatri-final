const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const { validateAdmin } = require('../middleware/authMiddleware');
const { deleteFromCloudinary } = require('../utils/cloudinary');

// GET: Fetch all blogs (published, reported, flagged) for Management Panel
router.get('/', validateAdmin, async (req, res) => {
  try {
    // Admin blog manager renders thumbnails in the table — opt back in to the heavy fields.
    const allBlogs = await Blog.find()
      .select('+image +images')
      .populate('authorId', 'username email')
      .sort({ timestamp: -1 })
      .lean();
    res.json(allBlogs || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH: Admin updating a blog's status (e.g., to publish it)
router.patch('/:id/status', validateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    // Basic validation for the status field
    if (!['pending', 'published', 'reported', 'flagged'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  } catch (err) { res.status(400).json({ error: err.message }); }
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

// DELETE: Admin specifically deleting a blog
router.delete('/:id', validateAdmin, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Delete associated images from Cloudinary
    if (blog.imagePublicId) {
      try {
        await deleteFromCloudinary(blog.imagePublicId);
      } catch (cloudinaryError) {
        console.warn('Failed to delete image from Cloudinary:', cloudinaryError);
        // Don't fail the blog deletion if image deletion fails
      }
    }

    // Delete additional images if any
    if (blog.imagesPublicIds && blog.imagesPublicIds.length > 0) {
      for (const publicId of blog.imagesPublicIds) {
        try {
          await deleteFromCloudinary(publicId);
        } catch (cloudinaryError) {
          console.warn(`Failed to delete additional image ${publicId} from Cloudinary:`, cloudinaryError);
        }
      }
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Blog and associated images deleted successfully' });
  } catch (err) {
    console.error('Blog deletion error:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;