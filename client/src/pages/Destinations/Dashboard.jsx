import React, { useState } from 'react';

const MOCK_DATA = [
  { id: 1, name: "Ghalegaun", category: "Culture", img: "https://images.unsplash.com/photo-1544735716-392fe2489ffa" },
  { id: 2, name: "Upper Mustang", category: "Adventure", img: "https://images.unsplash.com/photo-1623492701902-47dc207df5dc" },
  { id: 3, name: "Bandipur", category: "Heritage", img: "https://images.unsplash.com/photo-1605640840605-14ac1855827b" },
  { id: 4, name: "Poon Hill", category: "Trekking", img: "https://images.unsplash.com/photo-1582142306909-195724d33ffc" }
];

export default function DestinationDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  // Logic: Filter by category AND Search by name
  const filteredDestinations = MOCK_DATA.filter(dest => {
    const matchesFilter = filter === 'All' || dest.category === filter;
    const matchesSearch = dest.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="explorer-container" style={{ padding: '40px 8%' }}>
      <h1>Explore Destinations</h1>
      
      {/* Search and Filter UI */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="Search by name..." 
          style={{ padding: '10px', flex: 1, border: '1px solid #000' }}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '10px', border: '1px solid #000' }}
        >
          <option value="All">All Categories</option>
          <option value="Culture">Culture</option>
          <option value="Adventure">Adventure</option>
          <option value="Heritage">Heritage</option>
          <option value="Trekking">Trekking</option>
        </select>
      </div>

      {/* Results Grid */}
      <div className="grid">
        {filteredDestinations.length > 0 ? (
          filteredDestinations.map(dest => (
            <div key={dest.id} className="card">
              <div className="card-img" style={{ backgroundImage: `url(${dest.img})` }}></div>
              <div className="card-info">
                <h3>{dest.name}</h3>
                <p>Category: {dest.category}</p>
              </div>
            </div>
          ))
        ) : (
          <p>No destinations match your search.</p>
        )}
      </div>
    </div>
  );
}