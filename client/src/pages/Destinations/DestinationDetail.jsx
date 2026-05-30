import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import { Heart, Map, Bed, Compass, ChevronLeft, Mountain, Users, Wind, Camera, Calendar, Ticket, Star } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import GoogleMapView from '../../components/Common/GoogleMapView';
import { coordsForDestination } from '../../utils/loadGoogleMaps';

const DestinationDetail = ({ node, onBack, onSeeBlog }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser, setUser } = useContext(AuthContext);
  const [activeProtocol, setActiveProtocol] = useState(null);
  const [remoteNode, setRemoteNode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [regionBlogs, setRegionBlogs] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [favBusy, setFavBusy] = useState(false);
  const [reviewsData, setReviewsData] = useState(null); // { count, averageRating, reviews[] }

  const nodeToRender = node || remoteNode;
  const handleBackClick = () => {
    if (onBack) return onBack();
    navigate('/destinations');
  };

  // Derived: is this destination in the logged-in user's favourites?
  const favIds = (authUser?.profileData?.favoriteDestinations || []).map(String);
  const targetId = nodeToRender?._id || id;
  const isFavorite = !!targetId && favIds.includes(String(targetId));

  const handleToggleFavorite = async () => {
    if (!authUser) {
      navigate('/login');
      return;
    }
    if (!targetId || favBusy) return;
    setFavBusy(true);

    const prev = favIds;
    const next = isFavorite
      ? prev.filter((x) => String(x) !== String(targetId))
      : [...prev, String(targetId)];

    // Optimistic AuthContext update — UI flips instantly without waiting on the network.
    setUser?.({
      ...authUser,
      profileData: {
        ...(authUser.profileData || {}),
        favoriteDestinations: next,
      },
    });

    try {
      // Server-side toggle: send just the id, backend decides push vs pull. Avoids
      // race conditions when multiple favourite actions happen in quick succession.
      const { data } = await api.put('/users/profile', { toggleFavoriteId: String(targetId) });
      if (data && (data._id || data.user)) {
        const fresh = data.user || data;
        setUser?.(fresh);
      }
    } catch (err) {
      console.error('Failed to update favourites:', err);
      // Roll back on failure so the heart matches the server state.
      setUser?.({
        ...authUser,
        profileData: {
          ...(authUser.profileData || {}),
          favoriteDestinations: prev,
        },
      });
    } finally {
      setFavBusy(false);
    }
  };

  useEffect(() => {
    if (node || !id) return;

    const fetchDestination = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/destinations/${id}`);
        setRemoteNode(res.data);
        setFetchError(null);
      } catch (error) {
        console.error('Failed to load destination:', error);
        setFetchError('Could not load destination information.');
      } finally {
        setLoading(false);
      }
    };

    fetchDestination();
  }, [id, node]);

  // Pull public reviews for this destination — feeds the "Travelers say" block.
  useEffect(() => {
    const destId = nodeToRender?._id || id;
    if (!destId) return;
    let cancelled = false;
    api.get(`/destinations/${destId}/reviews`)
      .then(({ data }) => { if (!cancelled) setReviewsData(data); })
      .catch(() => { if (!cancelled) setReviewsData({ count: 0, averageRating: null, reviews: [] }); });
    return () => { cancelled = true; };
  }, [nodeToRender?._id, id]);

  // Pull all published blogs once, filter to those tagged with this destination's region.
  useEffect(() => {
    if (!nodeToRender?.region) return;

    const fetchRegionBlogs = async () => {
      try {
        setBlogsLoading(true);
        const res = await api.get('/blogs');
        const list = Array.isArray(res.data) ? res.data : [];
        const region = (nodeToRender.region || '').toLowerCase().trim();
        const matched = list.filter((post) => {
          const blogRegion = (post?.locationId?.region || '').toLowerCase().trim();
          return blogRegion && blogRegion === region;
        });
        setRegionBlogs(matched);
      } catch (err) {
        console.error('Failed to load region blogs:', err);
        setRegionBlogs([]);
      } finally {
        setBlogsLoading(false);
      }
    };

    fetchRegionBlogs();
  }, [nodeToRender?.region]);

  // Pull the logged-in user's bookings so we can compute personalized travel intel for this destination.
  useEffect(() => {
    if (!authUser) {
      setMyBookings([]);
      return;
    }
    let cancelled = false;
    setBookingsLoading(true);
    api.get('/bookings/me')
      .then(({ data }) => { if (!cancelled) setMyBookings(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setMyBookings([]); })
      .finally(() => { if (!cancelled) setBookingsLoading(false); });
    return () => { cancelled = true; };
  }, [authUser?._id]);

  if (loading) {
    return <div className="loading-container">Loading destination details...</div>;
  }

  if (fetchError) {
    return (
      <div className="error-page">
        <p>{fetchError}</p>
        <button onClick={handleBackClick}>Back to Destinations</button>
      </div>
    );
  }

  if (!nodeToRender) return null;

  // Fallback image when a blog has no uploaded picture
  const fallbackBlogImage = 'https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=400';

  const protocols = [
    { id: 'adventure', title: 'Adventure on foot', icon: Mountain, defaultDesc: 'Expert-led trekking modules with localized survival data specific to this node.' },
    { id: 'tradition', title: 'Living traditions', icon: Users, defaultDesc: 'Connect with heritage through neural-mapped cultural immersion protocols.' },
    { id: 'landscape', title: 'Landscape that moves', icon: Wind, defaultDesc: 'Dynamic topographic tracking optimized for shifting regional weather nodes.' },
    { id: 'tours', title: 'Guided Cultural Tours', icon: Camera, defaultDesc: 'Structured sector exploration focusing on historical and Newari lineage markers.' }
  ];

  const mockImages = [
    { id: 1, url: 'https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=600', author: '@trekker_88', likes: 342 },
    { id: 2, url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600', author: '@kathmandu_eyes', likes: 289 },
    { id: 3, url: 'https://images.unsplash.com/photo-1585016495481-91613a3ab1bc?w=600', author: '@himalayan_soul', likes: 412 }
  ];

  const mockGuides = [
    { id: 1, name: 'Pasang Sherpa', experience: '12 Years', rating: 4.9, language: 'English, Nepali, Sherpa' },
    { id: 2, name: 'Anil Gurung', experience: '8 Years', rating: 4.7, language: 'English, Nepali, Hindi' },
    { id: 3, name: 'Sita Tamang', experience: '5 Years', rating: 4.8, language: 'English, Nepali' }
  ];

  const handleBookNow = () => {
    if (!authUser) {
      navigate('/login');
      return;
    }
    const targetId = nodeToRender._id || id;
    if (!targetId) return;
    navigate(`/destinations/book/${targetId}`);
  };

  return (
    <>
      {/* FLOATING ACTION CLUSTER — top-right, stays visible during scroll */}
      <div
        style={{
          position: 'fixed',
          top: '7rem',
          right: '1.5rem',
          zIndex: 60,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}
      >
        {/* HEART TOGGLE — save / unsave to favourites */}
        <motion.button
          onClick={handleToggleFavorite}
          disabled={favBusy}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: favBusy ? 1 : 1.08 }}
          whileTap={{ scale: 0.92 }}
          title={
            !authUser
              ? 'Sign in to save favourites'
              : isFavorite
                ? 'Remove from favourites'
                : 'Save to favourites'
          }
          aria-label={isFavorite ? 'Remove from favourites' : 'Save to favourites'}
          aria-pressed={isFavorite}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 46,
            height: 46,
            padding: 0,
            background: isFavorite
              ? 'linear-gradient(135deg, rgba(162,215,41,0.95), rgba(5,157,114,0.85))'
              : 'rgba(13,10,2,0.85)',
            color: isFavorite ? '#0D0A02' : 'var(--toxic-lime, #A2D729)',
            border: `1px solid ${isFavorite ? '#A2D729' : 'rgba(162,215,41,0.4)'}`,
            borderRadius: '999px',
            cursor: favBusy ? 'wait' : 'pointer',
            boxShadow: isFavorite
              ? '0 8px 24px rgba(162,215,41,0.35)'
              : '0 6px 18px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(6px)',
            transition: 'all 0.2s ease',
          }}
        >
          <Heart
            size={18}
            fill={isFavorite ? '#0D0A02' : 'none'}
            strokeWidth={2}
          />
        </motion.button>

        {/* BOOK BUTTON */}
        <motion.button
          onClick={handleBookNow}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={authUser ? `Book a trip to ${nodeToRender.name || 'this destination'}` : 'Sign in to book'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.85rem 1.4rem',
            background: 'linear-gradient(135deg, #A2D729, #059D72)',
            color: '#0D0A02',
            border: 'none',
            borderRadius: '999px',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '0.85rem',
            letterSpacing: '0.5px',
            boxShadow: '0 10px 30px rgba(5,157,114,0.35), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          <Ticket size={16} />
          <span>Book this trip</span>
        </motion.button>
      </div>

      <section className="destinations-split-layout">
        {/* LEFT COLUMN: 25% - USER INTEL FEED */}
        <aside className="dest-sidebar" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 6rem)' }}>
          <button onClick={handleBackClick} style={{ background: 'none', border: 'none', color: 'var(--hill-green)', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginBottom: '2rem', fontWeight: 'bold', fontSize: '0.7rem' }}>
            <ChevronLeft size={14} /> BACK_TO_RANKINGS
          </button>

          <p className="sidebar-kicker">JOURNALS_FROM_{(nodeToRender.region || 'REGION').toUpperCase()}</p>

          {blogsLoading ? (
            <p style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '1rem' }}>Loading journals…</p>
          ) : regionBlogs.length === 0 ? (
            <p style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '1rem' }}>
              No journals posted from this region yet. Be the first to share.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {regionBlogs.map((post) => {
                const cover = post.image || (Array.isArray(post.images) && post.images[0]) || fallbackBlogImage;
                return (
                  <div
                    key={post._id}
                    onClick={() => onSeeBlog && onSeeBlog(post)}
                    className="intel-node-mini"
                    style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', padding: '10px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--hill-green)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)')}
                  >
                    <img
                      src={cover}
                      alt={post.title || 'Journal'}
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
                    />
                    <div style={{ padding: '10px 5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>
                        @{(post.authorId?.username || 'anon').toUpperCase()}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--hill-green)' }}>
                        <Heart size={12} fill="var(--hill-green)" />
                        <span style={{ fontSize: '0.65rem' }}>{post.likeCount || 0}</span>
                      </div>
                    </div>
                    {post.locationId?.name && (
                      <p style={{ padding: '0 5px 6px', fontSize: '0.6rem', opacity: 0.5, fontFamily: 'monospace' }}>
                        @ {post.locationId.name}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* RIGHT COLUMN: 75% - SECTOR ANALYSIS */}
        <main className="dest-rankings" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 6rem)' }}>
          <div style={{ position: 'relative', padding: '4rem 0' }}>
            <p className="rank-region">{nodeToRender.region}</p>
            <h2 className="vibrant-title" style={{ fontSize: '4rem', margin: '1rem 0' }}>{nodeToRender.name || nodeToRender.title}</h2>
            <p style={{ color: 'var(--terai-harvest)', fontSize: '1.1rem', maxWidth: '700px', lineHeight: '1.6' }}>
              Detailed analysis of coordinate node {nodeToRender.rank || (nodeToRender._id ? nodeToRender._id.substring(nodeToRender._id.length - 4) : 'XYZ')}. This sector represents the peak of high-altitude exploration in the Nepal system. 
              Topographic stability is currently rated at 94%.
            </p>

            {/* CONTENT GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', marginTop: '4rem' }}>
              
              {/* ACTIVITIES */}
              <div className="info-block">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--hill-green)', marginBottom: '1.5rem' }}>
                  <Compass size={20} />
                  <h3 style={{ fontSize: '0.8rem', letterSpacing: '3px', fontWeight: '900' }}>POSSIBLE_ACTIVITIES</h3>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, opacity: 0.8 }}>
                  <li style={{ marginBottom: '1rem' }}>
                    <strong style={{ display: 'block', color: 'var(--himalayan-mist)' }}>Base Camp Expedition</strong>
                    <span style={{ fontSize: '0.85rem' }}>12-day calculated trek route via Namche node.</span>
                  </li>
                  <li style={{ marginBottom: '1rem' }}>
                    <strong style={{ display: 'block', color: 'var(--himalayan-mist)' }}>Kala Patthar Summit</strong>
                    <span style={{ fontSize: '0.85rem' }}>Visual analysis point for 360° terrain mapping.</span>
                  </li>
                </ul>
              </div>

              {/* LOGISTICS */}
              <div className="info-block">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--hill-green)', marginBottom: '1.5rem' }}>
                  <Bed size={20} />
                  <h3 style={{ fontSize: '0.8rem', letterSpacing: '3px', fontWeight: '900' }}>LOCAL_LOGISTICS</h3>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, opacity: 0.8 }}>
                  <li style={{ marginBottom: '1rem' }}>
                    <strong style={{ display: 'block', color: 'var(--himalayan-mist)' }}>Everest View Hotel</strong>
                    <span style={{ fontSize: '0.85rem' }}>Highest oxygen-compressed lodging node.</span>
                  </li>
                  <li style={{ marginBottom: '1rem' }}>
                    <strong style={{ display: 'block', color: 'var(--himalayan-mist)' }}>Yeti Mountain Home</strong>
                    <span style={{ fontSize: '0.85rem' }}>Premium recovery station in Phakding sector.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* EXPERIENCE PROTOCOLS SECTOR */}
            <div style={{ marginTop: '5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--hill-green)', marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '0.8rem', letterSpacing: '3px', fontWeight: '900' }}>EXPERIENCE_PROTOCOLS</h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
                {protocols.map((proto) => {
                  const Icon = proto.icon;
                  const desc = nodeToRender.experienceProtocols?.[proto.id] || proto.defaultDesc;
                  return (
                    <div 
                      key={proto.id}
                      onClick={() => setActiveProtocol({ id: proto.id, title: proto.title, description: desc, icon: proto.icon })}
                      style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--hill-green)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                    >
                      <Icon size={20} style={{ color: 'var(--hill-green)', marginBottom: '1rem' }} />
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem' }}>{proto.title}</h4>
                      <p style={{ fontSize: '0.75rem', opacity: 0.6, lineHeight: '1.5' }}>
                        {desc.length > 80 ? desc.substring(0, 80) + '...' : desc}
                      </p>
                      <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--hill-green)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontWeight: 'bold' }}>READ MORE</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <span style={{ fontSize: '0.6rem', opacity: 0.3, fontFamily: 'monospace' }}>[ SECTOR_STATUS: ANALYZED ]</span>
              </div>
            </div>

            {/* ATTRACTIONS NEAR YOU — admin-curated micro-itineraries via DestinationManager. */}
            {Array.isArray(nodeToRender.activities) && nodeToRender.activities.length > 0 && (
              <div style={{ marginTop: '5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--hill-green)', marginBottom: '1.5rem' }}>
                  <Compass size={20} />
                  <h3 style={{ fontSize: '0.8rem', letterSpacing: '3px', fontWeight: '900' }}>ATTRACTIONS_NEAR_YOU</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                  {nodeToRender.activities.map((act, i) => (
                    <div
                      key={i}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 8,
                        padding: '1.1rem 1.2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--himalayan-mist, #F4F2F3)' }}>{act.title}</h4>
                      {act.description && (
                        <p style={{ fontSize: '0.78rem', opacity: 0.7, lineHeight: 1.5 }}>{act.description}</p>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '0.7rem', opacity: 0.55 }}>
                          {Number(act.durationHours || 0)}h
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--toxic-lime, #A2D729)' }}>
                          {Number(act.baseCostNPR) > 0 ? `NPR ${Number(act.baseCostNPR).toLocaleString('en-IN')}` : 'Free'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TRAVELERS SAY — public reviews submitted by travelers who completed this trip. */}
            {reviewsData && reviewsData.count > 0 && (
              <div style={{ marginTop: '5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--hill-green)' }}>
                    <Star size={20} />
                    <h3 style={{ fontSize: '0.8rem', letterSpacing: '3px', fontWeight: '900' }}>TRAVELERS_SAY</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} style={{ color: n <= Math.round(reviewsData.averageRating || 0) ? '#A2D729' : 'rgba(255,255,255,0.18)', fontSize: '1.1rem' }}>★</span>
                    ))}
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#A2D729', marginLeft: 4 }}>
                      {reviewsData.averageRating}
                    </span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                      ({reviewsData.count} review{reviewsData.count === 1 ? '' : 's'})
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {reviewsData.reviews.slice(0, 6).map((r) => (
                    <div
                      key={r._id}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 8,
                        padding: '1.1rem 1.2rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <span key={n} style={{ color: n <= r.rating ? '#A2D729' : 'rgba(255,255,255,0.15)', fontSize: '0.85rem' }}>★</span>
                          ))}
                        </div>
                        <span style={{ fontSize: '0.65rem', opacity: 0.5, fontFamily: 'monospace' }}>{r.tripSize}</span>
                      </div>
                      {r.comment && (
                        <p style={{ fontSize: '0.85rem', lineHeight: 1.55, color: 'var(--himalayan-mist, #F4F2F3)', fontStyle: 'italic', marginBottom: 8 }}>
                          &ldquo;{r.comment}&rdquo;
                        </p>
                      )}
                      <p style={{ fontSize: '0.7rem', opacity: 0.55, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                        — @{r.author} · {new Date(r.submittedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PROVIDER OVERVIEW SECTION */}
            <div style={{ marginTop: '5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--hill-green)', marginBottom: '1.5rem' }}>
                <Users size={20} />
                <h3 style={{ fontSize: '0.8rem', letterSpacing: '3px', fontWeight: '900' }}>PROVIDER_OVERVIEW</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ color: 'var(--terai-harvest)', marginBottom: '1rem', fontSize: '1rem' }}>Assigned Guides</h4>
                  {nodeToRender.assignedGuides && nodeToRender.assignedGuides.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {nodeToRender.assignedGuides.map(guide => {
                        const avgRating = (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1);
                        const isHigh = avgRating >= 4.5;
                        return (
                        <div key={guide._id || guide.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                          <div>
                            <span style={{ fontWeight: 'bold', display: 'block', color: 'var(--himalayan-mist)' }}>{guide.username}</span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{guide.profileData?.experience || 'Experienced Guide'}</span>
                          </div>
                          <div style={{ background: 'var(--obsidian)', color: isHigh ? '#A2D729' : 'var(--text-muted)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold', border: `1px solid ${isHigh ? '#A2D729' : 'var(--border-light-3)'}` }}>
                            ★ {avgRating} Avg
                          </div>
                        </div>
                      )})}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>No guides assigned to this node.</p>
                  )}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ color: 'var(--terai-harvest)', marginBottom: '1rem', fontSize: '1rem' }}>Assigned Hotels</h4>
                  {nodeToRender.assignedHotels && nodeToRender.assignedHotels.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {nodeToRender.assignedHotels.map(hotel => {
                        const avgRating = (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1);
                        const isHigh = avgRating >= 4.5;
                        return (
                        <div key={hotel._id || hotel.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                          <div>
                            <span style={{ fontWeight: 'bold', display: 'block', color: 'var(--himalayan-mist)' }}>{hotel.name}</span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{hotel.features?.join(', ') || 'Premium Lodging'} - ${hotel.basePrice}/night</span>
                          </div>
                          <div style={{ background: 'var(--obsidian)', color: isHigh ? '#A2D729' : 'var(--text-muted)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold', border: `1px solid ${isHigh ? '#A2D729' : 'var(--border-light-3)'}` }}>
                            ★ {avgRating} Avg
                          </div>
                        </div>
                      )})}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>No hotels assigned to this node.</p>
                  )}
                </div>

              </div>
            </div>

            {/* LIVE MAP — pin for this destination */}
            <div style={{ marginTop: '5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--hill-green)', marginBottom: '1.5rem' }}>
                <Map size={20} />
                <h3 style={{ fontSize: '0.8rem', letterSpacing: '3px', fontWeight: '900' }}>LOCATION_ON_MAP</h3>
                {(() => {
                  const c = coordsForDestination(nodeToRender);
                  const hasOwnCoords = Number.isFinite(Number(nodeToRender.latitude)) && Number.isFinite(Number(nodeToRender.longitude));
                  return (
                    <span style={{ fontSize: '0.55rem', opacity: 0.4, letterSpacing: 2, fontFamily: 'monospace', marginLeft: 8 }}>
                      {hasOwnCoords ? '// EXACT_COORDS' : '// REGION_FALLBACK'} · {c.lat.toFixed(3)}, {c.lng.toFixed(3)}
                    </span>
                  );
                })()}
              </div>

              <GoogleMapView
                destinations={[nodeToRender]}
                zoom={9}
                height={380}
                fitToMarkers={false}
              />
            </div>

            {/* CALCULATED ROUTES — personalized travel intel */}
            <div style={{ marginTop: '5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--hill-green)', marginBottom: '1.5rem' }}>
                <Map size={20} />
                <h3 style={{ fontSize: '0.8rem', letterSpacing: '3px', fontWeight: '900' }}>CALCULATED_ROUTES</h3>
                <span style={{ fontSize: '0.55rem', opacity: 0.4, letterSpacing: 2, fontFamily: 'monospace', marginLeft: 8 }}>// YOUR_TRAVEL_PROFILE</span>
              </div>

              <TravelIntelPanel
                authUser={authUser}
                destination={nodeToRender}
                bookings={myBookings}
                bookingsLoading={bookingsLoading}
                onNavigate={navigate}
              />
            </div>
          </div>
        </main>
      </section>

      {/* PROTOCOL MODAL */}
      {activeProtocol && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setActiveProtocol(null)}>
          <div style={{
            background: 'var(--obsidian)', border: '1px solid var(--hill-green)',
            padding: '3rem', maxWidth: '600px', width: '90%', borderRadius: '8px',
            position: 'relative', maxHeight: '90vh', overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setActiveProtocol(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}
            >
              &times;
            </button>
            <activeProtocol.icon size={40} style={{ color: 'var(--hill-green)', marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--hill-green)' }}>{activeProtocol.title}</h2>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--himalayan-mist)' }}>
              {activeProtocol.description}
            </p>

            {['adventure', 'tradition', 'landscape'].includes(activeProtocol.id) && (
              <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--hill-green)', marginBottom: '1rem' }}>Top Rated Visuals</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  {mockImages.map(img => (
                    <div key={img.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={img.url} alt="Location" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{img.author}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--hill-green)' }}>
                          <Heart size={10} fill="var(--hill-green)" />
                          <span style={{ fontSize: '0.7rem' }}>{img.likes}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeProtocol.id === 'tours' && (
              <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--hill-green)', marginBottom: '1rem' }}>Available Culture Guides</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {mockGuides.map(guide => (
                    <div key={guide.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--himalayan-mist)' }}>{guide.name}</h4>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.4rem', color: 'var(--text-muted)' }}>Experience: {guide.experience} • Languages: {guide.language}</p>
                      </div>
                      <div style={{ background: 'var(--hill-green)', color: 'var(--obsidian)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        ★ {guide.rating}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

/* ---------- TRAVEL INTEL PANEL ---------- */

const tokenize = (s) =>
  String(s || '')
    .toLowerCase()
    .split(/[\s,;/.|]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);

const TravelIntelPanel = ({ authUser, destination, bookings, bookingsLoading, onNavigate }) => {
  // Logged-out fallback
  if (!authUser) {
    return (
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 8,
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-muted, #A6A180)',
        }}
      >
        <p style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--himalayan-mist, #F4F2F3)' }}>
          Sign in to see how <strong>{destination?.name || 'this trail'}</strong> fits your travel profile.
        </p>
        <button
          onClick={() => onNavigate('/login')}
          style={{
            background: '#A2D729',
            color: '#0D0A02',
            border: 'none',
            padding: '0.6rem 1.4rem',
            borderRadius: 999,
            fontWeight: 800,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Sign in
        </button>
      </div>
    );
  }

  // ---- derive insights from real user data ----
  const preferenceTokens = tokenize(authUser.preferences);
  const tripHistory = Array.isArray(authUser.tripHistory) ? authUser.tripHistory : [];
  const favIds = (authUser.profileData?.favoriteDestinations || []).map(String);
  const isFav = destination?._id && favIds.includes(String(destination._id));

  // Match destination against the user's preference tokens
  const destText = `${destination?.name || ''} ${destination?.region || ''} ${destination?.terrainType || ''} ${destination?.description || ''}`.toLowerCase();
  const matchedPrefs = preferenceTokens.filter((t) => destText.includes(t));
  const matchScore = preferenceTokens.length
    ? Math.round((matchedPrefs.length / preferenceTokens.length) * 100)
    : null;

  // Past trips to this region / terrain
  const sameRegionTrips = tripHistory.filter((h) => {
    const text = `${h.dest || ''} ${h.hotel || ''} ${h.comment || ''}`.toLowerCase();
    return destination?.region && text.includes(String(destination.region).toLowerCase());
  });
  const himalayanCount = tripHistory.filter((h) => /himalaya|trek|summit|base camp|annapurna|everest|mustang|langtang/i.test(`${h.dest || ''} ${h.comment || ''}`)).length;

  // Bookings: ones for this destination specifically + aggregate stats
  const bookingsHere = bookings.filter((b) => String(b.destination?._id || b.destination) === String(destination?._id));
  const totalBookings = bookings.length;
  const totalSpend = bookings.reduce((sum, b) => sum + (b.pricing?.totalCost || 0), 0);

  // Most-used add-ons across the user's bookings (lets us highlight likely-needed ones for this trip)
  const addOnFreq = {};
  bookings.forEach((b) => {
    (b.pricing?.addOns || []).forEach((a) => { addOnFreq[a] = (addOnFreq[a] || 0) + 1; });
  });
  const topAddOns = Object.entries(addOnFreq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

  if (bookingsLoading) {
    return (
      <div style={{ padding: '2rem', fontSize: '0.85rem', opacity: 0.5 }}>
        Loading your travel profile…
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
        padding: '1.75rem',
      }}
    >
      {/* HEADER CARD — match score + status badges */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <p style={{ fontSize: '0.65rem', letterSpacing: 2, opacity: 0.55, textTransform: 'uppercase', marginBottom: 4 }}>
            For @{authUser.username}
          </p>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--himalayan-mist, #F4F2F3)' }}>
            How {destination?.name || 'this destination'} fits your journey
          </h4>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {isFav && (
            <span style={pill('#E63946')}>
              <Heart size={11} fill="#E63946" /> In your favourites
            </span>
          )}
          {bookingsHere.length > 0 && (
            <span style={pill('#A2D729')}>
              <Compass size={11} /> {bookingsHere.length} booking{bookingsHere.length > 1 ? 's' : ''} here
            </span>
          )}
          {matchScore !== null && (
            <span style={pill(matchScore >= 60 ? '#A2D729' : matchScore >= 30 ? '#F4A261' : '#A6A180')}>
              {matchScore}% preference match
            </span>
          )}
        </div>
      </div>

      {/* GRID — 3 columns of insight */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Preferred hikes / tags */}
        <IntelBlock title="Your preferred terrain" icon={Compass}>
          {preferenceTokens.length === 0 ? (
            <p style={emptyHint}>No preferences saved yet. Edit your profile to tag what you love.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {preferenceTokens.map((t) => {
                const hit = matchedPrefs.includes(t);
                return (
                  <span
                    key={t}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: hit ? 'rgba(162,215,41,0.18)' : 'rgba(255,255,255,0.04)',
                      color: hit ? '#A2D729' : '#A6A180',
                      border: `1px solid ${hit ? '#A2D729' : 'rgba(255,255,255,0.08)'}`,
                    }}
                    title={hit ? `Matches "${destination?.name}"` : 'No match for this destination'}
                  >
                    {t}
                  </span>
                );
              })}
            </div>
          )}
        </IntelBlock>

        {/* Travel history snapshot */}
        <IntelBlock title="Travel history" icon={Map}>
          {tripHistory.length === 0 && totalBookings === 0 ? (
            <p style={emptyHint}>
              No trip history yet. Booking here will be your first Yaatri journey.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {totalBookings > 0 && (
                <Stat label="Trips booked with Yaatri" value={`${totalBookings}`} />
              )}
              {totalSpend > 0 && (
                <Stat label="Lifetime spend" value={`NPR ${totalSpend.toLocaleString('en-IN')}`} />
              )}
              {sameRegionTrips.length > 0 && (
                <Stat label={`In ${destination?.region || 'this region'}`} value={`${sameRegionTrips.length} past trip${sameRegionTrips.length > 1 ? 's' : ''}`} />
              )}
              {himalayanCount > 0 && /himalaya/i.test(destination?.terrainType || '') && (
                <Stat label="Himalayan treks completed" value={`${himalayanCount}`} />
              )}
              {tripHistory.length > 0 && (
                <Stat label="Total entries logged" value={`${tripHistory.length}`} />
              )}
            </ul>
          )}
        </IntelBlock>

        {/* Recommended add-ons based on past behaviour */}
        <IntelBlock title="Likely add-ons for you" icon={Camera}>
          {topAddOns.length === 0 ? (
            <p style={emptyHint}>
              We&apos;ll learn what you like after your first booking. Defaults: <strong>guide</strong>, <strong>transport</strong>.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {topAddOns.map((a) => (
                <li key={a} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--himalayan-mist, #F4F2F3)', textTransform: 'capitalize' }}>{a.replace(/-/g, ' ')}</span>
                  <span style={{ color: '#A2D729', fontWeight: 800 }}>
                    {addOnFreq[a]}× used
                  </span>
                </li>
              ))}
            </ul>
          )}
        </IntelBlock>
      </div>

      {/* RECENT TRIPS FROM HISTORY — show actual entries if any */}
      {(sameRegionTrips.length > 0 || tripHistory.length > 0) && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: 2, color: '#A2D729', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>
            Recent journeys
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 10,
            }}
          >
            {(sameRegionTrips.length > 0 ? sameRegionTrips : tripHistory).slice(0, 4).map((h, i) => (
              <div
                key={h.id || i}
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 6,
                  padding: '0.85rem 1rem',
                }}
              >
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--himalayan-mist, #F4F2F3)' }}>
                  {h.dest || 'Destination'}
                </p>
                <p style={{ fontSize: '0.7rem', opacity: 0.55, marginTop: 4 }}>
                  {h.date || '—'} · {h.status || 'completed'}
                  {h.rating != null && <> · ★ {h.rating}</>}
                </p>
                {h.comment && (
                  <p style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: 6, fontStyle: 'italic', lineHeight: 1.4 }}>
                    &ldquo;{h.comment.length > 70 ? h.comment.slice(0, 67) + '…' : h.comment}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const pill = (color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 12px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${color}`,
  color,
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: 0.5,
  whiteSpace: 'nowrap',
});

const emptyHint = {
  fontSize: '0.75rem',
  opacity: 0.5,
  lineHeight: 1.5,
  margin: 0,
};

const IntelBlock = ({ title, icon: Icon, children }) => (
  <div
    style={{
      background: 'rgba(0,0,0,0.2)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 8,
      padding: '1rem 1.1rem',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      {Icon && <Icon size={13} style={{ color: '#A2D729' }} />}
      <p style={{ fontSize: '0.65rem', letterSpacing: 2, fontWeight: 800, color: '#A2D729', textTransform: 'uppercase' }}>
        {title}
      </p>
    </div>
    {children}
  </div>
);

const Stat = ({ label, value }) => (
  <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
    <span style={{ opacity: 0.7 }}>{label}</span>
    <span style={{ color: '#A2D729', fontWeight: 800 }}>{value}</span>
  </li>
);

export default DestinationDetail;
