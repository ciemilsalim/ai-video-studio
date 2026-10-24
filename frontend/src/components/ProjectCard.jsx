import React, { useState } from 'react';

const PROTECTED_IDS = ['misteri-gunung-merapi', 'misteri-peradaban-nusantara'];

export default function ProjectCard({
  project,
  onViewStoryboard,
  onOpenPromptStudio,
  onDeleteProject,
  onRenameProject,
  onDuplicateProject,
  onOpenRender,
  onOpenAssembly,
  onOpenAssetManager
}) {
  const [duplicating, setDuplicating] = useState(false);
  const isProtected = PROTECTED_IDS.includes(project.id);

  const handleDuplicate = async () => {
    if (duplicating || !onDuplicateProject) return;
    try {
      setDuplicating(true);
      await onDuplicateProject(project);
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <div className="project-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div className="project-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="project-aspect-tag">{project.aspect_ratio || '9:16'}</span>
            {isProtected && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  fontWeight: 600
                }}
                title="Proyek contoh bawaan sistem yang dilindungi"
              >
                🔒 Bawaan
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            {new Date(project.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <h3 className="project-title" style={{ marginTop: '0.5rem' }}>{project.title}</h3>
        <p className="project-desc">{project.description || 'Tanpa sinopsis singkat.'}</p>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <div className="project-meta">
          <div className="meta-item">
            <span>Adegan:</span>
            <span className="meta-value">{project.scenes_count || 1}</span>
          </div>
          <div className="meta-item">
            <span>Durasi Est:</span>
            <span className="meta-value">~{project.total_duration || 4}s</span>
          </div>
        </div>

        {/* Primary Row */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1, padding: '0.5rem 0.75rem' }}
            onClick={() => onViewStoryboard(project.id)}
            title="Buka Storyboard & Editor Adegan"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            Storyboard
          </button>
          <button
            className="btn btn-primary"
            style={{ padding: '0.5rem 0.85rem', background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            title="Rakit Video Multi-Adegan Final"
            onClick={() => onOpenAssembly(project)}
          >
            🎬 Rakit
          </button>
        </div>

        {/* Secondary Tool Row */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.6rem', color: '#38bdf8', fontSize: '0.78rem' }}
            title="Pustaka Aset & Footage Media"
            onClick={() => onOpenAssetManager && onOpenAssetManager(project)}
          >
            📁 Aset
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.6rem', color: '#a5b4fc', fontSize: '0.78rem' }}
            title="Prompt Studio (Google Flow Export)"
            onClick={() => onOpenPromptStudio(project.id)}
          >
            Flow
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.6rem', color: '#34d399', fontSize: '0.78rem' }}
            title="Render Demo Cepat 9:16"
            onClick={() => onOpenRender(project)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.6rem', fontSize: '0.78rem' }}
            title="Ubah Nama & Deskripsi Proyek"
            onClick={() => onRenameProject && onRenameProject(project)}
          >
            ✏️
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.6rem', fontSize: '0.78rem' }}
            title="Duplikasi Proyek Ini"
            disabled={duplicating}
            onClick={handleDuplicate}
          >
            {duplicating ? '⏳' : '📑'}
          </button>
          <button
            className="btn btn-danger"
            style={{
              padding: '0.45rem 0.65rem',
              marginLeft: 'auto',
              opacity: isProtected ? 0.6 : 1
            }}
            title={isProtected ? 'Proyek bawaan dilindungi' : 'Hapus Proyek'}
            onClick={() => onDeleteProject(project)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
