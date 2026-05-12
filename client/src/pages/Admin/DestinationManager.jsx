import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import SearchableSelect from '../../components/Common/SearchableSelect';

const DestinationManager = () => {
  const [destinations, setDestinations] = useState([]);
  const [availableGuides, setAvailableGuides] = useState([]);
  const [availableHotels, setAvailableHotels] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  // Loading states
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(true);
  const [isLoadingGuides, setIsLoadingGuides] = useState(true);
  const [isLoadingHotels, setIsLoadingHotels] = useState(true);
  
  const [editingId, setEditingId] = useState(null);
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
    },
    assignedGuides: [],
    assignedHotels: []
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

  const fetchProviders = async () => {
    try {
      setIsLoadingGuides(true);
      setIsLoadingHotels(true);
      const headers = getAuthHeaders();
      const [guidesRes, hotelsRes] = await Promise.all([
        api.get('/guides'), // Fetch Guide profile objects
        api.get('/hotels') // Fetch actual Hotel structures
      ]);
      setAvailableGuides(guidesRes.data);
      setAvailableHotels(hotelsRes.data);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setIsLoadingGuides(false);
      setIsLoadingHotels(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
    fetchProviders();
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

  const handleEdit = (dest) => {
    setEditingId(dest._id);
    setFormData({
      name: dest.name || '',
      region: dest.region || '',
      description: dest.description || '',
      imageURL: dest.imageURL || '',
      terrainType: dest.terrainType || 'Hill',
      experienceProtocols: {
        adventure: dest.experienceProtocols?.adventure || '',
        tradition: dest.experienceProtocols?.tradition || '',
        landscape: dest.experienceProtocols?.landscape || '',
        tours: dest.experienceProtocols?.tours || ''
      },
      assignedGuides: dest.assignedGuides ? dest.assignedGuides.map(g => g._id || g) : [],
      assignedHotels: dest.assignedHotels ? dest.assignedHotels.map(h => h._id || h) : []
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const response = await api.put(`/destinations/${editingId}`, formData, {
          headers: getAuthHeaders()
        });
        if (response.status === 200) {
          showFeedback('success', 'NODE_UPDATED_SUCCESSFULLY');
          setEditingId(null);
          setShowForm(false);
          setFormData({ 
            name: '', region: '', description: '', imageURL: '', terrainType: 'Hill',
            experienceProtocols: { adventure: '', tradition: '', landscape: '', tours: '' },
            assignedGuides: [], assignedHotels: []
          });
          fetchDestinations();
        }
      } else {
        const response = await api.post(`/destinations`, formData, {
          headers: getAuthHeaders()
        });
        
        if (response.status === 201) {
          showFeedback('success', 'NODE_STORED_SUCCESSFULLY');
          setShowForm(false);
          setFormData({ 
            name: '', region: '', description: '', imageURL: '', terrainType: 'Hill',
            experienceProtocols: { adventure: '', tradition: '', landscape: '', tours: '' },
            assignedGuides: [], assignedHotels: []
          });
          fetchDestinations();
        }
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

      {!showForm && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-start', gap: '1rem' }}>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({ 
                name: '', region: '', description: '', imageURL: '', terrainType: 'Hill',
                experienceProtocols: { adventure: '', tradition: '', landscape: '', tours: '' },
                assignedGuides: [], assignedHotels: []
              });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{
              backgroundColor: '#A2D729',
              color: '#000',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              fontFamily: "'Poppins', sans-serif"
            }}
          >
            + ADD DESTINATION
          </button>
        </div>
      )}

      {showForm && (
        <section className="table-section destination-editor">
          <h3 className="section-title">{editingId ? 'EDIT DESTINATION' : 'ADD NEW DESTINATION'}</h3>
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
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--hill-green)', marginBottom: '1rem' }}>Provider Assignments</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Link Guides</label>
                      <SearchableSelect
                        options={availableGuides}
                        value={formData.assignedGuides}
                        onChange={(newValue) => setFormData({ ...formData, assignedGuides: newValue })}
                        placeholder="Search and select guides..."
                        displayKey="guideName"
                        valueKey="_id"
                        loading={isLoadingGuides}
                        renderOption={(guide) => (
                          <span className="text-white text-sm">
                            {guide.guideName}
                            {guide.userId && (
                              <span className="text-white/60 ml-2">({guide.userId.username})</span>
                            )}
                          </span>
                        )}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Link Hotels</label>
                      <SearchableSelect
                        options={availableHotels}
                        value={formData.assignedHotels}
                        onChange={(newValue) => setFormData({ ...formData, assignedHotels: newValue })}
                        placeholder="Search and select hotels..."
                        displayKey="name"
                        valueKey="_id"
                        loading={isLoadingHotels}
                        renderOption={(hotel) => (
                          <span className="text-white text-sm">
                            {hotel.name}
                            {hotel.userId && (
                              <span className="text-white/60 ml-2">({hotel.userId.username})</span>
                            )}
                          </span>
                        )}
                      />
                    </div>
                  </div>
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
                <button type="button" onClick={() => {
                  setEditingId(null);
                  setShowForm(false);
                  setFormData({ name: '', region: '', description: '', imageURL: '', terrainType: 'Hill', experienceProtocols: { adventure: '', tradition: '', landscape: '', tours: '' }, assignedGuides: [], assignedHotels: [] });
                }} className="action-btn" style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)' }}>CANCEL</button>
                <button type="submit" className="action-btn info" style={{ border: '1px solid var(--hill-green)', padding: '0.5rem 1rem', borderRadius: '4px' }}>{editingId ? 'UPDATE_NODE' : 'STORE_NODE'}</button>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="table-section">
        <h3 className="section-title">Active Destinations</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th>REGION</th>
                <th>TERRAIN</th>
                <th>VISITS</th>
                <th>SCORE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingDestinations ? (
                // Show loading skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="highlight-text"><div className="h-4 bg-gray-600 rounded animate-pulse w-24"></div></td>
                    <td><div className="h-4 bg-gray-600 rounded animate-pulse w-16"></div></td>
                    <td><div className="h-6 bg-gray-600 rounded animate-pulse w-12"></div></td>
                    <td><div className="h-4 bg-gray-600 rounded animate-pulse w-8"></div></td>
                    <td><div className="h-4 bg-gray-600 rounded animate-pulse w-10"></div></td>
                    <td className="actions-cell">
                      <div className="h-8 bg-gray-600 rounded animate-pulse w-12 mr-2"></div>
                      <div className="h-8 bg-gray-600 rounded animate-pulse w-20"></div>
                    </td>
                  </tr>
                ))
              ) : destinations.length > 0 ? (
                destinations.map((dest) => (
                  <tr key={dest._id}>
                    <td className="highlight-text">{dest.name}</td>
                    <td>{dest.region}</td>
                    <td><span className="severity-tag low">{dest.terrainType}</span></td>
                    <td><span style={{ fontWeight: 'bold', color: '#A2D729' }}>{dest.totalVisits || 0}</span></td>
                    <td>{dest.popularityScore || 0}</td>
                    <td className="actions-cell">
                      <button onClick={() => handleEdit(dest)} className="action-btn bg-toxic-lime text-obsidian px-2 py-1 rounded mr-2">Edit</button>
                      <button onClick={() => handleDelete(dest._id)} className="action-btn danger bg-toxic-lime text-obsidian px-2 py-1 rounded">Delete Destination</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No nodes currently populated.</td>
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