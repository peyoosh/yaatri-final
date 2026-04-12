import React from 'react';

const Destinations = ({ onSelectNode }) => {
  const sectors = [
    { rank: '01', region: 'HIMALAYAN_SECTOR', title: 'Everest Khumbu Node', stats: '8,848M | ATMOS: STABLE', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200' },
    { rank: '02', region: 'HILL_SECTOR', title: 'Annapurna Circuit', stats: '5,416M | ATMOS: VARIABLE', image: 'https://images.unsplash.com/photo-1582234131908-769502909282?w=1200' },
    { rank: '03', region: 'TERAI_SECTOR', title: 'Chitwan Lowlands', stats: '415M | ATMOS: HUMID', image: 'https://images.unsplash.com/photo-1582650845100-3057102e3532?w=1200' }
  ];

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
          {sectors.map((sector) => (
            <div key={sector.rank} className="rank-card" onClick={() => onSelectNode(sector)} style={{ cursor: 'pointer' }}>
              <div className="rank-badge">{sector.rank}</div>
              <div className="rank-image" style={{ backgroundImage: `url(${sector.image})` }}>
                <div className="rank-overlay" />
              </div>
              <div className="rank-content">
                <p className="rank-region">{sector.region}</p>
                <h3 className="rank-title">{sector.title}</h3>
                <p className="rank-stats">{sector.stats}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </section>
  );
};

export default Destinations;