// client/src/Destinations.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Destinations = ({ onSelectNode }) => {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic global uplink for the API
  const API_URL = import.meta.env.VITE_API_URL || 'https://yaatri-backend.onrender.com';

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('yaatri_token');
        const res = await axios.get(`${API_URL}/api/destinations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // We store the RAW data here. No double-mapping.
        setSectors(res.data);
      } catch (err) {
        console.error("DATA_STREAM_FAILURE:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDestinations();
  }, []); // Empty array because API_URL is static

  const recommended = ["Langtang Valley", "Upper Mustang", "Rara Lake", "Shey Phoksundo"];

  return (
    <section className="destinations-split-layout">
      {/* SIDEBAR REMAINS THE SAME */}
      <aside className="dest-sidebar">
        <div className="sidebar-group">
          <p className="sidebar-kicker">SYSTEM_SEARCH</p>
          <input type="text" placeholder="INPUT_DESTINATION_QUERY..." className="yaatri-search-input" />
        </div>
        <div className="sidebar-group" style={{ marginTop: '3rem' }}>
          <p className="sidebar-kicker">RECOMMENDED_NODES</p>
          <ul className="recommended-list">
            {recommended.map((item, index) => (
              <li key={index} className="recommended-item"><span className="dot" /> {item}</li>
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
        <h2 className="vibrant-title" style={{ marginBottom: '2rem' }}>Terrain Rankings</h2>
        <div className="ranking-stack">
          {loading ? (
            <p className="sidebar-kicker animate-pulse">SYSTEM_SYNCHRONIZING...</p>
          ) : sectors.length === 0 ? (
            <p className="sidebar-kicker">ZERO_NODES_ACTIVE. POPULATE_VIA_ADMIN_PANEL.</p>
          ) : (
            sectors.map((dest, index) => (
              <div 
                key={dest._id} 
                className="rank-card" 
                onClick={() => onSelectNode(dest)} 
                style={{ cursor: 'pointer' }}
              >
                {/* 1. Dynamic Rank Badge */}
                <div className="rank-badge">{(index + 1).toString().padStart(2, '0')}</div>
                
                {/* 2. Direct Field Mapping */}
                <div 
                  className="rank-image" 
                  style={{ backgroundImage: `url(${dest.imageURL})` }}
                >
                  <div className="rank-overlay" />
                </div>

                <div className="rank-content">
                  <p className="rank-region">{dest.region}</p>
                  <h3 className="rank-title">{dest.name}</h3>
                  <p className="rank-stats">
                    {dest.description ? `${dest.description.substring(0, 60)}...` : 'NO_DATA_PULLED'}
                  </p>
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