import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserManager({
  userList,
  setViewingProfile,
  blockUser,
  deleteUser,
  updateUserRole
}) {
  const navigate = useNavigate();
  const [selectedRoles, setSelectedRoles] = useState({});

  const handleRoleChange = (userId, role) => {
    setSelectedRoles(prev => ({...prev, [userId]: role}));
  };

  const handleUpdate = (userId) => {
    const role = selectedRoles[userId];
    if (role) {
      updateUserRole(userId, role);
    }
  };

  // We can show all users or at least non-admins. If we want to assign admins too, we should remove the filter. Let's just remove the filter to allow all role assignments.
  const filteredUsers = userList;

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
                <th>CHARACTER ASSIGNMENT</th>
                <th>OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => {
                // Fallback to _id if id is undefined (common with MongoDB data)
                const userId = u.id || u._id || '000';
                
                return (
                <tr key={userId}>
                  <td>#{userId.toString().substring(userId.toString().length - 4).padStart(4, '0')}</td>
                  <td className="highlight-text" onClick={() => navigate(`/profile/${userId}`)} style={{ cursor: 'pointer' }}>{u.username || 'UNKNOWN'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <select 
                        value={selectedRoles[userId] || u.role || 'explorer'} 
                        onChange={(e) => handleRoleChange(userId, e.target.value)}
                        style={{ 
                          backgroundColor: '#1A434E', 
                          color: '#fff',
                          padding: '4px 8px',
                          border: '1px solid #1A434E',
                          borderRadius: '4px',
                          outline: 'none'
                        }}
                      >
                        <option value="explorer">Explorer</option>
                        <option value="hotel_owner">Hotel Owner</option>
                        <option value="guide">Guide</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button 
                        onClick={() => handleUpdate(userId)}
                        style={{ backgroundColor: '#A2D729', color: '#000', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}
                      >
                        Update
                      </button>
                    </div>
                  </td>
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