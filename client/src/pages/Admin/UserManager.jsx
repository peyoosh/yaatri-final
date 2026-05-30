import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleBadge from '../../components/Common/RoleBadge';
import RoleAssignmentModal from '../../components/Common/RoleAssignmentModal';
import { useToast, Toast } from '../../utils/Toast';

export default function UserManager({
  userList,
  setViewingProfile,
  blockUser,
  deleteUser,
  updateUserRole
}) {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  const handleOpenModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSaveRole = async (payload) => {
    if (!selectedUser) return;
    
    const userId = selectedUser.id || selectedUser._id;
    setIsLoading(true);
    
    try {
      await updateUserRole(userId, payload);
      
      // Determine the success message
      let successMessage = `Promoted to ${payload.role.replace('_', ' ').toUpperCase()}`;
      if (payload.role === 'hotel_owner') {
        successMessage = `Registered as Hotel Owner (${payload.pricePerNight}/night)`;
      } else if (payload.role === 'guide') {
        successMessage = `Promoted to Guide (${payload.dailyFee}/day)`;
      }
      
      showToast(`✓ ${selectedUser.username}: ${successMessage}`, 'success');
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Error saving role:", err);
      showToast('Failed to assign character', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // We can show all users or at least non-admins. If we want to assign admins too, we should remove the filter. Let's just remove the filter to allow all role assignments.
  const filteredUsers = userList;

  return (
    <>
      <h2 className="page-title" style={{ fontFamily: "'Poppins', sans-serif" }}>AUTHOR_MANAGEMENT_FRONT</h2>
      
      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={removeToast}
        />
      ))}

      {/* Role Assignment Modal */}
      <RoleAssignmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSave={handleSaveRole}
        loading={isLoading}
      />
      
      {/* USER REGISTRY */}
      <section className="table-section">
        <h3 className="section-title">System User Registry</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>USER_ID</th>
                <th>IDENTIFIER</th>
                <th>CURRENT ROLE</th>
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
                    <RoleBadge role={u.role || 'explorer'} />
                  </td>
                  <td className="actions-cell">
                    <button onClick={() => handleOpenModal(u)} className="action-btn info">ASSIGN CHARACTER</button>
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