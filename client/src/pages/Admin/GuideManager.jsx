import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function GuideManager() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        setLoading(true);
        const res = await api.get('/guides');
        setGuides(res.data || []);
      } catch (err) {
        console.error("Failed to fetch guides:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGuides();
  }, []);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="page-title">GUIDE_MANAGEMENT_SYSTEM</h2>
      </div>

      {/* ACTIVE GUIDES */}
      <section className="table-section">
        <h3 className="section-title">Active Guides</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>GUIDE_NAME</th>
                <th>USER_ACCOUNT</th>
                <th>DAILY_FEE</th>
                <th>RATING</th>
                <th>VERIFIED</th>
                <th>COMPLETED_TOURS</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td><div className="h-4 bg-gray-600 rounded animate-pulse w-24"></div></td>
                    <td><div className="h-4 bg-gray-600 rounded animate-pulse w-20"></div></td>
                    <td><div className="h-4 bg-gray-600 rounded animate-pulse w-16"></div></td>
                    <td><div className="h-4 bg-gray-600 rounded animate-pulse w-12"></div></td>
                    <td><div className="h-4 bg-gray-600 rounded animate-pulse w-16"></div></td>
                    <td><div className="h-4 bg-gray-600 rounded animate-pulse w-20"></div></td>
                    <td><div className="h-4 bg-gray-600 rounded animate-pulse w-16"></div></td>
                  </tr>
                ))
              ) : guides.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No guides registered yet.
                  </td>
                </tr>
              ) : (
                guides.map(guide => (
                  <tr key={guide._id}>
                    <td className="highlight-text">{guide.guideName || 'Unnamed Guide'}</td>
                    <td>{guide.userId?.username || 'Unknown'}</td>
                    <td>${guide.dailyFee || 0}/day</td>
                    <td>{guide.rating ? `${guide.rating}/5` : 'Not rated'}</td>
                    <td>
                      <span className={`status-badge ${guide.isVerified ? 'status-published' : 'status-pending'}`}>
                        {guide.isVerified ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </td>
                    <td>{guide.completedTours || 0}</td>
                    <td>
                      <span className="status-badge status-published">ACTIVE</span>
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