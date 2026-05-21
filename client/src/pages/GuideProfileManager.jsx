import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../api/axios';
import { AlertCircle, MapPin, DollarSign, Star, Edit2, Save, Award } from 'lucide-react';

const GuideProfileManager = () => {
  const { user: loggedInUser } = useContext(AuthContext);
  const [guideProfile, setGuideProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    guideName: '',
    dailyFee: 0,
    rating: 0,
    expertise: [],
    bio: '',
    isVerified: false
  });
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is guide
  if (loggedInUser?.role !== 'guide') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchGuideProfile();
  }, []);

  const fetchGuideProfile = async () => {
    try {
      const response = await api.get(`/guides/profile`);
      setGuideProfile(response.data);
      setFormData({
        guideName: response.data.guideName || '',
        dailyFee: response.data.dailyFee || 0,
        rating: response.data.rating || 0,
        expertise: response.data.expertise || [],
        bio: response.data.bio || '',
        isVerified: response.data.isVerified || false
      });
    } catch (error) {
      console.error('Error fetching guide profile:', error);
      setFeedback({ type: 'error', text: 'Failed to load guide profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'dailyFee' || name === 'rating' ? Number(value) : value
    }));
  };

  const handleSave = async () => {
    try {
      await api.put(`/guides/profile`, formData);
      setFeedback({ type: 'success', text: 'Guide profile updated successfully' });
      setIsEditing(false);
      fetchGuideProfile();
    } catch (error) {
      console.error('Error saving guide profile:', error);
      setFeedback({ type: 'error', text: 'Failed to update profile' });
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-white">
        <p>Loading guide profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-white p-6 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-toxic-lime to-hill-green">
            Guide Management Dashboard
          </h1>
          <p className="text-white/60">Manage your guide profile and expertise</p>
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
        <div className="bg-teal-steel border border-white/10 rounded-2xl p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold">{formData.guideName || 'Your Profile'}</h2>
                {formData.isVerified && (
                  <div className="flex items-center gap-1 bg-toxic-lime/20 border border-toxic-lime rounded-full px-3 py-1">
                    <Award size={16} className="text-toxic-lime" />
                    <span className="text-sm font-semibold text-toxic-lime">Verified</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <DollarSign size={18} className="text-toxic-lime" />
                  <span className="text-lg">
                    Daily Fee: <strong>${formData.dailyFee}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-toxic-lime" />
                  <span className="text-lg">
                    Rating: <strong>{formData.rating.toFixed(1)}</strong>/5
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-hill-green hover:bg-toxic-lime hover:text-obsidian text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              {isEditing ? <Save size={18} /> : <Edit2 size={18} />}
              {isEditing ? 'Save' : 'Edit'}
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Guide Name</label>
                <input
                  type="text"
                  name="guideName"
                  value={formData.guideName}
                  onChange={handleChange}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-toxic-lime"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Daily Fee (USD)</label>
                  <input
                    type="number"
                    name="dailyFee"
                    value={formData.dailyFee}
                    onChange={handleChange}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-toxic-lime"
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
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-toxic-lime"
                    min="0"
                    max="5"
                    step="0.1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-toxic-lime resize-none"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                <input
                  type="checkbox"
                  name="isVerified"
                  checked={formData.isVerified}
                  onChange={handleChange}
                  className="w-4 h-4 cursor-pointer"
                />
                <label className="cursor-pointer text-sm font-semibold">
                  Request Verification Badge (Admin will review)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-toxic-lime hover:bg-hill-green text-obsidian hover:text-white font-bold py-3 rounded-lg transition-colors"
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
              <p className="mb-4">{formData.bio || 'No bio provided'}</p>
              {formData.expertise && formData.expertise.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Expertise:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.expertise.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-toxic-lime/20 border border-toxic-lime text-toxic-lime px-3 py-1 rounded-full text-sm font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-teal-steel/50 border border-blue-500/30 rounded-lg p-4 flex gap-3">
          <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-white/80">
            <p className="font-semibold mb-1">Earnings Information</p>
            <p>Your daily fee is charged when destinations assign you to guide their visitors. Verified guides appear higher in search results.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideProfileManager;
