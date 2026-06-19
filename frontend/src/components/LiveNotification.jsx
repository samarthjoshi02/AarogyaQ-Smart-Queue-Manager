import React, { useEffect } from 'react';
import { BellRing } from 'lucide-react';
import { playChime } from './AudioChime';

export default function LiveNotification({ notification }) {
  useEffect(() => {
    if (notification && notification.tokenNumber) {
      // Automatically play synthesized medical alert chime on call
      playChime();
    }
  }, [notification]);

  if (!notification || !notification.tokenNumber) return null;

  return (
    <div className="tv-alert-overlay">
      <div className="tv-alert-bell">🔔</div>
      <div className="tv-alert-text">
        <span className="tv-alert-sub">Now Calling</span>
        <span className="tv-alert-main">
          {notification.tokenNumber} : {notification.patientName}
        </span>
        <span style={{ 
          fontSize: '12px', 
          color: '#E0F2FE', 
          marginTop: '4px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <BellRing size={12} />
          Please proceed to Room 1 immediately.
        </span>
      </div>
    </div>
  );
}
