import React from 'react';

const Planner = () => {
  return (
    <section className="planner-view">
      <div className="section-header">
        <p className="kicker">ITINERARY ENGINE</p>
        <h2 className="vibrant-title">Expedition Pathfinding</h2>
      </div>

      <div className="planner-interface" style={{
        background: 'rgba(15, 25, 30, 0.85)',
        border: '1px solid var(--himalayan-mist)',
        padding: '30px',
        backdropFilter: 'blur(12px)',
        marginTop: '2rem',
        borderRadius: '2px',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)'
      }}>
        <div style={{ color: 'var(--himalayan-mist)', fontSize: '0.7rem', marginBottom: '20px', opacity: 0.7, fontFamily: 'monospace' }}>
          [ SYSTEM_STATUS: ACTIVE ] // [ MODULE: PATH_GENERATOR_V1 ]
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          <div className="input-field">
            <label style={{ display: 'block', color: 'var(--hill-green)', fontSize: '0.65rem', marginBottom: '10px', letterSpacing: '1px', fontWeight: 'bold' }}>START_COORDINATES</label>
            <input 
              type="text" 
              placeholder="e.g. Kathmandu Hub" 
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', borderBottom: '1px solid var(--hill-green)', padding: '10px', color: '#fff', outline: 'none' }}
            />
          </div>
          
          <div className="input-field">
            <label style={{ display: 'block', color: 'var(--hill-green)', fontSize: '0.65rem', marginBottom: '10px', letterSpacing: '1px', fontWeight: 'bold' }}>DESTINATION_NODE</label>
            <input 
              type="text" 
              placeholder="e.g. Annapurna Base" 
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', borderBottom: '1px solid var(--hill-green)', padding: '10px', color: '#fff', outline: 'none' }}
            />
          </div>

          <div className="input-field">
            <label style={{ display: 'block', color: 'var(--hill-green)', fontSize: '0.65rem', marginBottom: '10px', letterSpacing: '1px', fontWeight: 'bold' }}>CYCLES_AVAILABLE</label>
            <input 
              type="number" 
              placeholder="Number of days" 
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', borderBottom: '1px solid var(--hill-green)', padding: '10px', color: '#fff', outline: 'none' }}
            />
          </div>

          <div className="input-field">
            <label style={{ display: 'block', color: 'var(--hill-green)', fontSize: '0.65rem', marginBottom: '10px', letterSpacing: '1px', fontWeight: 'bold' }}>COMPLEXITY_LEVEL</label>
            <select style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', borderBottom: '1px solid var(--hill-green)', padding: '10px', color: '#fff', outline: 'none' }}>
              <option value="leisure">Leisure / Cultural</option>
              <option value="moderate">Moderate / Trekking</option>
              <option value="high">Extreme / Expedition</option>
            </select>
          </div>
        </div>

        <button className="btn-primary" style={{ marginTop: '3rem', width: '100%', padding: '18px', fontWeight: 'bold', letterSpacing: '3px' }}>
          INITIALIZE_CALCULATION
        </button>
      </div>

      <div className="engine-logs" style={{ marginTop: '3rem', fontSize: '0.8rem', fontFamily: 'monospace' }}>
        <p style={{ color: '#666', marginBottom: '0.5rem', fontSize: '0.7rem' }}>DATA_STREAM:</p>
        <div style={{ color: 'var(--terai-harvest)', opacity: 0.9 }}>
          {">"} Analyzing topographic gradients... OK<br/>
          {">"} Syncing with regional weather nodes... OK<br/>
          {">"} Waiting for user parameters...
        </div>
      </div>
    </section>
  );
};

export default Planner;