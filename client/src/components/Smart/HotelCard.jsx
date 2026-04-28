import React from 'react';
import { BedDouble, CheckCircle, XCircle } from 'lucide-react';

const HotelCard = ({ hotel, onBook }) => {
  if (!hotel) return null;

  const isFull = hotel.isFull || hotel.statusLabel === 'FULL';

  return (
    <div 
      className={`hotel-card ${isFull ? 'hotel-full' : ''}`}
      style={{
        background: isFull ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '1.5rem',
        position: 'relative',
        opacity: isFull ? 0.6 : 1,
        transition: 'all 0.3s ease',
        filter: isFull ? 'grayscale(50%)' : 'none'
      }}
    >
      {isFull && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: '#EF4444',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          letterSpacing: '1px'
        }}>
          FULL
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
        <BedDouble size={20} color={isFull ? '#9CA3AF' : 'var(--hill-green)'} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{hotel.name}</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          <span style={{ fontWeight: 'bold' }}>Price:</span> ${hotel.basePrice} / night
        </p>
        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          <span style={{ fontWeight: 'bold' }}>Occupancy:</span> {hotel.bookedRooms} / {hotel.totalRooms} Rooms
        </p>
        {hotel.features && hotel.features.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {hotel.features.map((feature, idx) => (
              <span key={idx} style={{ 
                fontSize: '0.7rem', 
                padding: '0.2rem 0.5rem', 
                background: 'rgba(255, 255, 255, 0.1)', 
                borderRadius: '4px' 
              }}>
                {feature}
              </span>
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={() => !isFull && onBook && onBook(hotel)}
        disabled={isFull}
        style={{
          width: '100%',
          padding: '0.75rem',
          border: 'none',
          borderRadius: '4px',
          background: isFull ? 'rgba(255, 255, 255, 0.1)' : 'var(--hill-green)',
          color: isFull ? '#9CA3AF' : '#000',
          fontWeight: 'bold',
          cursor: isFull ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        {isFull ? <><XCircle size={16} /> NO AVAILABILITY</> : <><CheckCircle size={16} /> BOOK NOW</>}
      </button>
    </div>
  );
};

export default HotelCard;
