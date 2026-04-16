import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import './DestinationManager.css';

const API_BASE_URL = "http://localhost:5000"; // Adjust to your environment

const DestinationManager = () => {
    const [destinations, setDestinations] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        latitude: '',
        longitude: '',
        status: 'Active',
        region: '',
        rank: ''
    });

    useEffect(() => {
        fetchDestinations();
    }, []);

    const fetchDestinations = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/destinations`);
            const data = await response.json();
            setDestinations(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching destinations:", error);
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const toggleStatus = () => {
        setFormData({
            ...formData,
            status: formData.status === 'Active' ? 'Maintenance' : 'Active'
        });
    };

    const handleDeploy = async () => {
        const token = localStorage.getItem('token'); // Assuming you store JWT in localStorage
        try {
            const response = await fetch(`${API_BASE_URL}/api/destinations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                fetchDestinations();
                setShowModal(false);
            } else {
                const err = await response.json();
                alert(`Access Denied: ${err.error}`);
            }
        } catch (error) {
            console.error("Deployment failure:", error);
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
                                <td>{dest.title}</td>
                                <td>{dest.region}</td>
                                <td>{dest.popularity || '8.5/10'}</td> {/* Mock score if not in DB */}
                                <td>{dest.terrain || 'Mountain'}</td>   {/* Mock terrain if not in DB */}
                                <td>
                                    <button 
                                        className="btn-analyze"
                                        onClick={() => navigate(`/admin/destinations/reports/${dest._id}`)}
                                    >
                                        Analyze
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {loading && <p className="status-text">Scanning data nodes...</p>}
                {!loading && filteredDestinations.length === 0 && <p className="status-text">No sectors found.</p>}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Initialize New Destination Node</h3>
                        <div className="form-group">
                            <label>Destination Name</label>
                            <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Langtang Valley" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Latitude</label>
                                <input type="text" name="latitude" value={formData.latitude} onChange={handleInputChange} placeholder="27.1234" />
                            </div>
                            <div className="form-group">
                                <label>Longitude</label>
                                <input type="text" name="longitude" value={formData.longitude} onChange={handleInputChange} placeholder="85.5678" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>System Status</label>
                            <div className="toggle-container" onClick={toggleStatus}>
                                <div className={`toggle-slider ${formData.status.toLowerCase()}`}>
                                    {formData.status}
                                </div>
                            </div>
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