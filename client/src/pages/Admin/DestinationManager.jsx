import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DestinationManager = () => {
  const [destinations, setDestinations] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    description: '',
    imageURL: '',
    terrainType: 'Hill' // Default matching the Enum
  });
  const [feedback, setFeedback] = useState(null);

  // Dynamic Uplink for Production
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://yaatri-final.onrender.com/api';

  // Utility to get auth token headers for your validateAdmin protected routes
  const getAuthHeaders = () => {
    const token = localStorage.getItem('yaatri_token'); 
    return { Authorization: `Bearer ${token}` };
  };

  const fetchDestinations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/destinations`);
      // Align fetch with potential payload variations
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/destinations`, formData, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 201) {
        showFeedback('success', 'NODE_STORED_SUCCESSFULLY');
        setFormData({ name: '', region: '', description: '', imageURL: '', terrainType: 'Hill' });
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
      await axios.delete(`${API_BASE_URL}/admin/destinations/${id}`, {
        headers: getAuthHeaders()
      });
      showFeedback('success', 'NODE_PURGED_SUCCESSFULLY');
      // Optimistically update the UI by filtering out the purged node
      setDestinations((prev) => prev.filter(dest => dest._id !== id));
    } catch (error) {
      showFeedback('error', 'ERROR_PURGING_NODE');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-green-500 border-b border-green-800 pb-2">
          Destination Hub Manager
        </h1>

        {/* Real-time Feedback Banner */}
        {feedback && (
          <div className={`mb-6 p-4 rounded border font-mono tracking-tight ${feedback.type === 'success' ? 'bg-green-900 border-green-500 text-green-100' : 'bg-red-900 border-red-500 text-red-100'}`}>
            > [SYSTEM_STATUS]: {feedback.text}
          </div>
        )}

        {/* Grid-Based Data Entry Form */}
        <div className="bg-gray-900 p-6 rounded-lg border border-green-700 shadow-lg shadow-green-900/20 mb-10">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Populate New Node</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="text-sm text-gray-400 mb-1">Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="bg-gray-800 border border-green-800 rounded p-2 focus:outline-none focus:border-green-500 text-white" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-400 mb-1">Region</label>
              <input type="text" name="region" value={formData.region} onChange={handleChange} required className="bg-gray-800 border border-green-800 rounded p-2 focus:outline-none focus:border-green-500 text-white" />
            </div>
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm text-gray-400 mb-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} required rows="3" className="bg-gray-800 border border-green-800 rounded p-2 focus:outline-none focus:border-green-500 text-white"></textarea>
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-400 mb-1">Image URL</label>
              <input type="url" name="imageURL" value={formData.imageURL} onChange={handleChange} required className="bg-gray-800 border border-green-800 rounded p-2 focus:outline-none focus:border-green-500 text-white" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-400 mb-1">Terrain Type</label>
              <select name="terrainType" value={formData.terrainType} onChange={handleChange} className="bg-gray-800 border border-green-800 rounded p-2 focus:outline-none focus:border-green-500 text-white">
                <option value="Himalayan">Himalayan</option>
                <option value="Hill">Hill</option>
                <option value="Terai">Terai</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button type="submit" className="bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-6 rounded transition duration-200 border border-green-500">
                Store Node
              </button>
            </div>
          </form>
        </div>

        {/* Management Table */}
        <div className="bg-gray-900 p-6 rounded-lg border border-green-700 shadow-lg shadow-green-900/20">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Active Destinations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800 text-gray-300">
                  <th className="border-b border-green-800 p-3">Name</th>
                  <th className="border-b border-green-800 p-3">Region</th>
                  <th className="border-b border-green-800 p-3">Terrain</th>
                  <th className="border-b border-green-800 p-3">Score</th>
                  <th className="border-b border-green-800 p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {destinations.length > 0 ? (
                  destinations.map((dest) => (
                    <tr key={dest._id} className="hover:bg-gray-800/50 transition duration-150">
                      <td className="border-b border-gray-800 p-3 font-medium text-gray-200">{dest.name}</td>
                      <td className="border-b border-gray-800 p-3 text-gray-400">{dest.region}</td>
                      <td className="border-b border-gray-800 p-3 text-gray-400">
                        <span className="bg-gray-800 px-2 py-1 rounded text-xs border border-green-900 text-green-300">{dest.terrainType}</span>
                      </td>
                      <td className="border-b border-gray-800 p-3 text-gray-400">{dest.popularityScore || 0}</td>
                      <td className="border-b border-gray-800 p-3 text-right">
                        <button 
                          onClick={() => handleDelete(dest._id)} 
                          className="text-red-500 hover:text-red-400 text-sm font-semibold border border-red-800 hover:border-red-500 px-3 py-1 rounded transition duration-200"
                        >
                          Delete Node
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-gray-500 italic">No nodes currently populated.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DestinationManager;