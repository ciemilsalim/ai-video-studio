import React from 'react';

export default function StoryboardViewer({ project, onClose, onOpenPromptStudio }) {
  if (!project) return null;

  const scenes = project.storyboard?.scenes || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="project-aspect-tag">{project.aspect_ratio}</span>
              <h2 className="modal-title">{project.title}</h2>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              Storyboard & Scene Timeline Planner ({scenes.length} Adegan)
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Resolusi:</span>
            <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{project.resolution?.width}x{project.resolution?.height}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>FPS:</span>
            <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{project.fps} CFR</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Voice Engine:</span>
            <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{project.settings?.voice}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Est Durasi:</span>
            <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>~{project.storyboard?.total_estimated_duration_sec}s</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn-primary" onClick={() => onOpenPromptStudio(project.id)}>
              Buka Google Flow Prompts
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {scenes.map((scene, idx) => (
            <div key={scene.scene_id || idx} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                  Adegan {scene.scene_number}: {scene.title}
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {scene.shots?.length || 0} Shots
                </span>
              </div>

              {scene.narration_text && (
                <div style={{ background: 'rgba(99, 102, 241, 0.08)', borderLeft: '3px solid var(--accent-primary)', padding: '0.6rem 0.85rem', marginBottom: '1rem', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 600, marginBottom: '0.2rem' }}>NASKAH VOICE-OVER:</div>
                  <div style={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'var(--text-main)' }}>"{scene.narration_text}"</div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {scene.shots?.map((shot, sIdx) => (
                  <div key={shot.shot_id || sIdx} style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--accent-cyan)', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                      <span>{shot.shot_id} • {shot.shot_type.toUpperCase()} ({shot.camera_movement})</span>
                      <span>Durasi: {shot.duration_sec}s</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                      {shot.visual_prompt}
                    </div>
                    {shot.motion_graphic?.type !== 'none' && (
                      <div style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'flex', gap: '0.4rem' }}>
                        <span>⚡ Motion Graphic:</span>
                        <span>{shot.motion_graphic.type} ("{shot.motion_graphic.headline}")</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
