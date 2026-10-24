import React from 'react';

export default function ProjectCard({ project, onViewStoryboard, onOpenPromptStudio, onDeleteProject, onOpenRender }) {
  return (
    <div className="project-card">
      <div>
        <div className="project-card-header">
          <span className="project-aspect-tag">{project.aspect_ratio || '9:16'}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            {new Date(project.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <h3 className="project-title">{project.title}</h3>
        <p className="project-desc">{project.description || 'Tanpa sinopsis singkat.'}</p>
      </div>

      <div>
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

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ padding: '0.5rem 0.85rem', background: 'linear-gradient(135deg, #10b981, #059669)', borderColor: '#059669' }} title="Render Demo Vertikal 1080x1920" onClick={() => onOpenRender(project)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Render 9:16
          </button>
          <button className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem 0.75rem' }} onClick={() => onViewStoryboard(project.id)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            Storyboard
          </button>
          <button className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', color: '#38bdf8' }} title="Prompt Studio (Google Flow)" onClick={() => onOpenPromptStudio(project.id)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="10 8 16 12 10 16 10 8"></polygon>
            </svg>
            Flow
          </button>
          <button className="btn btn-danger" style={{ padding: '0.5rem 0.75rem' }} title="Hapus Proyek" onClick={() => onDeleteProject(project.id)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
