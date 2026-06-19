import React from 'react';
import { Volume2 } from 'lucide-react';

export default function NowServingCard({ currentToken, patientName }) {
  return (
    <div 
      className="tv-serving-card" 
      key={currentToken || 'empty'} // Remounts card on change to trigger entrance and pulse animation
    >
      <div className="tv-serving-title">NOW SERVING</div>
      
      {currentToken ? (
        <>
          <div className="tv-serving-token tv-serving-pulse">
            {currentToken}
          </div>
          {patientName && (
            <div className="tv-serving-name">
              Patient: {patientName}
            </div>
          )}
          
          <div style={{
            marginTop: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: '#38BDF8',
            background: 'rgba(56, 189, 248, 0.1)',
            padding: '6px 16px',
            borderRadius: '20px',
            fontWeight: 700,
            border: '1px solid rgba(56, 189, 248, 0.15)'
          }}>
            <Volume2 size={16} />
            Please proceed to Room 1
          </div>
        </>
      ) : (
        <div className="tv-empty-state" style={{ padding: 0 }}>
          <div className="tv-empty-title" style={{ fontSize: '24px', color: '#64748B' }}>
            No Patient Called
          </div>
          <p style={{ color: '#475569', fontSize: '15px', marginTop: '8px' }}>
            Receptionist will call the next patient shortly.
          </p>
        </div>
      )}
    </div>
  );
}
