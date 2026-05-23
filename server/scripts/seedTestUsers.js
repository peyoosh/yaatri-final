// Creates 20 demo accounts: test1..test20, password "1234567890".
// Safe to re-run — uses upsert keyed on username, so duplicates won't blow up
// the unique constraint. Run via:
//
//   node server/scripts/seedTestUsers.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load referenced models for any hooks that resolve refs.
require('../models/Hotel');
require('../models/Destination');
const User = require('../models/User');

const COUNT = 20;
const PASSWORD = '1234567890';

const main = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set — aborting.');
    process.exit(1);
  }

  console.log('[seed-test-users] connecting to mongo…');
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'yaatri' });
  console.log('[seed-test-users] connected to', mongoose.connection.name);

  const hashed = await bcrypt.hash(PASSWORD, 10);

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (let i = 1; i <= COUNT; i++) {
    const username = `test${i}`;
    const email = `test${i}@yaatri.local`;
    const phoneNumber = `980000${String(i).padStart(4, '0')}`; // 9800000001 … 9800000020

    try {
      const existing = await User.findOne({ username });
      if (existing) {
        // Update password to match the canonical demo password (in case it drifted).
        existing.password = hashed;
        existing.email = existing.email || email;
        existing.phoneNumber = existing.phoneNumber || phoneNumber;
        await existing.save();
        updated++;
        console.log(`  ↻ updated ${username}`);
      } else {
        await User.create({
          username,
          email,
          phoneNumber,
          password: hashed,
          role: 'user',
          isAdmin: false,
          bio: `Demo account ${i}`,
          preferences: 'Adventure, Nature',
        });
        created++;
        console.log(`  ✓ created ${username}  (${email}, ${phoneNumber})`);
      }
    } catch (err) {
      failed++;
      console.error(`  ✗ ${username} failed:`, err.message);
    }
  }

  console.log('\n[seed-test-users] summary');
  console.log(`  created: ${created}`);
  console.log(`  updated: ${updated}`);
  console.log(`  failed:  ${failed}`);
  console.log(`\n  Credentials for every account:`);
  console.log(`    username: test1 … test${COUNT}`);
  console.log(`    password: ${PASSWORD}`);

  await mongoose.connection.close();
  console.log('[seed-test-users] done.');
};

main().catch(async (err) => {
  console.error('[seed-test-users] failed:', err);
  try { await mongoose.connection.close(); } catch (_) {}
  process.exit(1);
});
