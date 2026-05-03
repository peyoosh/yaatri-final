import React from 'react';

export default function DashboardOverview({ stats }) {
  const activityLog = [
    { id: 1, user: 'trekker_88', action: 'Updated profile bio', timestamp: '2024-04-12 18:00' },
    { id: 2, user: 'peyoosh_admin', action: 'Purged user \'spam_bot_101\'', timestamp: '2024-04-12 17:30' },
    { id: 3, user: 'trekker_88', action: 'Posted new intel in Khumbu Node', timestamp: '2024-04-12 15:00' },
  ];

  return (
    <>
      <h2 className="page-title">ADMIN_PANEL_OVERVIEW</h2>
      
      {/* SUMMARY CARDS */}
      <div className="summary-grid">
        <div className="summary-card bg-teal-steel">
          <span className="card-label">TOTAL_REVENUE</span>
          <span className="card-value">{stats?.revenue || '0'}</span>
        </div>
        <div className="summary-card bg-teal-steel">
          <span className="card-label">MONTHLY_TRAFFIC</span>
          <span className="card-value">{stats?.traffic || '0'}</span>
        </div>
        <div className="summary-card bg-teal-steel">
          <span className="card-label">ACTIVE_GUIDES</span>
          <span className="card-value">{stats?.activeGuides || '0'}</span>
        </div>
      </div>

      {/* CHART PLACEHOLDER */}
      <div className="chart-section">
        <h3 className="section-title">Most Opted Nepal Routes</h3>
        <div className="chart-placeholder">
          [ DATA_VISUALIZATION: TOPOGRAPHIC_FLOW_ANALYSIS ]
        </div>
      </div>

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