const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const Destination = require('../models/Destination');
const { protect } = require('../middleware/authMiddleware');
const { blogSchema } = require('../validations/schemas');
// Cloudinary helper removed — images are stored inline as Base64 on the Blog doc now.
// Legacy blogs may still hold Cloudinary public IDs — `deleteFromCloudinary` is retained for the DELETE path only.
// New blogs store their image as a Base64 data URL directly on the document.

// GET: Fetch all published blogs for the public feed
router.get('/', async (req, res) => {
  try {
    // Blog.image/images are schema-level select:false (heavy Base64 fields). The public
    // feed renders cover thumbnails, so opt them back in explicitly here.
    const publishedBlogs = await Blog.find({ status: 'published' })
      .select('+image +images')
      .populate('authorId', 'username')
      .populate('locationId', 'name region')
      .populate('taggedHotels', 'name')
      .populate('taggedGuides', 'guideName')
      .sort({ timestamp: -1 })
      .lean();
    res.json(publishedBlogs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST: Create a new blog. Image is sent inline as a Base64 data URL in the JSON body.
router.post('/', protect, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { title, content, locationId, taggedHotels, taggedGuides, image } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (locationId) {
      const destinationExists = await Destination.findById(locationId);
      if (!destinationExists) {
        return res.status(400).json({ message: 'Selected destination does not exist' });
      }
    }

    // Light sanity-check on the Base64 payload — accept either a data URL or empty/missing.
    let safeImage = '';
    if (typeof image === 'string' && image.trim().length > 0) {
      if (!/^data:image\/(png|jpe?g|webp|gif);base64,/.test(image)) {
        return res.status(400).json({ message: 'image must be a base64-encoded data URL (data:image/...;base64,...)' });
      }
      safeImage = image;
    }

    // Zod still validates the text portion of the payload.
    const parsed = blogSchema.parse({
      title: title || 'Untitled Journey',
      content: content || '',
      locationNode: title || '',
      images: []
    });

    const normalizeTagField = (value, fieldName) => {
      if (value === undefined || value === null || value === '') return [];
      if (Array.isArray(value)) return value;
      try {
        const parsedValue = JSON.parse(value);
        if (!Array.isArray(parsedValue)) throw new Error(`${fieldName} must be an array`);
        return parsedValue;
      } catch (e) {
        const err = new Error(`${fieldName} payload is malformed: ${e.message}`);
        err.statusCode = 400;
        throw err;
      }
    };

    let parsedTaggedHotels;
    let parsedTaggedGuides;
    try {
      parsedTaggedHotels = normalizeTagField(taggedHotels, 'taggedHotels');
      parsedTaggedGuides = normalizeTagField(taggedGuides, 'taggedGuides');
    } catch (tagErr) {
      return res.status(400).json({ message: tagErr.message });
    }

    const newBlog = new Blog({
      title: parsed.title.trim(),
      content: parsed.content.trim(),
      authorId: req.user._id,
      locationNode: parsed.locationNode || '',
      locationId: locationId || null,
      image: safeImage,
      taggedHotels: parsedTaggedHotels,
      taggedGuides: parsedTaggedGuides,
      status: 'pending'
    });

    const savedBlog = await newBlog.save();
    const populatedBlog = await Blog.findById(savedBlog._id)
      .select('+image +images')
      .populate('authorId', 'username')
      .populate('locationId', 'name region')
      .populate('taggedHotels', 'name')
      .populate('taggedGuides', 'guideName');

    return res.status(201).json(populatedBlog);
  } catch (err) {
    // Zod and Mongoose validation errors → 400 with a *specific* message so the user knows what to fix.
    if (err && err.name === 'ZodError') {
      // Zod v4 exposes `issues`; v3 exposes `errors`. Support both.
      const list = Array.isArray(err.issues) ? err.issues : (Array.isArray(err.errors) ? err.errors : []);
      const first = list[0];
      const fieldPath = first?.path?.join('.') || 'payload';
      const detail = first?.message || 'Blog validation failed';
      return res.status(400).json({ message: `${fieldPath}: ${detail}`, details: list });
    }
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    console.error('Blog creation error:', err);
    return res.status(400).json({ message: err.message || 'Failed to create blog' });
  }
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

// PATCH: Toggle like — one like per user, toggles on/off
router.patch('/:id/like', protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    const userId = req.user._id;
    const alreadyLiked = blog.likedBy.some(id => id.equals(userId));

    if (alreadyLiked) {
      blog.likedBy.pull(userId);
      blog.likeCount = Math.max(0, blog.likeCount - 1);
    } else {
      blog.likedBy.addToSet(userId);
      blog.likeCount += 1;
    }

    await blog.save();
    res.json({ success: true, likeCount: blog.likeCount, liked: !alreadyLiked });
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

    // Inline Base64 images vanish with the doc itself — nothing else to clean up.
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;