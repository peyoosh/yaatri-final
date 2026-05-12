import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export const Toast = ({ id, message, type = 'success', onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300);
    }, 3500);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const bgColor = type === 'success' ? '#A2D729' : '#FF6B6B';
  const icon = type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />;
  const textColor = type === 'success' ? '#000' : '#fff';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20, x: 20 }}
          style={{
            position: 'fixed',
            top: '2rem',
            right: '2rem',
            backgroundColor: bgColor,
            color: textColor,
            padding: '1rem 1.5rem',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            zIndex: 4000,
            fontWeight: 'bold',
            fontSize: '0.95rem',
            fontFamily: "'Poppins', sans-serif",
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            maxWidth: '400px'
          }}
        >
          {icon}
          <span style={{ flex: 1 }}>{message}</span>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(id), 300);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: textColor,
              cursor: 'pointer',
              padding: '0',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
};
