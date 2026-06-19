import React, { useEffect, useState, useRef } from 'react';

export default function StatsCard({ title, value, icon: Icon, type }) {
  const [animate, setAnimate] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 600);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  // Map card types to CSS classes
  const cardClass = `stat-card ${type || ''}`;

  return (
    <div className={cardClass}>
      <div className="stat-title">{title}</div>
      <div className={`stat-value ${animate ? 'stat-updated' : ''}`}>
        {value}
      </div>
      {Icon && <Icon className="stat-icon" size={48} />}
    </div>
  );
}
