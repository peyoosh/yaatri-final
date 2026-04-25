import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import './DestinationManager.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://yaatri-backend.onrender.com";

const DestinationManager = () => {
    const [destinations, setDestinations] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        region: '',
        description: '',
        imageURL: '',
        terrainType: 'Himalayan'
    });

    useEffect(() => {
        fetchDestinations();
    }, []);

    const fetchDestinations = async () => {
        const token = localStorage.getItem('yaatri_token');
        if (!token) {
            navigate('/auth?mode=login');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/destinations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const fetchedData = Array.isArray(response.data) ? response.data : response.data?.data || [];
            setDestinations(fetchedData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching destinations:", error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate('/auth?mode=login');
            }
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleDeploy = async () => {
        const token = localStorage.getItem('yaatri_token'); // Fixed to match your auth system
        if (!token) {
            navigate('/auth?mode=login');
            return;
        }
        
        try {
            const response = await axios.post(`${API_BASE_URL}/api/admin/destinations`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200 || response.status === 201) {
                fetchDestinations();
                setShowModal(false);
                setFormData({ // Clear the form for the next entry
                    name: '',
                    region: '',
                    description: '',
                    imageURL: '',
                    terrainType: 'Himalayan'
                });
            }
        } catch (error) {
            console.error("Deployment failure:", error);
            alert(`Access Denied: ${error.response?.data?.error || error.message}`);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate('/auth?mode=login');
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("PURGE_PROTOCOL: Are you sure you want to delete this destination node?")) return;
        
        const token = localStorage.getItem('yaatri_token');
        if (!token) {
            navigate('/auth?mode=login');
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/api/admin/destinations/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // Filter the local state to remove the deleted node instantly
            setDestinations(destinations.filter(d => d._id !== id));
        } catch (error) {
            console.error("Purge failure:", error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate('/auth?mode=login');
            }
        }
    };

    const filteredDestinations = destinations.filter(dest =>
        dest.region?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h2>Yaatri Destination Management</h2>
                <div className="controls">
                    <input 
                        type="text" 
                        placeholder="Search by region..." 
                        className="search-bar"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="btn-add" onClick={() => setShowModal(true)}>+ Add New</button>
                </div>
            </header>

            <div className="table-wrapper">
                <table className="destination-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Region</th>
                            <th>Popularity Score</th>
                            <th>Terrain Type</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDestinations.map((dest) => (
                            <tr key={dest._id}>
                                <td>{dest.name}</td>
                                <td>{dest.region}</td>
                                <td>{dest.popularityScore || "0"}/10</td>
                                <td>{dest.terrainType || "Hill"}</td>
                                <td>
                                    <button 
                                        className="btn-analyze"
                                        onClick={() => navigate(`/admin/destinations/reports/${dest._id}`, { 
                                            // Passing terrain data to the analytics view
                                            state: { terrain: dest.terrainType } 
                                        })}
                                    >
                                        Analyze
                                    </button>
                                    <button 
                                        className="action-btn danger"
                                        style={{ marginLeft: '10px' }}
                                        onClick={() => handleDelete(dest._id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {loading && <p className="status-text">FETCHING_CORE_DATA...</p>}
                {!loading && destinations.length === 0 && <p className="status-text">No sectors found.</p>}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Initialize New Destination Node</h3>
                        <div className="form-group">
                            <label>Destination Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Langtang Valley" />
                        </div>
                        <div className="form-group">
                            <label>Region</label>
                            <input type="text" name="region" value={formData.region} onChange={handleInputChange} placeholder="District/Zone" />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Enter a brief description..." style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} rows="3"></textarea>
                        </div>
                        <div className="form-group">
                            <label>Image URL</label>
                            <input type="text" name="imageURL" value={formData.imageURL} onChange={handleInputChange} placeholder="Cloudinary or S3 link" />
                        </div>
                        <div className="form-group">
                            <label>Terrain Type</label>
                            <select name="terrainType" value={formData.terrainType} onChange={handleInputChange} className="dark-select">
                                <option value="Himalayan">Himalayan</option>
                                <option value="Hill">Hill</option>
                                <option value="Terai">Terai</option>
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowModal(false)}>Abort</button>
                            <button className="btn-save" onClick={handleDeploy}>Deploy Node</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DestinationManager;