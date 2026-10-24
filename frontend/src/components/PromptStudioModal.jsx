import React, { useState, useEffect } from 'react';
import { fetchFlowPrompts, fetchFlowPromptsMarkdown } from '../services/api';

export default function PromptStudioModal({ projectId, onClose }) {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [batchCopied, setBatchCopied] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    loadPrompts();
  }, [projectId]);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const data = await fetchFlowPrompts(projectId);
      setPrompts(data);
    } catch (err) {
      alert(`Gagal memuat Flow prompts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllBatch = async () => {
    try {
      const data = await fetchFlowPromptsMarkdown(projectId);
      await navigator.clipboard.writeText(data.content);
      setBatchCopied(true);
      setTimeout(() => setBatchCopied(false), 2500);
    } catch (err) {
      alert(`Gagal copy batch: ${err.message}`);
    }
  };

  if (!projectId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="brand-badge" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8', borderColor: '#06b6d4' }}>
                GOOGLE FLOW READY
              </span>
              <h2 className="modal-title">Prompt Studio</h2>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              Kompilasi prompt sinematik siap pakai untuk generator video Google Flow.
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total Shot: <strong style={{ color: 'var(--text-main)' }}>{prompts.length}</strong>
          </div>
          <button className="btn btn-secondary" onClick={handleCopyAllBatch}>
            {batchCopied ? '✓ Disalin ke Clipboard!' : 'Salin Semua Batch (Markdown)'}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Menghitung parameter sinematografi dan menyusun prompt...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {prompts.map((p) => (
              <div key={p.shot_id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                      Shot {p.shot_id} • Adegan {p.scene_number} ({p.scene_title})
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                      Kamera: <span style={{ color: '#e2e8f0' }}>{p.camera_motion}</span> | Aspek: <span style={{ color: '#e2e8f0' }}>{p.aspect_ratio}</span> | Durasi: <span style={{ color: '#e2e8f0' }}>{p.duration_sec}s</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    onClick={() => handleCopyPrompt(p.shot_id, p.compiled_prompt)}
                  >
                    {copiedId === p.shot_id ? '✓ Tersalin' : 'Salin Prompt'}
                  </button>
                </div>

                <div className="prompt-box">
                  {p.compiled_prompt}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>Lighting: <span style={{ color: 'var(--text-muted)' }}>{p.parameters.lighting}</span></span>
                  <span>Lensa: <span style={{ color: 'var(--text-muted)' }}>{p.parameters.lens}</span></span>
                  <span>Negative: <span style={{ color: '#f87171' }}>{p.negative_prompt}</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
