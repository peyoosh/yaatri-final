import React, { useState } from 'react';
import { Search, MapPin, Calendar, Star, TrendingUp, Cloud, Wind, Thermometer, User as UserIcon, LogOut, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

const UserDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    { label: 'Expeditions', value: '12', icon: MapPin },
    { label: 'Favorites', value: '48', icon: Star },
    { label: 'Bookings', value: '3', icon: Calendar },
    { label: 'Yaatri Points', value: '2,450', icon: TrendingUp },
  ];

  const recentActivity = [
    { date: '2024-04-10', dest: 'Khumbu Node 01', status: 'Completed' },
    { date: '2024-04-05', dest: 'Annapurna Circuit', status: 'Booked' },
    { date: '2024-03-28', dest: 'Lalitpur Hub', status: 'Reviewed' },
  ];

  const recommendations = [
    { title: 'Upper Mustang', energy: 'High', img: 'https://images.unsplash.com/photo-1623492701902-47dc207df5dc?w=400' },
    { title: 'Rara Lake', energy: 'Zen', img: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400' },
    { title: 'Ghalegaun', energy: 'Cultural', img: 'https://images.unsplash.com/photo-1582234131908-769502909282?w=400' },
  ];

  return (
    <div className="user-dashboard-layout">
      {/* SIDEBAR */}
      <aside className="user-sidebar">
        <div className="sidebar-brand" onClick={() => navigate('/')}>YAATRI</div>
        <nav className="sidebar-menu">
          <button className="menu-item active"><TrendingUp size={18} /> Overview</button>
          <button className="menu-item" onClick={() => navigate('/destinations')}><MapPin size={18} /> My Trips</button>
          <button className="menu-item"><Calendar size={18} /> Bookings</button>
          <button className="menu-item"><UserIcon size={18} /> Profile Settings</button>
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
            <span>{user?.username}</span>
            <div className="avatar">{user?.username?.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <div className="dashboard-content">
          <h1 className="welcome-text">Namaste, {user?.username}</h1>
          
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
            {/* RECENT ACTIVITY */}
            <div className="activity-container">
              <h3>Recent Activity</h3>
              <table className="activity-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Destination</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((a, i) => (
                    <tr key={i}>
                      <td>{a.date}</td>
                      <td>{a.dest}</td>
                      <td><span className={`status-pill ${a.status.toLowerCase()}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* WEATHER WIDGET */}
            <div className="weather-widget">
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
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;