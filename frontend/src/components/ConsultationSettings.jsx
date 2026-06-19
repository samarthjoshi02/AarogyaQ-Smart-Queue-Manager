import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw } from 'lucide-react';

export default function ConsultationSettings({ currentValue, onSave, onReset }) {
  const [val, setVal] = useState(currentValue || 7);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Update local value if prop changes
  useEffect(() => {
    setVal(currentValue || 7);
  }, [currentValue]);

  const handleSave = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const numericVal = parseInt(val, 10);
    if (isNaN(numericVal) || numericVal < 1 || numericVal > 60) {
      setError('Average consultation time must be between 1 and 60 minutes.');
      return;
    }

    onSave(numericVal);
    setSuccessMsg('Settings updated successfully!');
    const t = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(t);
  };

  const handleResetClick = () => {
    setError('');
    setSuccessMsg('');
    onReset();
    setSuccessMsg('Reset to default value.');
    const t = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(t);
  };

  return (
    <div className="dashboard-panel">
      <div className="panel-title">
        <Settings size={20} className="text-primary" />
        Consultation Settings
      </div>

      <form onSubmit={handleSave}>
        {error && (
          <div style={{
            padding: '8px 12px',
            background: 'var(--error-light)',
            color: 'var(--error)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            marginBottom: '16px',
            fontWeight: 600
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            padding: '8px 12px',
            background: 'var(--success-light)',
            color: 'var(--success)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            marginBottom: '16px',
            fontWeight: 600
          }}>
            {successMsg}
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="consultation-time">
            Average Consultation Time (Minutes)
          </label>
          <input
            type="number"
            id="consultation-time"
            className="form-input"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            min={1}
            max={60}
            required
          />
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Note: Changing this updates patient waiting estimates in real-time. (Min: 1, Max: 60)
          </p>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
            <Save size={16} />
            Save Settings
          </button>
          <button type="button" className="btn btn-outline" onClick={handleResetClick}>
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
