import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function HotelManager() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        const res = await api.get('/hotels');
        setHotels(res.data || []);
      } catch (err) {
        console.error("Failed to fetch hotels:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="page-title">HOTEL_MANAGEMENT_SYSTEM</h2>
      </div>

      {/* ACTIVE HOTELS */}
      <section className="table-section">
        <h3 className="section-title">Active Hotels</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>HOTEL_NAME</th>
                <th>OWNER</th>
                <th>PRICE_PER_NIGHT</th>
                <th>ROOMS</th>
                <th>OCCUPANCY</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td><div className="h-4 bg-gray-600 rounded animate-pulse w-32"></div></td>
                    <td><div className="h-4 bg-gray-600 rounded animate-pulse w-24"></div></td>
                    <td><div className="h-4 bg-gray-600 rounded animate-pulse w-20"></div></td>
                    <td><div className="h-4 bg-gray-600 rounded animate-pulse w-16"></div></td>
                    <td><div className="h-4 bg-gray-600 rounded animate-pulse w-20"></div></td>
                    <td><div className="h-4 bg-gray-600 rounded animate-pulse w-16"></div></td>
                  </tr>
                ))
              ) : hotels.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hotels registered yet.
                  </td>
                </tr>
              ) : (
                hotels.map(hotel => (
                  <tr key={hotel._id}>
                    <td className="highlight-text">{hotel.name}</td>
                    <td>{hotel.userId?.username || 'System Hotel'}</td>
                    <td>${hotel.basePrice}/night</td>
                    <td>{hotel.totalRooms}</td>
                    <td>{hotel.bookedRooms}/{hotel.totalRooms} ({Math.round((hotel.bookedRooms / hotel.totalRooms) * 100)}%)</td>
                    <td>
                      <span className={`status-badge ${hotel.isFull ? 'status-flagged' : 'status-published'}`}>
                        {hotel.isFull ? 'FULL' : 'AVAILABLE'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};