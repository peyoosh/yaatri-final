import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Destinations = ({ onSelectNode }) => {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'https://yaatri-final.onrender.com';

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/destinations`);
        // Map the backend fields to match the expected UI variables
        const mappedSectors = res.data.map((dest, index) => ({
          _id: dest._id,
          rank: (index + 1).toString().padStart(2, '0'),
          title: dest.name,
          stats: dest.description,
          image: dest.imageURL,
          region: dest.region
        }));
        setSectors(mappedSectors);
      } catch (err) {
        console.error("Error fetching destinations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDestinations();
  }, [API_URL]);

  const recommended = ["Langtang Valley", "Upper Mustang", "Rara Lake", "Shey Phoksundo"];

  return (
    <section className="destinations-split-layout">
      {/* LEFT COLUMN: 25% - CONTROL NODE */}
      <aside className="dest-sidebar">
        <div className="sidebar-group">
          <p className="sidebar-kicker">SYSTEM_SEARCH</p>
          <input 
            type="text" 
            placeholder="INPUT_DESTINATION_QUERY..." 
            className="yaatri-search-input"
          />
        </div>

        <div className="sidebar-group" style={{ marginTop: '3rem' }}>
          <p className="sidebar-kicker">RECOMMENDED_NODES</p>
          <ul className="recommended-list">
            {recommended.map((item, index) => (
              <li key={index} className="recommended-item">
                <span className="dot" /> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-footer">
          <p style={{ opacity: 0.3, fontSize: '0.6rem', fontFamily: 'monospace' }}>
            DATA_STREAM: ACTIVE<br/>
            ENCRYPTION: LALITPUR_V2
          </p>
        </div>
      </aside>

      {/* RIGHT COLUMN: 75% - RANKING ANALYSIS */}
      <main className="dest-rankings">
        <h2 className="vibrant-title" style={{ marginBottom: '2rem' }}>Terrain Rankings</h2>
        <div className="ranking-stack">
          {loading ? (
            <p style={{ color: 'var(--hill-green)', fontFamily: 'monospace' }}>SYSTEM_SYNCHRONIZING...</p>
          ) : sectors.length === 0 ? (
            <p style={{ color: 'var(--terai-harvest)', fontFamily: 'monospace' }}>ZERO_NODES_ACTIVE. POPULATE_VIA_ADMIN_PANEL.</p>
          ) : (
            sectors.map((sector, index) => (
              <div key={sector._id} className="rank-card" onClick={() => onSelectNode(sector)} style={{ cursor: 'pointer' }}>
                <div className="rank-badge">{(index + 1).toString().padStart(2, '0')}</div>
                <div className="rank-image" style={{ backgroundImage: `url(${sector.image})` }}>
                  <div className="rank-overlay" />
                </div>
                <div className="rank-content">
                  <p className="rank-region">{sector.region}</p>
                  <h3 className="rank-title">{sector.title}</h3>
                  <p className="rank-stats">{sector.stats?.substring(0, 60)}...</p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </section>
  );
};

export default Destinations;