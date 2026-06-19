import React, { useState } from 'react';
import { Play, Ban, RefreshCw, AlertTriangle } from 'lucide-react';

export default function QueueControls({ 
  selectedToken, 
  isQueueEmpty, 
  onCallNext, 
  onCancelToken, 
  onRefreshQueue,
  nextWaitingToken // Pass next token to show in confirmation dialog e.g. "AQ-016"
}) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'call' or 'cancel'

  const handleCallClick = () => {
    setModalType('call');
    setShowConfirmModal(true);
  };

  const handleCancelClick = () => {
    if (!selectedToken) return;
    setModalType('cancel');
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    setShowConfirmModal(false);
    if (modalType === 'call') {
      onCallNext();
    } else if (modalType === 'cancel' && selectedToken) {
      onCancelToken(selectedToken);
    }
    setModalType(null);
  };

  const handleCancelModal = () => {
    setShowConfirmModal(false);
    setModalType(null);
  };

  return (
    <div className="control-bar">
      <button 
        type="button" 
        className="btn btn-primary" 
        disabled={isQueueEmpty}
        onClick={handleCallClick}
      >
        <Play size={16} />
        Call Next Patient
      </button>

      <button 
        type="button" 
        className="btn btn-danger" 
        disabled={!selectedToken}
        onClick={handleCancelClick}
      >
        <Ban size={16} />
        Cancel Token {selectedToken && `(${selectedToken})`}
      </button>

      <button 
        type="button" 
        className="btn btn-outline"
        onClick={onRefreshQueue}
      >
        <RefreshCw size={16} />
        Refresh Queue
      </button>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <AlertTriangle size={32} color={modalType === 'cancel' ? 'var(--error)' : 'var(--primary)'} />
              <h3 style={{ fontSize: '18px' }}>Confirm Action</h3>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.6 }}>
              {modalType === 'call' ? (
                nextWaitingToken ? (
                  <>Are you sure you want to call <strong>{nextWaitingToken}</strong> to the doctor's room?</>
                ) : (
                  <>Are you sure you want to call the next patient in the queue?</>
                )
              ) : (
                <>Are you sure you want to cancel the token <strong>{selectedToken}</strong>? This action cannot be undone.</>
              )}
            </p>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={handleCancelModal}>
                Go Back
              </button>
              <button 
                className={`btn ${modalType === 'cancel' ? 'btn-danger' : 'btn-primary'}`} 
                onClick={handleConfirm}
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
