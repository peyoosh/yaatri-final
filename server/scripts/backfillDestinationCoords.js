/**
 * One-off: backfill `latitude` and `longitude` on Destination documents that
 * lack coordinates. Match is case-insensitive by `name`. Run via:
 *
 *   node server/scripts/backfillDestinationCoords.js
 *
 * Safe to re-run — it only touches docs where lat/lng are missing or zero.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
// Load referenced models first so the Destination pre('save') hook can resolve them via mongoose.model().
require('../models/User');
require('../models/Hotel');
const Destination = require('../models/Destination');

// Researched coordinates for known Yaatri destinations. Add new entries here
// when you create more destinations through the admin panel.
const COORDS_BY_NAME = {
  // Current live DB entries
  'mt everest':               { lat: 27.9881, lng: 86.9250 },
  'mount everest':            { lat: 27.9881, lng: 86.9250 },
  'badimalika':               { lat: 29.5333, lng: 81.4833 },
  'ghandruk':                 { lat: 28.3789, lng: 83.8056 },
  'langtang valley':          { lat: 28.2131, lng: 85.5631 },
  'upper mustang':            { lat: 29.1892, lng: 83.9737 },
  'rara lake':                { lat: 29.5347, lng: 82.0856 },
  'shey phoksundo lake':      { lat: 29.1947, lng: 82.9417 },
  'shey phoksundo':           { lat: 29.1947, lng: 82.9417 },

  // Original seed entries (kept so re-seeded DBs get backfilled too)
  'ghalegaun':                { lat: 28.2614, lng: 84.2961 },
  'pokhara':                  { lat: 28.2096, lng: 83.9856 },
  'kathmandu valley':         { lat: 27.7172, lng: 85.3240 },
  'everest base camp':        { lat: 28.0026, lng: 86.8528 },
  'chitwan national park':    { lat: 27.5291, lng: 84.3542 },
  'lumbini':                  { lat: 27.4833, lng: 83.2833 },
  'annapurna circuit':        { lat: 28.5970, lng: 84.1500 },

  // Other commonly-added Nepali destinations — pre-populated for convenience
  'bhaktapur':                { lat: 27.6710, lng: 85.4298 },
  'patan':                    { lat: 27.6644, lng: 85.3188 },
  'lalitpur':                 { lat: 27.6644, lng: 85.3188 },
  'nagarkot':                 { lat: 27.7167, lng: 85.5167 },
  'dhulikhel':                { lat: 27.6217, lng: 85.5448 },
  'gosaikunda':               { lat: 28.0833, lng: 85.4167 },
  'tilicho lake':             { lat: 28.6900, lng: 83.8517 },
  'manaslu':                  { lat: 28.5497, lng: 84.5594 },
  'kanchenjunga':             { lat: 27.7025, lng: 88.1475 },
  'ilam':                     { lat: 26.9094, lng: 87.9282 },
  'bandipur':                 { lat: 27.9343, lng: 84.4146 },
};

const main = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set — aborting.');
    process.exit(1);
  }

  console.log('[backfill] connecting to Mongo…');
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'yaatri' });
  console.log(`[backfill] connected to ${mongoose.connection.name}`);

  const all = await Destination.find({});
  console.log(`[backfill] inspecting ${all.length} destinations`);

  let updated = 0;
  let skippedAlreadyHas = 0;
  let skippedUnknown = 0;
  const unknown = [];

  for (const dest of all) {
    const hasCoords =
      Number.isFinite(dest.latitude) && Number.isFinite(dest.longitude) &&
      (dest.latitude !== 0 || dest.longitude !== 0);

    if (hasCoords) {
      skippedAlreadyHas++;
      continue;
    }

    const key = String(dest.name || '').toLowerCase().trim();
    const coords = COORDS_BY_NAME[key];

    if (!coords) {
      skippedUnknown++;
      unknown.push(dest.name);
      continue;
    }

    dest.latitude = coords.lat;
    dest.longitude = coords.lng;
    await dest.save();
    updated++;
    console.log(`  ✓ ${dest.name.padEnd(28)} → ${coords.lat}, ${coords.lng}`);
  }

  console.log('\n[backfill] summary');
  console.log(`  updated:                 ${updated}`);
  console.log(`  already had coords:      ${skippedAlreadyHas}`);
  console.log(`  unknown (no entry yet):  ${skippedUnknown}`);
  if (unknown.length) {
    console.log('  unknown names:');
    unknown.forEach((n) => console.log(`    - ${n}`));
    console.log('\n  Add these to COORDS_BY_NAME in this script and re-run.');
  }

  await mongoose.connection.close();
  console.log('[backfill] done.');
};

main().catch(async (err) => {
  console.error('[backfill] failed:', err.message);
  try { await mongoose.connection.close(); } catch (_) {}
  process.exit(1);
});
