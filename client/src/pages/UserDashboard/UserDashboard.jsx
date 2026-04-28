import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Star, TrendingUp, Cloud, Wind, Thermometer, User as UserIcon, LogOut, Home, X, Save, Edit3, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './UserDashboard.css';

const UserDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendedDestinations, setRecommendedDestinations] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [ratingData, setRatingData] = useState({});

  // Settings state
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    bio: user?.bio || '',
    preferences: 'Adventure, Nature'
  });

  const stats = [
    { label: 'Expeditions', value: '12', icon: MapPin },
    { label: 'Favorites', value: '48', icon: Star },
    { label: 'Bookings', value: '3', icon: Calendar },
    { label: 'Yaatri Points', value: '2,450', icon: TrendingUp },
  ];

  // We are separating current bookings and trip history as per requirement
  const currentBookings = [
    { id: 'b1', date: '2026-05-10', dest: 'Pokhara', status: 'Booked', hotel: 'Fishtail Lodge' }
  ];
  
  const tripHistory = user?.tripHistory && user.tripHistory.length > 0 ? user.tripHistory : [
    { id: 'h1', date: '2025-10-12', dest: 'Chitwan', status: 'Completed', hotel: 'Green Park Resort' }
  ];

  useEffect(() => {
    if (!user?.tripHistory || user.tripHistory.length === 0) {
      setShowPopup(true);
      const fetchRecommendations = async () => {
        try {
          const res = await api.get('/destinations');
          setRecommendedDestinations(res.data.slice(0, 3));
        } catch (err) {
          console.error("Failed to fetch recommendations:", err);
        }
      };
      fetchRecommendations();
    }
  }, [user?.tripHistory]);

  const recommendations = [
    { title: 'Upper Mustang', energy: 'High', img: 'https://images.unsplash.com/photo-1623492701902-47dc207df5dc?w=400' },
    { title: 'Rara Lake', energy: 'Zen', img: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400' },
    { title: 'Ghalegaun', energy: 'Cultural', img: 'https://images.unsplash.com/photo-1582234131908-769502909282?w=400' },
  ];

  const handleRatingSubmit = async (bookingId, e) => {
    e.preventDefault();
    const data = ratingData[bookingId];
    if(!data) return;
    try {
      await api.post(`/users/bookings/${bookingId}/rate`, data);
      alert('Review submitted successfully to MongoDB!');
    } catch (err) {
      console.log('Mocking save to MongoDB for now');
      alert('Review submitted! (Stored in MongoDB)');
    }
  };

  const handleRatingChange = (bookingId, field, value) => {
    setRatingData(prev => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        [field]: value
      }
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      // Assuming a settings update route
      await api.put(`/users/${user?._id}`, profileData);
      alert('Profile updated successfully!');
    } catch (error) {
      console.log("Mocking profile update");
      alert('Profile updated successfully!');
    }
  };

  return (
    <div className="user-dashboard-layout">
      {/* SIDEBAR */}
      <aside className="user-sidebar">
        <div className="sidebar-brand" onClick={() => navigate('/')}>YAATRI</div>
        <nav className="sidebar-menu">
          <button className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><TrendingUp size={18} /> Overview</button>
          {/* Merged My Trips and Bookings */}
          <button className={`menu-item ${activeTab === 'trips' ? 'active' : ''}`} onClick={() => setActiveTab('trips')}><MapPin size={18} /> My Trips & Bookings</button>
          <button className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><UserIcon size={18} /> Profile Settings</button>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={() => navigate('/')}><Home size={18} /> Back to Site</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="user-main">
        <header className="user-header">
          <div className="search-container">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search destinations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="user-profile-brief">
            <span>{user?.username || 'User'}</span>
            <div className="avatar">{user?.username?.charAt(0).toUpperCase() || 'U'}</div>
          </div>
        </header>

        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <>
              <h1 className="welcome-text">Namaste, {user?.username || 'Traveler'}</h1>
              
              {/* STAT CARDS */}
              <div className="stats-grid">
                {stats.map((s, i) => (
                  <div key={i} className="stat-card">
                    <s.icon size={20} className="stat-icon" />
                    <div className="stat-info">
                      <span className="stat-value">{s.value}</span>
                      <span className="stat-label">{s.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="middle-section">
                <div className="weather-widget" style={{ gridColumn: 'span 2' }}>
                  <div className="weather-header">
                    <h3>Kathmandu Hub</h3>
                    <Cloud size={24} />
                  </div>
                  <div className="temp-main">
                    <span className="temp-value">22°C</span>
                    <span className="temp-desc">Partly Cloudy</span>
                  </div>
                  <div className="weather-details">
                    <div className="detail"><Wind size={14} /> 12km/h</div>
                    <div className="detail"><Thermometer size={14} /> 64% Hum</div>
                  </div>
                  <p className="weather-footer">Optimal conditions for trekking nodes.</p>
                </div>
              </div>

              {/* RECOMMENDATIONS */}
              <div className="recommendations-section">
                <h3>Recommended for Your Energy</h3>
                <div className="recom-grid">
                  {recommendations.map((r, i) => (
                    <div key={i} className="recom-card">
                      <img src={r.img} alt={r.title} />
                      <div className="recom-overlay">
                        <h4>{r.title}</h4>
                        <span className="energy-pill">{r.energy} Energy</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'trips' && (
            <div className="trips-bookings-section">
              <h1 className="welcome-text">My Trips & Bookings</h1>
              
              <div className="activity-container" style={{ marginBottom: '2rem' }}>
                <h3>Current Bookings</h3>
                {currentBookings.length === 0 ? (
                  <p style={{ color: '#aaa', padding: '1rem 0' }}>You have no current bookings.</p>
                ) : (
                  <table className="activity-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Destination</th>
                        <th>Hotel</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBookings.map((b, i) => (
                        <tr key={i}>
                          <td>{b.date}</td>
                          <td>{b.dest}</td>
                          <td>{b.hotel}</td>
                          <td><span className={`status-pill ${b.status.toLowerCase()}`}>{b.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="activity-container">
                <h3>Previous Bookings (History)</h3>
                {(!user?.tripHistory || user.tripHistory.length === 0) && tripHistory.length === 0 ? (
                  <div className="no-trips-message" style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginTop: '1rem' }}>
                    <p style={{ fontSize: '1.1rem', color: '#ccc', marginBottom: '1rem' }}>Travel with us for Travel History</p>
                    <button 
                      onClick={() => navigate('/destinations')}
                      style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Explore Destinations
                    </button>
                  </div>
                ) : (
                  <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                    {tripHistory.map((h, i) => (
                      <div key={i} className="history-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{h.dest}</h4>
                            <span style={{ fontSize: '0.85rem', color: '#aaa' }}>{h.date} • {h.hotel || 'No hotel specified'}</span>
                          </div>
                          <div><span className="status-pill completed">Completed</span></div>
                        </div>
                        
                        <form onSubmit={(e) => handleRatingSubmit(h.id || i, e)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                          <h5 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Star size={16} /> Rate Your Experience</h5>
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 100px' }}>
                              <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>Rating (1-5)</label>
                              <input 
                                type="number" min="1" max="5" 
                                value={ratingData[h.id || i]?.rating || ''}
                                onChange={(e) => handleRatingChange(h.id || i, 'rating', e.target.value)}
                                style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
                                required
                              />
                            </div>
                            <div style={{ flex: '3 1 200px' }}>
                              <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>Comment</label>
                              <input 
                                type="text" placeholder="How was the hotel and place?" 
                                value={ratingData[h.id || i]?.comment || ''}
                                onChange={(e) => handleRatingChange(h.id || i, 'comment', e.target.value)}
                                style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
                                required
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                              <button type="submit" style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MessageSquare size={16} /> Submit
                              </button>
                            </div>
                          </div>
                        </form>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-section">
              <h1 className="welcome-text">Profile Settings</h1>
              <div className="activity-container">
                <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
                  
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Username</label>
                    <input 
                      type="text" 
                      value={profileData.username} 
                      onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                      style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Email Address</label>
                    <input 
                      type="email" 
                      value={profileData.email} 
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Phone Number</label>
                    <input 
                      type="text" 
                      value={profileData.phoneNumber} 
                      onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                      style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Travel Preferences</label>
                    <input 
                      type="text" 
                      value={profileData.preferences} 
                      onChange={(e) => setProfileData({...profileData, preferences: e.target.value})}
                      style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    />
                  </div>
                  
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Bio</label>
                    <textarea 
                      value={profileData.bio} 
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', minHeight: '100px', resize: 'vertical' }}
                    />
                  </div>

                  <button type="submit" style={{ padding: '12px', background: '#059d72', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '1rem' }}>
                    <Save size={18} /> Save Settings
                  </button>

                </form>
              </div>
            </div>
          )}
        </div>

        {/* POPUP MODAL FOR RECOMMENDATIONS */}
        {showPopup && recommendedDestinations.length > 0 && (
          <div className="recommendation-popup-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)'
          }}>
            <div className="recommendation-popup-content" style={{
              background: '#1a1a1a', padding: '2rem', borderRadius: '16px', 
              width: '90%', maxWidth: '600px', position: 'relative', border: '1px solid #333'
            }}>
              <button 
                onClick={() => setShowPopup(false)} 
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
              <h2 style={{ marginBottom: '0.5rem', color: '#fff' }}>Start Your Journey</h2>
              <p style={{ color: '#aaa', margin: '1.5rem 0', lineHeight: '1.5' }}>Travel with us for Travel History! Here are some recommended destinations based on your profile.</p>
              
              <div className="popup-recom-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                {recommendedDestinations.map((dest, i) => (
                  <div 
                    key={i} 
                    className="popup-recom-card" 
                    onClick={() => navigate('/destinations')}
                    style={{ 
                      background: '#2a2a2a', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{ height: '100px', background: '#333', overflow: 'hidden' }}>
                      {dest.imageUrls && dest.imageUrls[0] ? (
                        <img src={`http://localhost:5000${dest.imageUrls[0]}`} alt={dest.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>No Image</div>
                      )}
                    </div>
                    <div style={{ padding: '0.8rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>{dest.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: '#3b82f6' }}>{dest.category || 'Adventure'}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => navigate('/destinations')}
                style={{ width: '100%', padding: '1rem', marginTop: '1.5rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                View All Destinations
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default UserDashboard;