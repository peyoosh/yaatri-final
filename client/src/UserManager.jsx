import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserManager({
  userList,
  setViewingProfile,
  blockUser,
  deleteUser
}) {
  const navigate = useNavigate();
  const filteredUsers = userList.filter(u => u.role === 'user');

  return (
    <>
      <h2 className="page-title" style={{ fontFamily: "'Poppins', sans-serif" }}>AUTHOR_MANAGEMENT_FRONT</h2>
      
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
              {filteredUsers.map(u => {
                // Fallback to _id if id is undefined (common with MongoDB data)
                const userId = u.id || u._id || '000';
                
                return (
                <tr key={userId}>
                  <td>#{userId.toString().padStart(3, '0')}</td>
                  <td className="highlight-text" onClick={() => navigate(`/profile/${userId}`)} style={{ cursor: 'pointer' }}>{u.username || 'UNKNOWN'}</td>
                  <td>{u.role?.toUpperCase() || 'UNKNOWN'}</td>
                  <td className="actions-cell">
                    <button onClick={() => navigate(`/admin/blogmanagement?id=${userId}`)} className="action-btn info">VIEW_BLOGS</button>
                    <button onClick={() => blockUser(userId)} className="action-btn warn">{u.status === 'Blocked' ? 'UNBLOCK' : 'BLOCK'}</button>
                    <button 
                      onClick={() => {
                        if (window.confirm('WARNING: Are you sure you want to permanently delete this user? This action cannot be undone.')) {
                          deleteUser(userId);
                        }
                      }} 
                      className="action-btn danger bg-toxic-lime text-obsidian px-2 py-1 rounded">Delete User</button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </section>

    </>
  );
}