import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const DestinationManager = () => {
  // 1. State Management
  const [destinations, setDestinations] = useState([]);
  const [newDestination, setNewDestination] = useState({
    name: '',
    description: '',
    region: '',
    imageURL: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch destinations
  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/destinations`);
      setDestinations(res.data);
    } catch (err) {
      console.error("Error fetching destinations:", err);
      setError("Failed to load destinations.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch destinations on mount
  useEffect(() => {
    fetchDestinations();
  }, []);

  // Handle input changes for the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDestination(prev => ({ ...prev, [name]: value }));
  };

  // Handle adding a new destination
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // The Guardrail: Prevent empty name or description (including whitespace-only strings)
    if (!newDestination.name.trim() || !newDestination.description.trim()) {
      alert("Name and Description cannot be empty.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const res = await api.post(`/admin/destinations`, newDestination);
      
      if (res.status === 201 || res.status === 200) {
        await fetchDestinations();
      }
      
      // Reset the form state
      setNewDestination({ name: '', description: '', region: '', imageURL: '' });
    } catch (err) {
      console.error("Error adding destination:", err);
      alert("Failed to add destination. Ensure you have Admin privileges.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle removing a destination
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this destination?")) return;
    
    try {
      await api.delete(`/admin/destinations/${id}`);
      setDestinations(destinations.filter(d => d._id !== id));
    } catch (err) {
      console.error("Error deleting destination:", err);
      if (err.response && err.response.status === 404) {
        alert("Destination not found or already deleted.");
        setDestinations(destinations.filter(d => d._id !== id));
      } else {
        alert("Failed to delete destination.");
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-obsidian">
      <div className="animate-pulse text-hill-green text-2xl font-bold tracking-widest border border-hill-green p-6 rounded">
        Loading Destination Manager...
      </div>
    </div>
  );
  if (error) return <div className="text-red-500 bg-obsidian p-4 min-h-screen">{error}</div>;

  return (
    <div className="bg-obsidian min-h-screen p-6 md:p-10 text-hill-green font-global">
      <h2 className="text-3xl font-bold mb-8 border-b border-hill-green pb-4">Destination Management</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* LEFT COLUMN: ADD NEW DESTINATION FORM */}
        <div className="border border-hill-green rounded-xl p-6 shadow-sm">
          <h3 className="text-2xl font-semibold mb-6">Add New Node</h3>
          <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
            <input type="text" name="name" placeholder="Destination Name" value={newDestination.name} onChange={handleInputChange} required 
              className="w-full bg-transparent border border-hill-green text-hill-green placeholder-hill-green placeholder-opacity-50 p-3 rounded focus:outline-none focus:ring-2 focus:ring-hill-green" />
            
            <input type="text" name="region" placeholder="Region (e.g., Kathmandu)" value={newDestination.region} onChange={handleInputChange} required 
              className="w-full bg-transparent border border-hill-green text-hill-green placeholder-hill-green placeholder-opacity-50 p-3 rounded focus:outline-none focus:ring-2 focus:ring-hill-green" />
            
            <input type="text" name="imageURL" placeholder="Image URL (Cloudinary/S3)" value={newDestination.imageURL} onChange={handleInputChange} 
              className="w-full bg-transparent border border-hill-green text-hill-green placeholder-hill-green placeholder-opacity-50 p-3 rounded focus:outline-none focus:ring-2 focus:ring-hill-green" />
            
            <textarea name="description" placeholder="Destination Description..." value={newDestination.description} onChange={handleInputChange} required rows="4"
              className="w-full bg-transparent border border-hill-green text-hill-green placeholder-hill-green placeholder-opacity-50 p-3 rounded focus:outline-none focus:ring-2 focus:ring-hill-green resize-none"></textarea>
            
            <button type="submit" disabled={isSubmitting} 
              className="w-full bg-hill-green text-obsidian font-bold py-3 rounded hover:bg-opacity-80 transition duration-300 disabled:opacity-50">
              {isSubmitting ? 'Syncing...' : 'Add Node'}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: SCROLLABLE LIST OF DESTINATIONS */}
        <div className="border border-hill-green rounded-xl p-6 shadow-sm flex flex-col h-[75vh]">
          <h3 className="text-2xl font-semibold mb-6">Active Nodes</h3>
          
          <div className="overflow-y-auto pr-2 space-y-4 flex-1 custom-scrollbar">
            {destinations.length === 0 ? (
              <p className="text-center italic opacity-75 mt-10">No active nodes. Begin populating Nepal's map.</p>
            ) : (
              destinations.map(dest => (
                <div key={dest._id} className="border border-hill-green border-opacity-50 p-4 rounded flex justify-between items-center hover:bg-hill-green hover:bg-opacity-10 transition">
                  <div>
                    <h4 className="text-xl font-bold">{dest.name}</h4>
                    <p className="text-sm opacity-75">{dest.region}</p>
                  </div>
                  <button onClick={() => handleDelete(dest._id)} 
                    className="text-red-400 border border-red-400 px-4 py-2 rounded hover:bg-red-400 hover:text-obsidian transition">
                  DELETE
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DestinationManager;