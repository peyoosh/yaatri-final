// client/src/Destinations.jsx
import React, { useState, useEffect, useContext } from 'react';
import { LayoutGrid, Map as MapIcon, Heart } from 'lucide-react';
import api from '../../api/axios';
import GoogleMapView from '../../components/Common/GoogleMapView';
import { AuthContext } from '../../context/AuthContext';

const Destinations = ({ onSelectNode }) => {
  const { user: authUser, setUser } = useContext(AuthContext);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [favBusyId, setFavBusyId] = useState(null);

  const favIds = (authUser?.profileData?.favoriteDestinations || []).map(String);

  // Server-side toggle: POST the destination id, backend decides push vs pull.
  // Keeps the source-of-truth on the server and avoids client/server array drift.
  const toggleFavorite = async (destId) => {
    if (!authUser) return;
    if (!destId || favBusyId) return;
    setFavBusyId(String(destId));
    const wasFav = favIds.includes(String(destId));

    // Optimistic UI flip.
    const optimisticNext = wasFav
      ? favIds.filter((x) => x !== String(destId))
      : [...favIds, String(destId)];
    setUser?.({
      ...authUser,
      profileData: { ...(authUser.profileData || {}), favoriteDestinations: optimisticNext },
    });

    try {
      const { data } = await api.put('/users/profile', { toggleFavoriteId: String(destId) });
      if (data && (data._id || data.user)) {
        const fresh = data.user || data;
        setUser?.(fresh);
      }
    } catch (err) {
      console.error('toggleFavorite failed:', err);
      // Roll back.
      setUser?.({
        ...authUser,
        profileData: { ...(authUser.profileData || {}), favoriteDestinations: favIds },
      });
    } finally {
      setFavBusyId(null);
    }
  };

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/destinations`);
        // We store the RAW data here. No double-mapping.
        setSectors(res.data);
      } catch (err) {
        console.error("DATA_STREAM_FAILURE:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  const recommended = ["Langtang Valley", "Upper Mustang", "Rara Lake", "Shey Phoksundo"];

  const handleRecommendedClick = (name) => {
    const dest = sectors.find(s => s?.name && s.name.toLowerCase() === name.toLowerCase());
    if (dest) {
      onSelectNode(dest);
    } else {
      alert(`${name} is not currently available in the system.`);
    }
  };

  const filteredSectors = sectors.filter(dest =>
    (dest?.name && dest.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (dest?.region && dest.region.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <section className="destinations-split-layout">
      {/* SIDEBAR REMAINS THE SAME */}
      <aside className="dest-sidebar">
        <div className="sidebar-group">
          <p className="sidebar-kicker">SYSTEM_SEARCH</p>
          <input 
            type="text" 
            placeholder="INPUT_DESTINATION_QUERY..." 
            className="yaatri-search-input" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="sidebar-group" style={{ marginTop: '3rem' }}>
          <p className="sidebar-kicker">RECOMMENDED_NODES</p>
          <ul className="recommended-list">
            {recommended.map((item, index) => (
              <li 
                key={index} 
                className="recommended-item" 
                onClick={() => handleRecommendedClick(item)}
                style={{ cursor: 'pointer' }}
              >
                <span className="dot" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="sidebar-footer">
          <p style={{ opacity: 0.3, fontSize: '0.6rem', fontFamily: 'monospace' }}>
            DATA_STREAM: ACTIVE<br/>ENCRYPTION: LALITPUR_V2
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT - THE FIX IS HERE */}
      <main className="dest-rankings">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <h2 className="vibrant-title" style={{ margin: 0 }}>Terrain Rankings</h2>
          <div style={{ display: 'inline-flex', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: 3, background: 'rgba(0,0,0,0.25)' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? '#A2D729' : 'transparent',
                color: viewMode === 'grid' ? '#0D0A02' : '#A6A180',
                border: 'none', borderRadius: 999, padding: '0.45rem 0.95rem', cursor: 'pointer',
                fontSize: '0.7rem', fontWeight: 800, letterSpacing: 1.5, display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <LayoutGrid size={13} /> GRID
            </button>
            <button
              onClick={() => setViewMode('map')}
              style={{
                background: viewMode === 'map' ? '#A2D729' : 'transparent',
                color: viewMode === 'map' ? '#0D0A02' : '#A6A180',
                border: 'none', borderRadius: 999, padding: '0.45rem 0.95rem', cursor: 'pointer',
                fontSize: '0.7rem', fontWeight: 800, letterSpacing: 1.5, display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <MapIcon size={13} /> MAP
            </button>
          </div>
        </div>

        {viewMode === 'map' ? (
          <div>
            {loading ? (
              <p className="sidebar-kicker animate-pulse">SYSTEM_SYNCHRONIZING...</p>
            ) : filteredSectors.length === 0 ? (
              <p className="sidebar-kicker">ZERO_NODES_ACTIVE. POPULATE_VIA_ADMIN_PANEL OR REVISE SEARCH.</p>
            ) : (
              <>
                <p style={{ fontSize: '0.7rem', opacity: 0.55, marginBottom: 10, letterSpacing: 1.5 }}>
                  {filteredSectors.length} destination{filteredSectors.length === 1 ? '' : 's'} plotted · click a pin to open its sector report
                </p>
                <GoogleMapView
                  destinations={filteredSectors}
                  height={560}
                  onMarkerClick={(dest) => onSelectNode(dest)}
                />
              </>
            )}
          </div>
        ) : (
        <div className="ranking-stack">
          {loading ? (
            <p className="sidebar-kicker animate-pulse">SYSTEM_SYNCHRONIZING...</p>
          ) : filteredSectors.length === 0 ? (
            <p className="sidebar-kicker">ZERO_NODES_ACTIVE. POPULATE_VIA_ADMIN_PANEL OR REVISE SEARCH.</p>
          ) : (
            filteredSectors.map((dest, index) => {
              // Force description to be an empty string if it comes back null from MongoDB
              const safeDescription = dest.description || "";
              // Check if backend applied a personalized score boost
              const isPersonalized = dest.personalizedScore !== undefined && dest.personalizedScore > (dest.popularityScore || 0);
              
              return (
              <div
                key={dest._id}
                className="rank-card"
                onClick={() => onSelectNode(dest)}
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                {/* HEART TOGGLE — top-right, stopPropagation so it doesn't open the detail view */}
                {authUser && (() => {
                  const isFav = favIds.includes(String(dest._id));
                  const busy = favBusyId === String(dest._id);
                  return (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(dest._id); }}
                      disabled={busy}
                      aria-label={isFav ? 'Remove from favourites' : 'Save to favourites'}
                      aria-pressed={isFav}
                      title={isFav ? 'Remove from favourites' : 'Save to favourites'}
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 5,
                        width: 36,
                        height: 36,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        borderRadius: '999px',
                        border: `1px solid ${isFav ? 'var(--toxic-lime, #A2D729)' : 'rgba(255,255,255,0.18)'}`,
                        background: isFav ? 'var(--toxic-lime, #A2D729)' : 'rgba(13,10,2,0.55)',
                        color: isFav ? '#0D0A02' : 'var(--toxic-lime, #A2D729)',
                        cursor: busy ? 'wait' : 'pointer',
                        backdropFilter: 'blur(6px)',
                        transition: 'transform 0.12s ease, background 0.2s ease',
                      }}
                      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
                      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <Heart size={15} fill={isFav ? '#0D0A02' : 'none'} strokeWidth={2.2} />
                    </button>
                  );
                })()}

                {/* 1. Dynamic Rank Badge */}
                <div className="rank-badge">{(index + 1).toString().padStart(2, '0')}</div>

                {/* 2. Direct Field Mapping */}
                <div
                  className="rank-image"
                  style={{ backgroundImage: `url(${dest.imageURL})` }}
                >
                  <div className="rank-overlay" />
                </div>

                <div className="rank-content relative">
                  <p className="rank-region flex items-center gap-2">
                    {dest.region}
                    {isPersonalized && (
                      <span className="text-[0.55rem] font-bold bg-toxic-lime/10 text-toxic-lime px-2 py-0.5 rounded uppercase tracking-widest border border-toxic-lime/30">
                        Top Match
                      </span>
                    )}
                  </p>
                  <h3 className="rank-title">{dest.name}</h3>
                  <p className="rank-stats">
                    {safeDescription ? `${safeDescription.substring(0, 60)}...` : 'NO_DATA_PULLED'}
                  </p>
                </div>
              </div>
            )})
          )}
        </div>
        )}
      </main>
    </section>
  );
};

export default Destinations;