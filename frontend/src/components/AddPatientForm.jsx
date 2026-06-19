import React, { useState, useRef, useEffect } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';

export default function AddPatientForm({ onAddPatient }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');

  const nameInputRef = useRef(null);

  // Auto focus name input on load
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Form validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Patient name is required.');
      nameInputRef.current.focus();
      return;
    }

    if (mobile.trim() && !/^\d{10}$/.test(mobile.trim())) {
      setError('Mobile number must be a 10-digit number.');
      return;
    }

    if (age.trim()) {
      const ageNum = parseInt(age, 10);
      if (isNaN(ageNum) || ageNum <= 0 || ageNum > 125) {
        setError('Please enter a valid age (1-125).');
        return;
      }
    }

    // Submit callback
    onAddPatient({
      name: trimmedName,
      mobile: mobile.trim(),
      age: age.trim()
    });

    // Clear form & auto-focus back on name
    handleClear();
  };

  const handleClear = () => {
    setName('');
    setMobile('');
    setAge('');
    setError('');
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-patient-form">
      {error && (
        <div style={{
          padding: '10px 14px',
          background: 'var(--error-light)',
          color: 'var(--error)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '16px',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          {error}
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="patient-name">Patient Name *</label>
        <input
          ref={nameInputRef}
          type="text"
          id="patient-name"
          className="form-input"
          placeholder="Enter patient full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="mobile-number">Mobile Number (Optional)</label>
        <input
          type="tel"
          id="mobile-number"
          className="form-input"
          placeholder="e.g. 9876543210"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          maxLength={10}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="patient-age">Age (Optional)</label>
        <input
          type="number"
          id="patient-age"
          className="form-input"
          placeholder="e.g. 24"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          min={1}
          max={125}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
          <UserPlus size={18} />
          Add Patient
        </button>
        <button type="button" className="btn btn-outline" onClick={handleClear}>
          <Trash2 size={18} />
          Clear
        </button>
      </div>
    </form>
  );
}
