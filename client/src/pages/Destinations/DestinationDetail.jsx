import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Heart, Star, MapPin, Compass, ShieldCheck, ChevronRight,
  X, Sparkles, HelpCircle, History, Map, Users, Mountain
} from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import GoogleMapView from '../../components/Common/GoogleMapView';

export default function DestinationDetail({ onSeeBlog }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser, setUser } = useContext(AuthContext);

  const [dest, setDest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [activeProtocol, setActiveProtocol] = useState(null);
  const [regionBlogs, setRegionBlogs] = useState([]);
  const [reviews, setReviews] = useState({ count: 0, averageRating: null, reviews: [] });
  const [myBookings, setMyBookings] = useState([]);
  const [favBusy, setFavBusy] = useState(false);

  const favIds = (authUser?.profileData?.favoriteDestinations || []).map(String);
  const isFav = !!id && favIds.includes(String(id));

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/destinations/${id}`)
      .then(({ data }) => { setDest(data); setFetchError(null); })
      .catch(() => setFetchError('Could not load destination.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.get(`/destinations/${id}/reviews`)
      .then(({ data }) => setReviews(data))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!dest?.region) return;
    api.get('/blogs').then(({ data }) => {
      const r = (dest.region || '').toLowerCase().trim();
      setRegionBlogs((data || []).filter(p => (p?.locationId?.region || '').toLowerCase().trim() === r));
    }).catch(() => {});
  }, [dest?.region]);

  useEffect(() => {
    if (!authUser) return;
    api.get('/bookings/me').then(({ data }) => setMyBookings(Array.isArray(data) ? data : [])).catch(() => {});
  }, [authUser?._id]);

  const handleToggleFavorite = async () => {
    if (!authUser) { navigate('/login'); return; }
    if (!id || favBusy) return;
    setFavBusy(true);
    const prev = favIds;
    setUser?.({ ...authUser, profileData: { ...(authUser.profileData || {}), favoriteDestinations: isFav ? prev.filter(x => x !== id) : [...prev, id] } });
    try {
      const { data } = await api.put('/users/profile', { toggleFavoriteId: id });
      if (data?._id || data?.user) setUser?.(data.user || data);
    } catch {
      setUser?.({ ...authUser, profileData: { ...(authUser.profileData || {}), favoriteDestinations: prev } });
    } finally { setFavBusy(false); }
  };

  const protocols = [
    { id: 'adventure', title: 'High Adventure', icon: '🏔️', description: 'Acclimatization tracking, glacier safety lines, private GPS checkpoints, and 24/7 satellite emergency monitoring.' },
    { id: 'tradition', title: 'Monastery Tradition', icon: '📿', description: 'Morning prayer schedules, cultural Sherpa community briefings, historical temple entries, and Newari cooking loops.' },
    { id: 'landscape', title: 'Landscape Wildlife', icon: '🦅', description: 'Botanical photography guides, rare mammal migration checklists, and dedicated avian sanctuary exploration maps.' },
    { id: 'tours', title: 'Helicopter Logistics', icon: '🚁', description: 'Direct Lukla/Namche private flight arrangements, custom baggage handling, and immediate mountain emergency air evacuation.' },
  ];

  if (loading) return (
    <div className="w-full min-h-screen bg-slate-50 pt-28 flex items-center justify-center">
      <div className="text-center flex flex-col items-center gap-3">
        <Compass className="w-10 h-10 text-brand-blue animate-spin" />
        <p className="text-sm font-semibold text-gray-400">Loading destination…</p>
      </div>
    </div>
  );

  if (fetchError || !dest) return (
    <div className="w-full min-h-screen bg-slate-50 pt-28 flex items-center justify-center px-6">
      <div className="text-center">
        <p className="font-bold text-brand-slate mb-4">{fetchError || 'Destination not found.'}</p>
        <button onClick={() => navigate('/destinations')} className="px-4 py-2 bg-brand-blue text-white text-sm font-bold rounded-xl cursor-pointer">
          Back to Destinations
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-slate-50 pt-28 pb-20 px-6 lg:px-12 xl:px-20">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="lg:col-span-3 flex flex-col gap-6">
          <button
            onClick={() => navigate('/destinations')}
            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-brand-blue transition-colors cursor-pointer group self-start"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            BACK TO RANKINGS
          </button>

          {/* Region journals */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
            <h3 className="text-[10px] font-bold text-brand-pink uppercase tracking-widest">
              JOURNALS_FROM_{(dest.region || 'REGION').replace(/\s+/g, '_').toUpperCase()}
            </h3>
            {regionBlogs.length === 0 ? (
              <p className="text-xs text-gray-400 font-medium">No journals from this region yet. Be the first!</p>
            ) : (
              <div className="flex flex-col gap-4">
                {regionBlogs.slice(0, 5).map(post => (
                  <div
                    key={post._id}
                    onClick={() => onSeeBlog && onSeeBlog(post)}
                    className="group cursor-pointer flex gap-3 items-center border-b border-slate-50 pb-3 last:border-0 last:pb-0"
                  >
                    <img src={post.image || 'https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=100'} alt={post.title} className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-brand-slate group-hover:text-brand-blue transition-colors line-clamp-1">{post.title}</h4>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">♥ {post.likeCount || 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="text-white p-5 rounded-2xl border border-slate-800 shadow-sm" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
            <span className="text-[9px] font-bold text-brand-saffron uppercase tracking-widest block mb-2">QUICK STATS</span>
            <div className="flex flex-col gap-3 font-mono text-xs text-slate-300">
              {dest.altitude && (
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span>ALTITUDE:</span>
                  <span className="text-white font-bold">{dest.altitude}m</span>
                </div>
              )}
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>TERRAIN:</span>
                <span className="text-white font-bold">{dest.terrainType}</span>
              </div>
              <div className="flex justify-between">
                <span>POPULARITY:</span>
                <span className="text-white font-bold">{dest.popularityScore}%</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="lg:col-span-9 flex flex-col gap-8">

          {/* Hero banner */}
          <div className="relative h-[420px] rounded-3xl overflow-hidden shadow-md">
            <img src={dest.imageURL} alt={dest.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0f172a 0%, rgba(15,23,42,0.45) 55%, transparent 100%)' }} />

            <div className="absolute bottom-8 left-8 right-8 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="px-3.5 py-1 rounded-full bg-brand-blue/30 backdrop-blur-sm border border-brand-blue/30 text-xs font-bold uppercase tracking-wider text-white">
                  {dest.region}
                </span>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-3 leading-tight max-w-2xl">
                  {dest.name}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleFavorite}
                  disabled={favBusy}
                  className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-brand-pink transition-all shadow-md cursor-pointer"
                >
                  <Heart className={`w-5 h-5 ${isFav ? 'fill-brand-pink text-brand-pink' : 'text-white'}`} />
                </button>
                <button
                  onClick={() => authUser ? navigate(`/destinations/book/${dest._id}`) : navigate('/login')}
                  className="px-6 py-3.5 bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-blue/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Book this trip
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Expedition Context</h3>
            <p className="text-slate-700 text-base leading-relaxed font-medium">{dest.description}</p>
          </div>

          {/* Activities + Logistics grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-xs font-bold text-brand-blue uppercase tracking-widest mb-4">POSSIBLE_ACTIVITIES</h3>
              <div className="flex flex-col gap-3">
                {(dest.activities?.length > 0 ? dest.activities : [
                  { title: 'Base Camp Expedition' },
                  { title: 'Kala Patthar Summit' },
                ]).map((act, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="w-6 h-6 rounded-lg bg-brand-blue/10 text-brand-blue text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-brand-slate">{act.title}</span>
                      {act.baseCostNPR > 0 && (
                        <span className="text-[10px] text-brand-green font-bold ml-2">NPR {act.baseCostNPR.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-xs font-bold text-brand-saffron uppercase tracking-widest mb-4">LOCAL_LOGISTICS</h3>
              {dest.assignedHotels?.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {dest.assignedHotels.map(hotel => (
                    <div key={hotel._id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <Link to={`/profile/${hotel.userId?._id || hotel.userId || hotel._id}`} className="text-xs font-bold text-brand-slate hover:text-brand-blue transition-colors">
                          {hotel.name} ↗
                        </Link>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{hotel.features?.slice(0, 2).join(' · ') || 'Premium lodging'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-brand-green">NPR {(hotel.basePrice || 0).toLocaleString('en-IN')}</p>
                        <p className="text-[9px] text-gray-400">per night</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No hotels assigned yet.</p>
              )}
            </div>
          </div>

          {/* Experience protocols */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">EXPERIENCE_PROTOCOLS</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {protocols.map(p => (
                <div
                  key={p.id}
                  onClick={() => setActiveProtocol(p.id)}
                  className="p-5 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-brand-blue/30 hover:shadow-md transition-all cursor-pointer text-center flex flex-col gap-2 group"
                >
                  <span className="text-2xl block group-hover:scale-110 transition-transform">{p.icon}</span>
                  <h4 className="text-xs font-bold text-brand-slate">{p.title}</h4>
                  <span className="text-[10px] text-brand-blue font-bold">Inspect →</span>
                </div>
              ))}
            </div>
          </div>

          {/* Provider overview */}
          {dest.assignedGuides?.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-xs font-bold text-brand-pink uppercase tracking-widest mb-4">PROVIDER_OVERVIEW</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dest.assignedGuides.map(guide => (
                  <div
                    key={guide._id}
                    onClick={() => navigate(`/profile/${guide._id}`)}
                    className="p-4 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-100 flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-brand-blue/10 text-brand-blue font-bold text-lg flex items-center justify-center border-2 border-brand-blue/20">
                        {(guide.username || 'G').slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-brand-slate group-hover:text-brand-pink">@{guide.username}</h4>
                          <span className="px-1.5 py-0.5 bg-brand-green/10 text-brand-green text-[8px] font-bold rounded">VERIFIED</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-semibold mt-1">
                          {guide.profileData?.ratePerDay ? `NPR ${guide.profileData.ratePerDay.toLocaleString('en-IN')} / day` : 'Certified local guide'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-pink" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Travelers say */}
          {reviews.count > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
                <div>
                  <h3 className="text-xs font-bold text-brand-blue uppercase tracking-widest">TRAVELERS_SAY</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Direct verified logs from the trail</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-saffron/10 text-brand-saffron font-bold text-xs rounded-lg">
                  <Star className="w-4 h-4 fill-brand-saffron text-brand-saffron" />
                  <span>{reviews.averageRating} / 5.0 Rating</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.reviews.slice(0, 4).map(r => (
                  <div key={r._id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-slate">@{r.author}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: Math.round(r.rating) }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-brand-saffron text-brand-saffron" />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-xs text-gray-600 font-medium leading-relaxed italic">"{r.comment}"</p>
                    )}
                    <span className="text-[9px] text-gray-400 font-bold self-end uppercase">{r.tripSize}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TravelIntel panel */}
          <div className="relative rounded-3xl overflow-hidden shadow-md" style={{ padding: 1, background: 'linear-gradient(to right, #2563EB, #DB2777, #F59E0B)' }}>
            <div className="bg-white p-6 rounded-[23px] overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-5 h-5 text-brand-blue animate-pulse shrink-0" />
                  <h3 className="text-sm font-bold text-brand-slate uppercase tracking-wider truncate">TravelIntel Personalized Dashboard</h3>
                </div>
                <span className="text-[9px] font-mono text-gray-400 shrink-0 hidden sm:block">LIVE_RECOMMENDATIONS</span>
              </div>

              {!authUser ? (
                <div className="py-6 flex flex-col items-center text-center gap-3">
                  <HelpCircle className="w-10 h-10 text-gray-300" />
                  <div>
                    <h4 className="font-bold text-xs text-brand-slate">Sign in to unlock personalized routing</h4>
                    <p className="text-[11px] text-gray-400 max-w-xs mt-1">We analyze your fitness preference, previous trip altitude limits, and past add-ons to customize booking choices.</p>
                  </div>
                  <button onClick={() => navigate('/login')} className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-lg mt-2 cursor-pointer">
                    Unlock TravelIntel →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 flex flex-col gap-4">
                    <p className="text-xs text-gray-600 font-medium">
                      Welcome back, <strong className="text-brand-blue">@{authUser.username}</strong>! Based on your traveler profile, here is your customized route recommendation:
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="px-2.5 py-1 bg-brand-blue/10 border border-brand-blue/20 text-[10px] font-bold text-brand-blue rounded-full">
                        {dest.altitude ? `Altitude: ${dest.altitude}m` : 'Route Verified'}
                      </span>
                      <span className="px-2.5 py-1 bg-brand-pink/10 border border-brand-pink/20 text-[10px] font-bold text-brand-pink rounded-full">
                        {dest.terrainType} Terrain
                      </span>
                      <span className="px-2.5 py-1 bg-brand-green/10 border border-brand-green/20 text-[10px] font-bold text-brand-green rounded-full">
                        Escrow-backed booking available
                      </span>
                    </div>
                    {myBookings.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <History className="w-3.5 h-3.5 text-brand-saffron" />
                          Your Yaatri Journey Stats
                        </h4>
                        <ul className="text-xs text-gray-500 font-medium space-y-1.5 mt-2 list-disc pl-4">
                          <li>You have <strong className="text-brand-slate">{myBookings.length}</strong> trip{myBookings.length !== 1 ? 's' : ''} booked with Yaatri.</li>
                          {myBookings.some(b => String(b.destination?._id) === id) && (
                            <li>You have an <strong className="text-brand-blue">existing booking</strong> for this destination.</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-1 bg-slate-900 rounded-2xl p-4 text-white flex flex-col justify-between min-h-[140px] border border-slate-800">
                    <span className="text-[8px] font-mono text-gray-500">TERRAIN TOPOGRAPHY</span>
                    <div className="flex flex-col gap-1 mt-2">
                      <p className="text-xs font-bold">{dest.terrainType} Zone</p>
                      <p className="text-[10px] text-brand-pink font-semibold">Nepal Grid Coordinates</p>
                      {dest.latitude && dest.longitude && (
                        <p className="font-mono text-[9px] text-gray-400">{dest.latitude.toFixed(3)}°N {dest.longitude.toFixed(3)}°E</p>
                      )}
                    </div>
                    {dest.altitude && (
                      <div className="text-right border-t border-slate-800 pt-2 mt-2">
                        <p className="text-lg font-bold text-brand-green">{dest.altitude}m</p>
                        <p className="text-[8px] text-gray-400">ACCLIMATIZATION REQUIRED</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-brand-blue" />
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">LOCATION_ON_MAP</h3>
              </div>
              <span className="font-mono text-[9px] text-gray-400">
                {dest.latitude && dest.longitude ? `${dest.latitude.toFixed(3)}, ${dest.longitude.toFixed(3)}` : 'REGION_FALLBACK'}
              </span>
            </div>
            <GoogleMapView destinations={[dest]} zoom={9} height={340} fitToMarkers={false} />
          </div>

        </main>
      </div>

      {/* Protocol modal */}
      <AnimatePresence>
        {activeProtocol && (() => {
          const prot = protocols.find(p => p.id === activeProtocol);
          if (!prot) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => setActiveProtocol(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full relative border border-slate-100 shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <button onClick={() => setActiveProtocol(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
                <span className="text-4xl block mb-4">{prot.icon}</span>
                <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">EXPEDITION PROTOCOL</span>
                <h3 className="text-xl font-bold text-brand-slate mt-1 mb-4">{prot.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium">{prot.description}</p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-2 mb-6">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-slate">
                    <ShieldCheck className="w-4 h-4 text-brand-green" />
                    <span>Lalitpur HQ Certified Safe</span>
                  </div>
                  <p className="text-[10px] text-gray-400">All local guides are audited and tracked via radio frequencies and digital logs during active stages.</p>
                </div>
                <button
                  onClick={() => setActiveProtocol(null)}
                  className="w-full py-3 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Confirm Understanding
                </button>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
