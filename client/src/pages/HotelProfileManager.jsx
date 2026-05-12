import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../../api/axios';
import { AlertCircle, MapPin, DollarSign, Star, Edit2, Save } from 'lucide-react';

const HotelProfileManager = () => {
  const { loggedInUser } = useContext(AuthContext);
  const [hotelProfile, setHotelProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    hotelName: '',
    basePrice: 0,
    rating: 0,
    amenities: [],
    description: ''
  });
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is hotel_owner
  if (loggedInUser?.role !== 'hotel_owner') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchHotelProfile();
  }, []);

  const fetchHotelProfile = async () => {
    try {
      const response = await api.get(`/hotels/profile`);
      setHotelProfile(response.data);
      setFormData({
        hotelName: response.data.hotelName || '',
        basePrice: response.data.basePrice || 0,
        rating: response.data.rating || 0,
        amenities: response.data.amenities || [],
        description: response.data.description || ''
      });
    } catch (error) {
      console.error('Error fetching hotel profile:', error);
      setFeedback({ type: 'error', text: 'Failed to load hotel profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'basePrice' || name === 'rating' ? Number(value) : value
    }));
  };

  const handleSave = async () => {
    try {
      await api.put(`/hotels/profile`, formData);
      setFeedback({ type: 'success', text: 'Hotel profile updated successfully' });
      setIsEditing(false);
      fetchHotelProfile();
    } catch (error) {
      console.error('Error saving hotel profile:', error);
      setFeedback({ type: 'error', text: 'Failed to update profile' });
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-white">
        <p>Loading hotel profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-white p-6 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#A2D729] to-[#059D72]">
            Hotel Management Dashboard
          </h1>
          <p className="text-white/60">Manage your hotel details and pricing</p>
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              feedback.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-[#1A434E] border border-white/10 rounded-2xl p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">{formData.hotelName || 'Your Hotel'}</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign size={18} className="text-[#A2D729]" />
                  <span className="text-lg">
                    Base Price: <strong>${formData.basePrice}</strong> per night
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-[#A2D729]" />
                  <span className="text-lg">
                    Rating: <strong>{formData.rating.toFixed(1)}</strong>/5
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-[#059D72] hover:bg-[#A2D729] hover:text-[#0D0A02] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              {isEditing ? <Save size={18} /> : <Edit2 size={18} />}
              {isEditing ? 'Save' : 'Edit'}
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Hotel Name</label>
                <input
                  type="text"
                  name="hotelName"
                  value={formData.hotelName}
                  onChange={handleChange}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#A2D729]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Base Price (USD)</label>
                  <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleChange}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#A2D729]"
                    min="0"
                    step="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Rating</label>
                  <input
                    type="number"
                    name="rating"
                    value={formData.rating}
                    onChange={handleChange}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#A2D729]"
                    min="0"
                    max="5"
                    step="0.1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#A2D729] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-[#A2D729] hover:bg-[#059D72] text-[#0D0A02] hover:text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-white/80">
              <p className="mb-4">{formData.description || 'No description provided'}</p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-[#1A434E]/50 border border-blue-500/30 rounded-lg p-4 flex gap-3">
          <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-white/80">
            <p className="font-semibold mb-1">Pricing Information</p>
            <p>Your base price is used to calculate invoices. A 15% guide fee is added when guides are assigned to your bookings.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelProfileManager;
