import React, { useState } from 'react';
import { Search, Info, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function TokenLookup({ activeQueue, allPatients, averageConsultationTime }) {
  const [lookupToken, setLookupToken] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleLookup = (e) => {
    e.preventDefault();
    setSearched(true);
    
    const formattedToken = lookupToken.trim().toUpperCase();
    if (!formattedToken) {
      setSearchResult(null);
      return;
    }

    // 1. Check if token is in active queue (waiting or serving)
    const activePatient = activeQueue.find(p => p.tokenNumber === formattedToken);
    
    if (activePatient) {
      const waitingPatients = activeQueue.filter(p => p.status === 'waiting');
      const totalWaiting = waitingPatients.length;

      let tokensAhead = 0;
      let positionInQueue = 1;

      if (activePatient.status === 'serving') {
        tokensAhead = 0;
        positionInQueue = 1;
      } else {
        // Patient is waiting. Find their index in the waiting list
        const waitingIndex = waitingPatients.findIndex(p => p.tokenNumber === formattedToken);
        tokensAhead = waitingIndex >= 0 ? waitingIndex : 0;
        // Position is (tokens ahead + 1) out of total active waiting patients
        positionInQueue = tokensAhead + 1;
      }

      const estimatedWait = tokensAhead * averageConsultationTime;

      // Progress bar math: completed portion
      // If total waiting is 0 (or somehow index out of bounds), protect math
      const denominator = Math.max(totalWaiting, 1);
      const progressRatio = (denominator - tokensAhead) / denominator;
      const filledBlocks = Math.max(0, Math.min(10, Math.round(progressRatio * 10)));
      const asciiProgress = '█'.repeat(filledBlocks) + '░'.repeat(10 - filledBlocks);
      const percentage = Math.round(progressRatio * 100);

      setSearchResult({
        found: true,
        active: true,
        patient: activePatient,
        tokensAhead,
        estimatedWait,
        positionInQueue,
        totalInQueue: totalWaiting,
        asciiProgress,
        percentage
      });
      return;
    }

    // 2. Check if token is in historical logs (completed or cancelled)
    const historyPatient = allPatients.find(p => p.tokenNumber === formattedToken);
    if (historyPatient) {
      setSearchResult({
        found: true,
        active: false,
        patient: historyPatient
      });
      return;
    }

    // 3. Not found at all
    setSearchResult({
      found: false
    });
  };

  return (
    <div className="console-lookup-section">
      <h3 style={{ fontSize: '20px', marginBottom: '16px', color: '#94A3B8' }}>
        Token Status Lookup
      </h3>

      <form onSubmit={handleLookup} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748B'
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{ 
              paddingLeft: '40px', 
              background: '#0f172a', 
              color: '#FFFFFF',
              border: '1px solid #334155'
            }}
            placeholder="Enter Token (e.g. AQ-020)"
            value={lookupToken}
            onChange={(e) => setLookupToken(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Check Status
        </button>
      </form>

      {searched && searchResult && (
        <div className="console-status-section">
          {searchResult.found ? (
            searchResult.active ? (
              // Case: Patient is in the current queue (waiting or serving)
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '15px', color: '#94A3B8', fontWeight: 600 }}>
                    Token: <strong style={{ color: '#FFFFFF' }}>{searchResult.patient.tokenNumber}</strong>
                  </span>
                  <span className={`status-badge ${searchResult.patient.status}`} style={{ fontSize: '11px' }}>
                    {searchResult.patient.status.toUpperCase()}
                  </span>
                </div>

                <div className="console-status-grid">
                  <div className="console-metric">
                    <span className="console-metric-label">Tokens Ahead</span>
                    <span className="console-metric-val" style={{ color: searchResult.tokensAhead === 0 ? '#22C55E' : '#F59E0B' }}>
                      {searchResult.tokensAhead}
                    </span>
                  </div>
                  <div className="console-metric">
                    <span className="console-metric-label">Est. Wait Time</span>
                    <span className="console-metric-val" style={{ color: '#38BDF8' }}>
                      {searchResult.estimatedWait} mins
                    </span>
                  </div>
                  <div className="console-metric" style={{ gridColumn: 'span 2', marginTop: '8px' }}>
                    <span className="console-metric-label">Queue Position</span>
                    <span className="console-metric-val" style={{ fontSize: '18px' }}>
                      {searchResult.patient.status === 'serving' 
                        ? 'Now Serving' 
                        : `${searchResult.positionInQueue} of ${searchResult.totalInQueue} waiting`}
                    </span>
                  </div>
                </div>

                {searchResult.patient.status !== 'serving' && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8', marginBottom: '4px', fontFamily: 'monospace' }}>
                      <span>Progress Status:</span>
                      <span style={{ color: '#38BDF8' }}>{searchResult.asciiProgress}</span>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${searchResult.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Case: Patient is in history (completed or cancelled)
              <div style={{ textAlign: 'center', padding: '10px' }}>
                {searchResult.patient.status === 'completed' ? (
                  <>
                    <CheckCircle size={40} color="#22C55E" style={{ margin: '0 auto 12px' }} />
                    <h4 style={{ color: '#FFFFFF', fontSize: '16px' }}>Consultation Completed</h4>
                    <p style={{ color: '#94A3B8', fontSize: '13px', marginTop: '6px' }}>
                      Token {searchResult.patient.tokenNumber} has been served. Thank you!
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle size={40} color="#EF4444" style={{ margin: '0 auto 12px' }} />
                    <h4 style={{ color: '#FFFFFF', fontSize: '16px' }}>Token Cancelled</h4>
                    <p style={{ color: '#94A3B8', fontSize: '13px', marginTop: '6px' }}>
                      Token {searchResult.patient.tokenNumber} was cancelled. Please approach the receptionist counter.
                    </p>
                  </>
                )}
              </div>
            )
          ) : (
            // Case: Token not found
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <AlertCircle size={40} color="#F59E0B" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ color: '#FFFFFF', fontSize: '16px' }}>Token Not Found</h4>
              <p style={{ color: '#94A3B8', fontSize: '13px', marginTop: '6px' }}>
                We couldn't find token <strong>{lookupToken.toUpperCase()}</strong>. Please verify the number.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lookup Guidance Empty State */}
      {!searched && (
        <div style={{ 
          background: 'rgba(255,255,255,0.02)', 
          border: '1px dashed rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center',
          color: '#64748B'
        }}>
          <Info size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontSize: '14px', lineHeight: 1.5 }}>
            Patients can enter their generated token number (e.g. AQ-021) to check live position, estimated wait times, and progress bar updates.
          </p>
        </div>
      )}
    </div>
  );
}
