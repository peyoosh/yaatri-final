import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserManager({
  stats,
  userList,
  setViewingProfile,
  blockUser,
  deleteUser
}) {
  const navigate = useNavigate();
  const activityLog = [
    { id: 1, user: 'trekker_88', action: 'Updated profile bio', timestamp: '2024-04-12 18:00' },
    { id: 2, user: 'peyoosh_admin', action: 'Purged user \'spam_bot_101\'', timestamp: '2024-04-12 17:30' },
    { id: 3, user: 'trekker_88', action: 'Posted new intel in Khumbu Node', timestamp: '2024-04-12 15:00' },
  ];

  return (
    <>
      <h2 className="page-title">AUTHOR_MANAGEMENT_FRONT</h2>
      
      {/* SUMMARY CARDS */}
      <div className="summary-grid">
        <div className="summary-card">
          <span className="card-label">TOTAL_REVENUE</span>
          <span className="card-value">{stats.revenue}</span>
        </div>
        <div className="summary-card">
          <span className="card-label">MONTHLY_TRAFFIC</span>
          <span className="card-value">{stats.traffic}</span>
        </div>
        <div className="summary-card">
          <span className="card-label">ACTIVE_GUIDES</span>
          <span className="card-value">{stats.activeGuides}</span>
        </div>
      </div>

      {/* CHART PLACEHOLDER */}
      <div className="chart-section">
        <h3 className="section-title">Most Opted Nepal Routes</h3>
        <div className="chart-placeholder">
          [ DATA_VISUALIZATION: TOPOGRAPHIC_FLOW_ANALYSIS ]
        </div>
      </div>

      {/* USER REGISTRY */}
      <section className="table-section">
        <h3 className="section-title">System User Registry</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>USER_ID</th>
                <th>IDENTIFIER</th>
                <th>ROLE</th>
                <th>OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {userList.map(u => (
                <tr key={u.id}>
                  <td>#{u.id.toString().padStart(3, '0')}</td>
                  <td className="highlight-text" onClick={() => setViewingProfile(u)}>{u.username}</td>
                  <td>{u.role.toUpperCase()}</td>
                  <td className="actions-cell">
                    <button onClick={() => navigate(`/admin/blogmanagement?user=${u.id}`)} className="action-btn info">VIEW_BLOGS</button>
                    <button onClick={() => blockUser(u.id)} className="action-btn warn">{u.status === 'Blocked' ? 'UNBLOCK' : 'BLOCK'}</button>
                    <button onClick={() => deleteUser(u.id)} className="action-btn danger">PURGE</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ACTIVITY LOG */}
      <section className="table-section">
        <h3 className="section-title">Recent Activity Log</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>USER</th>
                <th>ACTION</th>
                <th>TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              {activityLog.map(log => (
                <tr key={log.id}>
                  <td className="highlight-text">@{log.user}</td>
                  <td>{log.action}</td>
                  <td>{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </>
  );
}