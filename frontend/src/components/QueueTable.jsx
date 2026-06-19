import React, { useState } from 'react';
import { Search, ArrowUpDown, Clock, Phone, User, CheckCircle2, Ban } from 'lucide-react';

export default function QueueTable({ queue, selectedToken, onSelectToken }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  // Format date helper
  const formatTime = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoString;
    }
  };

  // Filter patients based on search term (searches token AND mobile)
  const filteredQueue = queue.filter((p) => {
    const term = searchTerm.toLowerCase();
    const tokenMatch = p.tokenNumber.toLowerCase().includes(term);
    const mobileMatch = p.mobile && p.mobile.includes(term);
    return tokenMatch || mobileMatch;
  });

  // Sort patients by token counter value (numerical portion of AQ-XXX)
  const sortedQueue = [...filteredQueue].sort((a, b) => {
    const numA = parseInt(a.tokenNumber.split('-')[1], 10) || 0;
    const numB = parseInt(b.tokenNumber.split('-')[1], 10) || 0;
    return sortAsc ? numA - numB : numB - numA;
  });

  const handleRowClick = (tokenNumber) => {
    if (onSelectToken) {
      // Toggle selection: deselect if clicked again
      onSelectToken(selectedToken === tokenNumber ? null : tokenNumber);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'serving':
        return <span className="status-badge serving">Serving</span>;
      case 'completed':
        return <span className="status-badge completed">Completed</span>;
      case 'cancelled':
        return <span className="status-badge cancelled">Cancelled</span>;
      case 'waiting':
      default:
        return <span className="status-badge waiting">Waiting</span>;
    }
  };

  return (
    <div className="queue-table-section">
      <div className="search-filter-row">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '40px' }}
            placeholder="Search by token (e.g. AQ-001) or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => setSortAsc(!sortAsc)}
          title="Toggle Token Sort Order"
        >
          <ArrowUpDown size={18} />
          Sort {sortAsc ? 'Asc' : 'Desc'}
        </button>
      </div>

      <div className="table-container">
        {sortedQueue.length === 0 ? (
          <div className="empty-state">
            <User className="empty-state-icon" size={48} />
            <div className="empty-state-title">No Patients Found</div>
            <div>Try refining your search keyword or add a new patient.</div>
          </div>
        ) : (
          <table className="queue-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient Name</th>
                <th>Mobile</th>
                <th>Joined Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedQueue.map((patient) => {
                const isSelected = selectedToken === patient.tokenNumber;
                const isServing = patient.status === 'serving';
                
                return (
                  <tr
                    key={patient.tokenNumber}
                    onClick={() => handleRowClick(patient.tokenNumber)}
                    className={`${isSelected ? 'serving-row' : ''} ${isServing ? 'serving-tr' : ''}`}
                    style={{
                      cursor: 'pointer',
                      background: isSelected 
                        ? 'var(--primary-light)' 
                        : isServing 
                          ? 'rgba(34, 197, 94, 0.08)' 
                          : '',
                      fontWeight: isServing ? 'bold' : 'normal'
                    }}
                  >
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        {patient.tokenNumber}
                      </span>
                    </td>
                    <td>{patient.patientName}</td>
                    <td>
                      {patient.mobile ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={12} className="text-muted" /> {patient.mobile}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                      )}
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={12} className="text-muted" /> {formatTime(patient.joinedAt)}
                      </span>
                    </td>
                    <td>{getStatusBadge(patient.status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
