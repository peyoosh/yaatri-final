import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Compass, MapPin, Star, Heart, Grid, Map as MapIcon, Timer, SlidersHorizontal } from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import GoogleMapView from '../../components/Common/GoogleMapView';

export default function Destinations() {
  const navigate = useNavigate();
  const { user: authUser, setUser } = useContext(AuthContext);

  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedTerrain, setSelectedTerrain] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [hoveredPin, setHoveredPin] = useState(null);
  const [favBusyId, setFavBusyId] = useState(null);

  const favIds = (authUser?.profileData?.favoriteDestinations || []).map(String);

  useEffect(() => {
    api.get('/destinations')
      .then(({ data }) => setDestinations(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleFavorite = async (destId) => {
    if (!authUser || favBusyId) return;
    setFavBusyId(String(destId));
    const wasFav = favIds.includes(String(destId));
    setUser?.({ ...authUser, profileData: { ...(authUser.profileData || {}), favoriteDestinations: wasFav ? favIds.filter(x => x !== String(destId)) : [...favIds, String(destId)] } });
    try {
      const { data } = await api.put('/users/profile', { toggleFavoriteId: String(destId) });
      if (data?._id || data?.user) setUser?.(data.user || data);
    } catch {
      setUser?.({ ...authUser, profileData: { ...(authUser.profileData || {}), favoriteDestinations: favIds } });
    } finally {
      setFavBusyId(null);
    }
  };

  const filtered = destinations.filter(d => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || (d.name || '').toLowerCase().includes(q) || (d.region || '').toLowerCase().includes(q) || (d.terrainType || '').toLowerCase().includes(q);
    const matchesTerrain = selectedTerrain === 'All' ||
      (selectedTerrain === 'Himalayan' && d.terrainType === 'Himalayan') ||
      (selectedTerrain === 'Hill' && d.terrainType === 'Hill') ||
      (selectedTerrain === 'Terai' && d.terrainType === 'Terai');
    const matchesDifficulty = selectedDifficulty === 'All' ||
      (selectedDifficulty === 'Easy' && (d.altitude || 0) < 2000) ||
      (selectedDifficulty === 'Moderate' && (d.altitude || 0) >= 2000 && (d.altitude || 0) < 3500) ||
      (selectedDifficulty === 'Challenging' && (d.altitude || 0) >= 3500);
    return matchesSearch && matchesTerrain && matchesDifficulty;
  });

  const resetFilters = () => { setSearchQuery(''); setSelectedDifficulty('All'); setSelectedTerrain('All'); };

  return (
    <div className="w-full min-h-screen bg-slate-50 pt-28 pb-20 px-6 lg:px-12 xl:px-20">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── SIDEBAR ── */}
        <aside className="lg:col-span-3 flex flex-col gap-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit sticky top-28">

          {/* Search */}
          <div>
            <label className="text-[10px] font-bold text-brand-pink uppercase tracking-widest block mb-3">
              Find your trek
            </label>
            <div className="relative border-b border-gray-200 pb-2 focus-within:border-brand-blue transition-colors flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Region, terrain, or name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-sm font-semibold text-brand-slate focus:outline-none placeholder-gray-400"
              />
            </div>
          </div>

          {/* Terrain filter */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Terrain Type</label>
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Himalayan', 'Hill', 'Terai'].map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTerrain(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    selectedTerrain === t ? 'bg-brand-blue text-white' : 'bg-slate-50 text-gray-600 hover:bg-slate-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty filter */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Difficulty</label>
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Easy', 'Moderate', 'Challenging'].map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDifficulty(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    selectedDifficulty === d ? 'bg-brand-blue text-white' : 'bg-slate-50 text-gray-600 hover:bg-slate-100'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Recommended quick-links */}
          <div>
            <label className="text-[10px] font-bold text-brand-saffron uppercase tracking-widest block mb-4">Popular right now</label>
            <div className="flex flex-col gap-3">
              {destinations.slice(0, 4).map(d => (
                <div
                  key={d._id}
                  onClick={() => navigate(`/destination/${d._id}`)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-brand-blue transition-colors cursor-pointer group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-pink group-hover:scale-125 transition-transform shrink-0" />
                  <span className="truncate">{d.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-50 pt-4 mt-2">
            <p className="text-[10px] text-gray-400 leading-relaxed">Every destination has been physically scouted. Guides assigned to each route are background-checked.</p>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="lg:col-span-9 flex flex-col gap-6">

          {/* Header row */}
          <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <h1 className="text-xl font-extrabold text-brand-slate tracking-tight">Verified Destinations</h1>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                {loading ? 'Loading destinations…' : `${filtered.length} destination${filtered.length !== 1 ? 's' : ''} match your filters`}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              {[{ mode: 'grid', Icon: Grid, label: 'Grid view' }, { mode: 'map', Icon: MapIcon, label: 'Nepal map' }].map(({ mode, Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    viewMode === mode ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-brand-blue'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="flex flex-col gap-6">
              {loading ? (
                Array(4).fill(null).map((_, i) => (
                  <div key={i} className="h-64 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                ))
              ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center gap-4">
                  <Compass className="w-12 h-12 text-gray-300 animate-spin" />
                  <div>
                    <h3 className="font-bold text-brand-slate text-base">No destinations match your filters</h3>
                    <p className="text-gray-400 text-xs mt-1">Try resetting your search or choosing another filter.</p>
                  </div>
                  <button onClick={resetFilters} className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-lg hover:bg-brand-blue/90 cursor-pointer">
                    Reset Filters
                  </button>
                </div>
              ) : (
                filtered.map((dest, index) => {
                  const isFav = favIds.includes(String(dest._id));
                  const busy = favBusyId === String(dest._id);
                  const rankNum = String(index + 1).padStart(2, '0');

                  return (
                    <motion.div
                      key={dest._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      whileHover={{ x: 8 }}
                      className="relative h-[280px] w-full rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:border-brand-blue/30 group cursor-pointer"
                      onClick={() => navigate(`/destination/${dest._id}`)}
                    >
                      {/* Background */}
                      <div className="absolute inset-0 z-0">
                        <img src={dest.imageURL} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.52) 50%, transparent 100%)' }} />
                      </div>

                      {/* Content */}
                      <div className="absolute inset-0 z-10 p-8 flex flex-col justify-between">
                        {/* Top row */}
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 bg-white/95 text-[10px] font-extrabold text-brand-pink rounded-full uppercase tracking-wider">
                            {dest.region}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); authUser ? toggleFavorite(dest._id) : navigate('/login'); }}
                            disabled={busy}
                            className="p-2.5 rounded-full bg-white/90 hover:bg-white text-gray-400 hover:text-brand-pink transition-all shadow-md cursor-pointer"
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-brand-pink text-brand-pink' : 'text-gray-400'}`} />
                          </button>
                        </div>

                        {/* Rank ghost number */}
                        <div className="absolute top-6 right-20 text-7xl font-extrabold text-white/10 select-none">{rankNum}</div>

                        {/* Bottom metadata */}
                        <div className="flex flex-col gap-2 max-w-xl">
                          <span className="text-[10px] font-bold text-brand-saffron uppercase tracking-widest">
                            RANK {rankNum} · {dest.terrainType}
                          </span>
                          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none group-hover:text-blue-300 transition-colors">
                            {dest.name}
                          </h2>
                          <p className="font-mono text-xs text-slate-300 line-clamp-2 mt-1">
                            {dest.description}
                          </p>
                          <div className="flex items-center gap-6 mt-2 text-xs font-semibold text-slate-400">
                            {dest.altitude && (
                              <span className="flex items-center gap-1">
                                <Compass className="w-3.5 h-3.5 text-brand-saffron" />
                                {dest.altitude}m alt
                              </span>
                            )}
                            <span className="text-brand-green font-bold">NPR 2,500/day</span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-brand-saffron fill-brand-saffron" />
                              {dest.popularityScore}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {/* MAP VIEW */}
          {viewMode === 'map' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-6"
            >
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <div>
                  <h3 className="text-base font-bold text-brand-slate">Interactive Expedition Pinboard</h3>
                  <p className="text-xs text-gray-400">Click a pin to open destination detail.</p>
                </div>
                <span className="px-2.5 py-1 bg-brand-blue/10 text-brand-blue font-bold text-[10px] uppercase rounded-lg">
                  GPS SYNC
                </span>
              </div>
              {loading ? (
                <div className="h-[500px] bg-slate-100 rounded-xl animate-pulse" />
              ) : (
                <GoogleMapView
                  destinations={filtered}
                  height={520}
                  onMarkerClick={(dest) => navigate(`/destination/${dest._id}`)}
                />
              )}
            </motion.div>
          )}

        </main>
      </div>
    </div>
  );
}
