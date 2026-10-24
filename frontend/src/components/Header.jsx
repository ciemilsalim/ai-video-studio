import React from 'react';
import SystemStatusBadge from './SystemStatusBadge';

export default function Header({ health, onNewProjectClick, currentView, onOpenGuide, onGoDashboard }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand" onClick={onGoDashboard} style={{ cursor: 'pointer' }} title="Kembali ke Dashboard">
          <div className="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="brand-title">AI Video Studio</span>
              <span className="brand-badge">WIN LOCAL</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Documentary Automation Engine
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <SystemStatusBadge health={health} />
          
          <button
            id="btn-nav-user-guide"
            className="btn btn-secondary"
            onClick={currentView === 'guide' ? onGoDashboard : onOpenGuide}
            style={{
              borderColor: currentView === 'guide' ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.15)',
              background: currentView === 'guide' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: currentView === 'guide' ? 'var(--accent-cyan)' : 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.85rem'
            }}
          >
            <span>{currentView === 'guide' ? '🏠' : '📖'}</span>
            <span>{currentView === 'guide' ? 'Dashboard Proyek' : 'Panduan Pengguna'}</span>
          </button>

          <button className="btn btn-primary" onClick={onNewProjectClick}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Proyek Baru
          </button>
        </div>
      </div>
    </header>
  );
}
