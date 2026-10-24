import React from 'react';

export default function SystemStatusBadge({ health }) {
  if (!health) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-warning)' }}></span>
        Connecting to Engine...
      </div>
    );
  }

  const isFfmpegOk = health?.ffmpeg?.available;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-success)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-success)', boxShadow: '0 0 8px var(--accent-success)' }}></span>
        Backend v{health.version}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: isFfmpegOk ? '#38bdf8' : 'var(--accent-danger)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: isFfmpegOk ? '#38bdf8' : 'var(--accent-danger)' }}></span>
        FFmpeg 7.1 {isFfmpegOk ? 'Ready' : 'Missing'}
      </div>
    </div>
  );
}
