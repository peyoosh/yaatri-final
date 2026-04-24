import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Make sure you have this component created, or update the path to match yours
import DestinationCard from '../components/DestinationCard'; 

const DestinationPage = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Uses Vite environment variable or defaults to your local server
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        // Fetches destinations (which are already sorted by popularity in your backend)
        const res = await axios.get(`${API_URL}/api/destinations`);
        setDestinations(res.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching destinations:", err);
        setError("Failed to load destinations. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, [API_URL]);

  // 1. Loading State
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading destinations...</p>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="error-container">
        <h2>{error}</h2>
        <button onClick={() => window.location.reload()} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  // 3. Main Render & Empty State
  return (
    <div className="destination-page">
      <h1 className="page-title">Explore Destinations</h1>
      
      {destinations.length === 0 ? (
        <div className="empty-state">
          <h2 className="empty-state-title">No active trails found</h2>
          <p className="empty-state-text">Check back later or ask an admin to add new locations to the hub.</p>
        </div>
      ) : (
        <div className="destination-grid">
          {destinations.map(dest => (
            <DestinationCard key={dest._id} data={dest} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DestinationPage;