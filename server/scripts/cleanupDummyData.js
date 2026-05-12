require('dotenv').config();
const mongoose = require('mongoose');
const Destination = require('../models/Destination');
const Blog = require('../models/Blog');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yaatri';

const dummyPattern = /(dummy|placeholder|test|lorem|example|sample)/i;

const connect = async () => {
  await mongoose.connect(MONGO_URI, { dbName: 'yaatri' });
  console.log('Connected to MongoDB for cleanup');
};

const cleanupDestinations = async () => {
  const candidates = await Destination.find({
    $or: [
      { name: dummyPattern },
      { region: dummyPattern },
      { description: dummyPattern }
    ]
  }).lean();

  if (!candidates.length) {
    console.log('No placeholder destinations found.');
    return;
  }

  console.log(`Found ${candidates.length} placeholder destinations:`);
  candidates.forEach(dest => console.log(`- ${dest.name} (${dest._id})`));
  await Destination.deleteMany({ _id: { $in: candidates.map(dest => dest._id) } });
  console.log('Deleted placeholder destinations.');
};

const cleanupBlogs = async () => {
  const candidates = await Blog.find({
    $or: [
      { title: dummyPattern },
      { content: dummyPattern },
      { locationNode: dummyPattern }
    ]
  }).lean();

  if (!candidates.length) {
    console.log('No placeholder blogs found.');
    return;
  }

  console.log(`Found ${candidates.length} placeholder blogs:`);
  candidates.forEach(blog => console.log(`- ${blog.title} (${blog._id})`));
  await Blog.deleteMany({ _id: { $in: candidates.map(blog => blog._id) } });
  console.log('Deleted placeholder blogs.');
};

const cleanupUsers = async () => {
  const candidates = await User.find({
    $or: [
      { username: dummyPattern },
      { email: dummyPattern },
      { bio: dummyPattern }
    ]
  }).lean();

  if (!candidates.length) {
    console.log('No placeholder users found.');
    return;
  }

  console.log(`Found ${candidates.length} placeholder users:`);
  candidates.forEach(user => console.log(`- ${user.username} (${user._id})`));
  await User.deleteMany({ _id: { $in: candidates.map(user => user._id) } });
  console.log('Deleted placeholder users.');
};

const runCleanup = async () => {
  try {
    await connect();
    await cleanupDestinations();
    await cleanupBlogs();
    await cleanupUsers();
  } catch (err) {
    console.error('Cleanup failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Cleanup complete.');
    process.exit(0);
  }
};

runCleanup();
