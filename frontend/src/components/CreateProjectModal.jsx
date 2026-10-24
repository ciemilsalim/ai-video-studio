import React, { useState } from 'react';

export default function CreateProjectModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [voice, setVoice] = useState('id-ID-ArdiNeural');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        aspect_ratio: aspectRatio,
        voice
      });
      setTitle('');
      setDescription('');
      onClose();
    } catch (err) {
      alert(`Gagal membuat proyek: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Buat Proyek Dokumenter Baru</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Judul Dokumenter *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Contoh: Misteri Candi Borobudur & Kosmologi Kuno"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sinopsis / Deskripsi Singkat</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Eksplorasi visual sinematik mengenai peradaban kuno Nusantara..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Format Video (Aspect Ratio)</label>
              <select className="form-select" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                <option value="9:16">Vertical 9:16 (1080×1920 - Shorts / Reels)</option>
                <option value="16:9">Landscape 16:9 (1920×1080 - YouTube Long)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Default Suara Narator</label>
              <select className="form-select" value={voice} onChange={(e) => setVoice(e.target.value)}>
                <option value="id-ID-ArdiNeural">id-ID-ArdiNeural (Pria - Wibawa & Tenang)</option>
                <option value="id-ID-GadisNeural">id-ID-GadisNeural (Wanita - Natural)</option>
                <option value="en-US-BrianMultilingualNeural">en-US-Brian (English Docu Voice)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Memproses...' : 'Inisialisasi Proyek'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
