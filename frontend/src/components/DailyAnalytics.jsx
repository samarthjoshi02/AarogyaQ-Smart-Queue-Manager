import React from 'react';
import { BarChart3, TrendingUp, Users, Calendar, Clock, Trophy } from 'lucide-react';

export default function DailyAnalytics({ analytics }) {
  const {
    patientsServedToday = 0,
    averageWaitMins = 0,
    longestWaitMins = 0,
    peakHour = 'N/A',
    currentQueueLength = 0,
    servedByHour = [],
    queueLengthTimeline = []
  } = analytics || {};

  // --- SVG Math for Area Chart (Queue Length Timeline) ---
  const renderAreaChart = () => {
    if (queueLengthTimeline.length === 0) return null;

    const width = 500;
    const height = 150;
    const paddingX = 40;
    const paddingY = 20;

    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingY * 2;

    const maxLen = Math.max(...queueLengthTimeline.map((d) => d.length), 4); // Min ceiling of 4 for scale

    const points = queueLengthTimeline.map((d, index) => {
      const x = paddingX + (index / (queueLengthTimeline.length - 1)) * chartWidth;
      const y = paddingY + chartHeight - (d.length / maxLen) * chartHeight;
      return { x, y, val: d.length, label: d.hour };
    });

    // Generate SVG path string
    let linePath = '';
    let areaPath = '';

    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y}`;
      points.forEach((p, idx) => {
        if (idx > 0) {
          linePath += ` L ${p.x} ${p.y}`;
        }
      });

      // Close the area path for fill gradient
      areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = paddingY + chartHeight * ratio;
          const label = Math.round(maxLen * (1 - ratio));
          return (
            <g key={i}>
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="var(--border)" strokeDasharray="4 4" />
              <text x={paddingX - 10} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)" fontWeight="600">
                {label}
              </text>
            </g>
          );
        })}

        {/* Area and Line */}
        {points.length > 0 && (
          <>
            <path d={areaPath} fill="url(#areaGradient)" />
            <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {/* Interactive Dots */}
        {points.map((p, idx) => (
          <g key={idx} className="chart-dot-group">
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="var(--card-bg)"
              stroke="var(--primary)"
              strokeWidth="2.5"
            />
            {/* Tooltip on Hover */}
            <circle
              cx={p.x}
              cy={p.y}
              r="15"
              fill="transparent"
              style={{ cursor: 'pointer' }}
            />
            <title>{`${p.label}: ${p.val} patients waiting`}</title>
          </g>
        ))}

        {/* X Axis Labels */}
        {points.map((p, idx) => {
          // Show label for every alternate point to prevent crowding
          if (idx % 2 !== 0 && idx !== points.length - 1) return null;
          return (
            <text
              key={idx}
              x={p.x}
              y={height - 2}
              textAnchor="middle"
              fontSize="9"
              fill="var(--text-muted)"
              fontWeight="600"
            >
              {p.label}
            </text>
          );
        })}
      </svg>
    );
  };

  // --- SVG Math for Bar Chart (Patients Served by Hour) ---
  const renderBarChart = () => {
    if (servedByHour.length === 0) return null;

    const width = 500;
    const height = 150;
    const paddingX = 40;
    const paddingY = 20;

    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingY * 2;

    const maxVal = Math.max(...servedByHour.map((d) => d.count), 4); // Min ceiling of 4

    const barWidth = (chartWidth / servedByHour.length) * 0.7;
    const barSpacing = (chartWidth / servedByHour.length) * 0.3;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#86EFAC" />
          </linearGradient>
        </defs>

        {/* Y Axis Grid Lines */}
        {[0, 0.5, 1].map((ratio, i) => {
          const y = paddingY + chartHeight * ratio;
          const label = Math.round(maxVal * (1 - ratio));
          return (
            <g key={i}>
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="var(--border)" strokeDasharray="4 4" />
              <text x={paddingX - 10} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)" fontWeight="600">
                {label}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {servedByHour.map((d, index) => {
          const x = paddingX + index * (barWidth + barSpacing) + barSpacing / 2;
          const barHeight = (d.count / maxVal) * chartHeight;
          const y = paddingY + chartHeight - barHeight;

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="url(#barGradient)"
                rx="4"
                style={{ cursor: 'pointer', transition: 'height 0.3s ease' }}
              />
              <title>{`${d.hour}: ${d.count} patients served`}</title>
              {/* Count label above bar */}
              {d.count > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--text-main)"
                  fontWeight="700"
                >
                  {d.count}
                </text>
              )}
            </g>
          );
        })}

        {/* X Axis Labels */}
        {servedByHour.map((d, index) => {
          if (index % 2 !== 0 && index !== servedByHour.length - 1) return null;
          const x = paddingX + index * (barWidth + barSpacing) + barWidth / 2 + barSpacing / 2;
          return (
            <text
              key={index}
              x={x}
              y={height - 2}
              textAnchor="middle"
              fontSize="9"
              fill="var(--text-muted)"
              fontWeight="600"
            >
              {d.hour}
            </text>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="daily-analytics-section">
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card served" style={{ padding: '20px' }}>
          <div className="stat-title">Served Today</div>
          <div className="stat-value">{patientsServedToday}</div>
          <Trophy className="stat-icon" size={36} />
        </div>
        <div className="stat-card avg-time" style={{ padding: '20px' }}>
          <div className="stat-title">Avg Wait Time</div>
          <div className="stat-value">{averageWaitMins}m</div>
          <Clock className="stat-icon" size={36} />
        </div>
        <div className="stat-card" style={{ padding: '20px' }} type="longest-wait">
          <div className="stat-title">Longest Wait</div>
          <div className="stat-value">{longestWaitMins}m</div>
          <TrendingUp className="stat-icon" size={36} />
        </div>
        <div className="stat-card waiting" style={{ padding: '20px' }}>
          <div className="stat-title">Peak Hour</div>
          <div className="stat-value">{peakHour}</div>
          <Calendar className="stat-icon" size={36} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="dashboard-panel">
          <div className="panel-title" style={{ fontSize: '16px', marginBottom: '16px' }}>
            <TrendingUp size={16} className="text-primary" />
            Queue Length Timeline (Hourly)
          </div>
          <div style={{ padding: '10px 0' }}>{renderAreaChart()}</div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-title" style={{ fontSize: '16px', marginBottom: '16px' }}>
            <BarChart3 size={16} className="text-primary" />
            Patients Served by Hour
          </div>
          <div style={{ padding: '10px 0' }}>{renderBarChart()}</div>
        </div>
      </div>
    </div>
  );
}
