import React from 'react';

const Contact = () => {
  return (
    <div className="view-container contact-node" style={{ padding: '4rem 10%', minHeight: '80vh' }}>
      <h2 className="vibrant-title">Contact Assistance</h2>
      <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', marginTop: '3rem' }}>
        <div className="info-block">
          <h3 style={{ color: 'var(--hill-green)', fontSize: '0.8rem', letterSpacing: '2px', fontWeight: '900' }}>WEBSITE_HOLDER</h3>
          <p style={{ marginTop: '1rem', fontWeight: '600' }}>YAATRI CORE SYSTEMS // Sector 4</p>
          <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Lead Node: Yaatri Core Administrator</p>
          <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Uplink: support@yaatri.np.system</p>
        </div>
        <div className="info-block">
          <h3 style={{ color: 'var(--hill-green)', fontSize: '0.8rem', letterSpacing: '2px', fontWeight: '900' }}>INQUIRY_EXAMPLES</h3>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', opacity: 0.6, fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <li>[ID_001] Terrain Scan Request - Khumbu</li>
            <li>[ID_042] Cultural Protocol Sync - Newari</li>
            <li>[ID_109] Pathfinding Calculation - Mustang</li>
          </ul>
        </div>
        <div className="info-block" style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
          <h3 style={{ color: 'var(--hill-green)', fontSize: '0.8rem', letterSpacing: '2px', fontWeight: '900' }}>ADDITIONAL_INTEL // LICENCE</h3>
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', opacity: 0.5, lineHeight: '1.6', maxWidth: '800px' }}>
            This system interface and all associated terrain mapping data are licensed under the YAATRI_V7_OPEN_INTEL_PROTOCOL. Commercial redistribution of localized research nodes without Sector verification is strictly prohibited. © 2024 RESEARCH_NODE_2431491.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;