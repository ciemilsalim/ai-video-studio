import React, { useState, useEffect } from 'react';

export default function RenameProjectModal({
  isOpen,
  onClose,
  project,
  onRename
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (project) {
      setTitle(project.title || '');
      setDescription(project.description || '');
      setError(null);
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await onRename(title.trim(), description.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal mengubah nama proyek');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={loading ? null : onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Ubah Nama & Deskripsi Proyek</h2>
          {!loading && <button className="close-btn" onClick={onClose}>&times;</button>}
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
                color: '#fca5a5',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Judul Dokumenter *</label>
            <input
              type="text"
              required
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              placeholder="Judul proyek..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sinopsis / Deskripsi</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              placeholder="Deskripsi singkat dokumenter..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !title.trim()}>
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
