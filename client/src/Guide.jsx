import React from 'react';

const Guide = () => {
  return (
    <section className="guide-view">
      <div className="section-header">
        <p className="kicker">LOCAL INTELLIGENCE</p>
        <h2 className="vibrant-title">Assistance Node</h2>
      </div>

      <div className="guide-interface" style={{
        background: 'rgba(15, 25, 30, 0.85)',
        border: '1px solid var(--himalayan-mist)',
        padding: '30px',
        backdropFilter: 'blur(12px)',
        marginTop: '2rem',
        borderRadius: '2px',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)'
      }}>
        <div style={{ color: 'var(--himalayan-mist)', fontSize: '0.7rem', marginBottom: '20px', opacity: 0.7, fontFamily: 'monospace' }}>
          [ CONNECTION: ENCRYPTED ] // [ SOURCE: LALITPUR_STUDIO ]
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div className="guide-card" style={{ borderLeft: '2px solid var(--hill-green)', paddingLeft: '20px' }}>
            <h4 style={{ color: 'var(--hill-green)', marginBottom: '10px', fontSize: '0.8rem', letterSpacing: '1px' }}>REAL-TIME TRANSLATION</h4>
            <p style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: '1.4' }}>Access neural-mapped dialect databases for remote Himalayan regions.</p>
          </div>
          
          <div className="guide-card" style={{ borderLeft: '2px solid var(--hill-green)', paddingLeft: '20px' }}>
            <h4 style={{ color: 'var(--hill-green)', marginBottom: '10px', fontSize: '0.8rem', letterSpacing: '1px' }}>CULTURAL PROTOCOLS</h4>
            <p style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: '1.4' }}>Retrieve etiquette logs for localized nodes and religious sanctuaries.</p>
          </div>

          <div className="guide-card" style={{ borderLeft: '2px solid var(--hill-green)', paddingLeft: '20px' }}>
            <h4 style={{ color: 'var(--hill-green)', marginBottom: '10px', fontSize: '0.8rem', letterSpacing: '1px' }}>EMERGENCY BEACON</h4>
            <p style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: '1.4' }}>Direct uplink to nearest rescue coordination centers and medical outposts.</p>
          </div>
        </div>

        <button className="btn-primary" style={{ marginTop: '3rem', width: '100%', padding: '18px', fontWeight: 'bold', letterSpacing: '3px' }}>
          ACTIVATE_ASSISTANT
        </button>
      </div>

      <div className="terminal-output" style={{ marginTop: '3rem', fontSize: '0.8rem', fontFamily: 'monospace' }}>
        <p style={{ color: '#666', marginBottom: '0.5rem', fontSize: '0.7rem' }}>UPLINK_STATUS:</p>
        <div style={{ color: 'var(--terai-harvest)', opacity: 0.9 }}>
          {">"} Establishing satellite handshake... OK<br/>
          {">"} Buffering regional dialect packs... OK<br/>
          {">"} Connection established with Lalitpur studio.<br/>
          {">"} Node ready for queries.
        </div>
      </div>
    </section>
  );
};

export default Guide;