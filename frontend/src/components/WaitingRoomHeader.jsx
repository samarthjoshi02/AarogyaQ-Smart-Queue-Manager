import React, { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';

export function AarogyaQLogo({ size = 48, showText = true, darkTheme = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {/* Dynamic branding logo: "Q" merged with token circle, clock hands and ECG heartbeat line */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <filter id="glowLogo" x="-20%" y="-20%" width="140%" height="140%">
            <blur stdDeviation="4" result="blur" />
            <composite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Circle (Queue Token and Clock Rim) */}
        <circle 
          cx="45" 
          cy="45" 
          r="38" 
          stroke="url(#logoGrad)" 
          strokeWidth="8" 
          strokeLinecap="round"
          style={{ filter: 'url(#glowLogo)' }}
        />

        {/* Clock ticks / intervals */}
        <line x1="45" y1="13" x2="45" y2="19" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
        <line x1="77" y1="45" x2="71" y2="45" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
        <line x1="45" y1="77" x2="45" y2="71" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
        <line x1="13" y1="45" x2="19" y2="45" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />

        {/* ECG Heartbeat line inside "Q" */}
        <path 
          d="M 18,45 L 30,45 L 35,30 L 40,65 L 45,40 L 48,48 L 52,45 L 72,45" 
          stroke="#22C55E" 
          strokeWidth="5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />

        {/* Clock Hands pointing to 2:15 (Time theme) */}
        <line x1="45" y1="45" x2="45" y2="28" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
        <line x1="45" y1="45" x2="58" y2="45" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
        <circle cx="45" cy="45" r="5" fill="#38BDF8" />

        {/* The Tail of Q (Token base slot/chute) */}
        <path 
          d="M 72,72 L 90,90" 
          stroke="url(#logoGrad)" 
          strokeWidth="10" 
          strokeLinecap="round" 
          style={{ filter: 'url(#glowLogo)' }}
        />
        {/* Sparkle dot at tail */}
        <circle cx="90" cy="90" r="4" fill="#38BDF8" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{ 
            fontSize: size * 0.5 + 'px', 
            fontWeight: 800, 
            letterSpacing: '-0.03em',
            color: darkTheme ? '#FFFFFF' : 'var(--primary)'
          }}>
            Aarogya<span style={{ color: '#38BDF8' }}>Q</span>
          </span>
          <span style={{ 
            fontSize: size * 0.16 + 'px', 
            fontWeight: 600, 
            letterSpacing: '0.05em',
            color: darkTheme ? '#94A3B8' : 'var(--text-muted)'
          }}>
            Know Your Turn. Value Your Time.
          </span>
        </div>
      )}
    </div>
  );
}

export default function WaitingRoomHeader() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatLongDate = (d) => {
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (d) => {
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="tv-header">
      <div className="tv-brand">
        <AarogyaQLogo size={56} darkTheme={true} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 600 }}>
            {formatLongDate(time)}
          </div>
          <div style={{ fontSize: '12px', color: '#38BDF8', fontWeight: 700, letterSpacing: '0.05em' }}>
            CLINIC WAITING ROOM
          </div>
        </div>
        <div className="tv-clock">
          <Clock size={20} style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline-block' }} />
          {formatTime(time)}
        </div>
      </div>
    </div>
  );
}
