import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserManager({
  stats,
  safetyConcerns,
  userList,
  blogPosts,
  setViewingProfile,
  blockUser,
  deleteUser,
  deletePost,
  setActiveHub
}) {
  const navigate = useNavigate();

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

      {/* GUIDE SAFETY TABLE */}
      <section className="table-section">
        <h3 className="section-title">Guide Safety Concerns</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>GUIDE_NAME</th>
                <th>REGION</th>
                <th>SEVERITY</th>
                <th>INCIDENT_LOG</th>
              </tr>
            </thead>
            <tbody>
              {safetyConcerns.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.region}</td>
                  <td><span className={`severity-tag ${c.severity.toLowerCase()}`}>{c.severity}</span></td>
                  <td>{c.log}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
                    <button onClick={() => setActiveHub('blogs')} className="action-btn info">VIEW_BLOGS</button>
                    <button onClick={() => blockUser(u.id)} className="action-btn warn">{u.status === 'Blocked' ? 'UNBLOCK' : 'BLOCK'}</button>
                    <button onClick={() => deleteUser(u.id)} className="action-btn danger">PURGE</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* BLOG MODERATION */}
      <section className="table-section">
        <h3 className="section-title">Intel Stream Moderation</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>AUTHOR</th>
                <th>CAPTION_EXTRACT</th>
                <th>OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {blogPosts.map(post => (
                <tr key={post.id}>
                  <td>@{post.user}</td>
                  <td>{post.caption.substring(0, 50)}...</td>
                  <td className="actions-cell">
                    <button onClick={() => navigate(`/admin/users/${post.user_id || 1}`)} className="action-btn info">VIEW_AUTHOR</button>
                    <button onClick={() => deletePost(post.id)} className="action-btn danger">DELETE_STREAM</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}