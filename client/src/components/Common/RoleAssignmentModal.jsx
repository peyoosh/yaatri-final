import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const RoleAssignmentModal = ({ isOpen, onClose, user, onSave, loading }) => {
  const [selectedRole, setSelectedRole] = useState(user?.role || 'explorer');
  const [pricePerNight, setPricePerNight] = useState(user?.pricePerNight || '');
  const [dailyFee, setDailyFee] = useState(user?.dailyFee || '');

  const handleSave = async () => {
    const payload = {
      role: selectedRole,
    };

    // Add conditional fields
    if (selectedRole === 'hotel_owner' && pricePerNight) {
      payload.pricePerNight = parseFloat(pricePerNight);
    }
    if (selectedRole === 'guide' && dailyFee) {
      payload.dailyFee = parseFloat(dailyFee);
    }

    await onSave(payload);
    onClose();
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 3000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem'
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              backgroundColor: 'var(--obsidian)',
              border: '2px solid #1A434E',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '500px',
              padding: '2.5rem',
              position: 'relative'
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'none',
                border: 'none',
                color: '#A2D729',
                cursor: 'pointer',
                fontSize: '1.5rem',
                padding: '0'
              }}
            >
              <X size={24} />
            </button>

            {/* Header */}
            <h2 style={{ color: '#A2D729', fontSize: '1.5rem', marginBottom: '0.5rem', fontFamily: "'Poppins', sans-serif" }}>
              ASSIGN CHARACTER
            </h2>
            <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
              USER: @{user.username} | ID: {user._id?.toString().substring(user._id?.toString().length - 4)}
            </p>

            {/* Role Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#A2D729', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                SELECT ROLE
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#1A434E',
                  color: '#fff',
                  padding: '10px 12px',
                  border: '2px solid #1A434E',
                  borderRadius: '4px',
                  outline: 'none',
                  fontSize: '0.95rem',
                  fontFamily: "'Poppins', sans-serif",
                  cursor: 'pointer'
                }}
              >
                <option value="explorer">Explorer</option>
                <option value="hotel_owner">Hotel Owner</option>
                <option value="guide">Guide</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Conditional: Hotel Owner Fields */}
            {selectedRole === 'hotel_owner' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginBottom: '1.5rem', overflow: 'hidden' }}
              >
                <label style={{ display: 'block', color: '#A2D729', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  PRICE PER NIGHT (Required)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={pricePerNight}
                  onChange={(e) => setPricePerNight(e.target.value)}
                  placeholder="Enter price per night"
                  style={{
                    width: '100%',
                    backgroundColor: '#1A434E',
                    color: '#fff',
                    padding: '10px 12px',
                    border: '2px solid #1A434E',
                    borderRadius: '4px',
                    outline: 'none',
                    fontSize: '0.95rem',
                    fontFamily: "'Poppins', sans-serif",
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>
                  This will be displayed on their hotel listing.
                </p>
              </motion.div>
            )}

            {/* Conditional: Guide Fields */}
            {selectedRole === 'guide' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginBottom: '1.5rem', overflow: 'hidden' }}
              >
                <label style={{ display: 'block', color: '#A2D729', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  DAILY FEE (Required)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={dailyFee}
                  onChange={(e) => setDailyFee(e.target.value)}
                  placeholder="Enter daily fee"
                  style={{
                    width: '100%',
                    backgroundColor: '#1A434E',
                    color: '#fff',
                    padding: '10px 12px',
                    border: '2px solid #1A434E',
                    borderRadius: '4px',
                    outline: 'none',
                    fontSize: '0.95rem',
                    fontFamily: "'Poppins', sans-serif",
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>
                  This will be displayed on their guide profile.
                </p>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  backgroundColor: '#333',
                  color: '#fff',
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  fontFamily: "'Poppins', sans-serif"
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleSave}
                disabled={
                  loading ||
                  (selectedRole === 'hotel_owner' && !pricePerNight) ||
                  (selectedRole === 'guide' && !dailyFee)
                }
                style={{
                  flex: 1,
                  backgroundColor: '#A2D729',
                  color: '#000',
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  fontFamily: "'Poppins', sans-serif",
                  opacity: loading || ((selectedRole === 'hotel_owner' && !pricePerNight) || (selectedRole === 'guide' && !dailyFee)) ? 0.6 : 1
                }}
              >
                {loading ? 'SAVING...' : 'SAVE CHARACTER'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RoleAssignmentModal;
