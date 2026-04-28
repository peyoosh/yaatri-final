import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const DestinationManager = () => {
  const [destinations, setDestinations] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    description: '',
    imageURL: '',
    terrainType: 'Hill', // Default matching the Enum
    experienceProtocols: {
      adventure: '',
      tradition: '',
      landscape: '',
      tours: ''
    }
  });
  const [feedback, setFeedback] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('yaatri_token'); 
    return { Authorization: `Bearer ${token}` };
  };

  const fetchDestinations = async () => {
    try {
      const response = await api.get(`/destinations`);
      const fetchedData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setDestinations(fetchedData);
    } catch (error) {
      console.error('Error fetching destinations:', error);
      showFeedback('error', 'FAILED_TO_FETCH_NODES');
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleChange = (e) => {
    if (['adventure', 'tradition', 'landscape', 'tours'].includes(e.target.name)) {
      setFormData({
        ...formData,
        experienceProtocols: { ...formData.experienceProtocols, [e.target.name]: e.target.value }
      });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/destinations`, formData, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 201) {
        showFeedback('success', 'NODE_STORED_SUCCESSFULLY');
        setFormData({ 
          name: '', region: '', description: '', imageURL: '', terrainType: 'Hill',
          experienceProtocols: { adventure: '', tradition: '', landscape: '', tours: '' }
        });
        fetchDestinations();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'ERROR_STORING_NODE';
      showFeedback('error', errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('WARNING: Are you sure you want to permanently purge this node?')) return;
    
    try {
      await api.delete(`/destinations/${id}`, {
        headers: getAuthHeaders()
      });
      showFeedback('success', 'NODE_PURGED_SUCCESSFULLY');
      setDestinations((prev) => prev.filter(dest => dest._id !== id));
    } catch (error) {
      showFeedback('error', 'ERROR_PURGING_NODE');
    }
  };

  return (
    <>
      <h2 className="page-title">DESTINATION_HUB_MANAGER</h2>

      {feedback && (
        <div className={`notification-bar`} style={{ 
          marginBottom: '2rem', 
          borderRadius: '4px',
          backgroundColor: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: feedback.type === 'success' ? 'var(--hill-green)' : 'var(--danger-red)',
          border: `1px solid ${feedback.type === 'success' ? 'var(--hill-green)' : 'var(--danger-red)'}`
        }}>
          [SYSTEM_STATUS]: {feedback.text}
        </div>
      )}

      <section className="table-section destination-editor">
        <h3 className="section-title">Populate New Node</h3>
        <div className="table-wrapper" style={{ padding: '1.5rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Region</label>
                <input type="text" name="region" value={formData.region} onChange={handleChange} required />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required rows="3"></textarea>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Image URL</label>
                <input type="url" name="imageURL" value={formData.imageURL} onChange={handleChange} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Terrain Type</label>
                <select name="terrainType" value={formData.terrainType} onChange={handleChange} style={{ width: '100%', background: 'var(--border-light-1)', border: '1px solid var(--border-light-3)', color: 'var(--himalayan-mist)', padding: '10px 1rem', borderRadius: '4px', fontSize: '0.8rem', minHeight: '38px' }}>
                  <option value="Himalayan" style={{ background: 'var(--obsidian)' }}>Himalayan</option>
                  <option value="Hill" style={{ background: 'var(--obsidian)' }}>Hill</option>
                  <option value="Terai" style={{ background: 'var(--obsidian)' }}>Terai</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1', marginTop: '1rem', borderTop: '1px dashed var(--border-light-3)', paddingTop: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--hill-green)', marginBottom: '1rem' }}>Experience Protocols</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Adventure on Foot</label>
                    <textarea name="adventure" value={formData.experienceProtocols.adventure} onChange={handleChange} rows="2" placeholder="Expert-led trekking modules..."></textarea>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Living Traditions</label>
                    <textarea name="tradition" value={formData.experienceProtocols.tradition} onChange={handleChange} rows="2" placeholder="Connect with heritage..."></textarea>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Landscape that Moves</label>
                    <textarea name="landscape" value={formData.experienceProtocols.landscape} onChange={handleChange} rows="2" placeholder="Dynamic topographic tracking..."></textarea>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Guided Cultural Tours</label>
                    <textarea name="tours" value={formData.experienceProtocols.tours} onChange={handleChange} rows="2" placeholder="Structured sector exploration..."></textarea>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="action-btn info" style={{ border: '1px solid var(--hill-green)', padding: '0.5rem 1rem', borderRadius: '4px' }}>STORE_NODE</button>
            </div>
          </form>
        </div>
      </section>

      <section className="table-section">
        <h3 className="section-title">Active Destinations</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th>REGION</th>
                <th>TERRAIN</th>
                <th>SCORE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {destinations.length > 0 ? (
                destinations.map((dest) => (
                  <tr key={dest._id}>
                    <td className="highlight-text">{dest.name}</td>
                    <td>{dest.region}</td>
                    <td><span className="severity-tag low">{dest.terrainType}</span></td>
                    <td>{dest.popularityScore || 0}</td>
                    <td className="actions-cell">
                      <button onClick={() => handleDelete(dest._id)} className="action-btn danger">Delete Destination</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No nodes currently populated.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

export default DestinationManager;
