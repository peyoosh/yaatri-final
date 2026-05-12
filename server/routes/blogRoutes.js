const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const Destination = require('../models/Destination');
const { protect } = require('../middleware/authMiddleware');
const { blogSchema } = require('../validations/schemas');
const { deleteFromCloudinary } = require('../utils/cloudinary');

// GET: Fetch all published blogs for the public feed
router.get('/', async (req, res) => {
  try {
    const publishedBlogs = await Blog.find({ status: 'published' })
      .populate('authorId', 'username')
      .populate('locationId', 'name region')
      .populate('taggedHotels', 'name')
      .populate('taggedGuides', 'guideName')
      .sort({ timestamp: -1 })
      .lean();
    res.json(publishedBlogs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST: Create a new blog with Cloudinary URL
router.post('/', protect, async (req, res) => {
  try {
    // Extract and validate payload
    const { title, content, locationId, image, imagePublicId, taggedHotels, taggedGuides } = req.body;
    
    // Validate locationId references actual destination
    if (locationId) {
      const destinationExists = await Destination.findById(locationId);
      if (!destinationExists) {
        return res.status(400).json({ error: 'Selected destination does not exist' });
      }
    }

    const rawPayload = {
      title: title || 'Untitled Journey',
      content: content,
      locationNode: title || '',
      images: image ? [image] : []
    };

    // Validate with Zod
    const parsed = blogSchema.parse(rawPayload);

    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Extract public_id from Cloudinary URL if provided
    let extractedPublicId = '';
    if (image && image.includes('cloudinary.com')) {
      try {
        const urlParts = image.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && urlParts.length > uploadIndex + 2) {
          const versionAndId = urlParts[uploadIndex + 2]; // e.g., "v1234567890/yaatri-blogs/image.jpg"
          const idPart = versionAndId.split('/')[1]; // Remove version
          if (idPart) {
            extractedPublicId = `yaatri-blogs/${idPart.split('.')[0]}`; // Remove extension
          }
        }
      } catch (err) {
        console.warn('Failed to extract public_id from Cloudinary URL:', err);
      }
    }

    const newBlog = new Blog({
      title: parsed.title.trim(),
      content: parsed.content.trim(),
      authorId: req.user._id,
      locationNode: parsed.locationNode || '',
      locationId: locationId || null,
      image: image || '',
      imagePublicId: imagePublicId || extractedPublicId || '',
      images: [image] || [],
      imagesPublicIds: imagePublicId ? [imagePublicId] : extractedPublicId ? [extractedPublicId] : [],
      taggedHotels: taggedHotels || [],
      taggedGuides: taggedGuides || [],
      status: 'pending'
    });

    const savedBlog = await newBlog.save();
    const populatedBlog = await savedBlog
      .populate('authorId', 'username')
      .populate('locationId', 'name region')
      .populate('taggedHotels', 'name')
      .populate('taggedGuides', 'guideName');

    res.status(201).json(populatedBlog);
  } catch (err) {
    if (err.errors) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Blog creation error:', err);
    res.status(500).json({ error: err.message || 'Failed to create blog' });
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

    // Delete associated images from Cloudinary
    if (blog.imagePublicId) {
      try {
        await deleteFromCloudinary(blog.imagePublicId);
        console.log(`Deleted image ${blog.imagePublicId} from Cloudinary`);
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
          console.log(`Deleted additional image ${publicId} from Cloudinary`);
        } catch (cloudinaryError) {
          console.warn(`Failed to delete additional image ${publicId} from Cloudinary:`, cloudinaryError);
        }
      }
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;