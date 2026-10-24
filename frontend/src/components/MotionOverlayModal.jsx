import React, { useState, useEffect } from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import {
  fetchMotionTemplates,
  fetchSceneOverlays,
  addSceneOverlay,
  updateSceneOverlay,
  deleteSceneOverlay,
  getOverlayPreviewUrl
} from '../services/api';

export default function MotionOverlayModal({
  projectId,
  scene,
  isOpen,
  onClose,
  onSceneUpdated
}) {
  const [templates, setTemplates] = useState([]);
  const [overlays, setOverlays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [overlayToDelete, setOverlayToDelete] = useState(null);

  // Form state
  const [selectedTemplateId, setSelectedTemplateId] = useState('kinetic_title');
  const [startTime, setStartTime] = useState(0.0);
  const [duration, setDuration] = useState(3.0);
  const [layer, setLayer] = useState(1);
  const [position, setPosition] = useState('center');
  const [contentForm, setContentForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && projectId && scene?.scene_id) {
      loadData();
    }
  }, [isOpen, projectId, scene?.scene_id]);

  useEffect(() => {
    // When template selection changes, initialize content with template defaults
    const tmpl = templates.find((t) => t.template_id === selectedTemplateId);
    if (tmpl && tmpl.default_content) {
      setContentForm({ ...tmpl.default_content });
    }
  }, [selectedTemplateId, templates]);

  if (!isOpen || !scene) return null;

  const sceneDuration = scene.target_duration_seconds || 4.0;

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [tmplList, ovlList] = await Promise.all([
        fetchMotionTemplates(),
        fetchSceneOverlays(projectId, scene.scene_id)
      ]);
      setTemplates(tmplList);
      setOverlays(ovlList);

      if (tmplList.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(tmplList[0].template_id);
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat data motion graphics');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOverlay = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        template_id: selectedTemplateId,
        start_time: parseFloat(startTime) || 0.0,
        duration: parseFloat(duration) || 3.0,
        layer: parseInt(layer, 10) || 1,
        position,
        content: contentForm,
        enabled: true
      };

      await addSceneOverlay(projectId, scene.scene_id, payload);
      await loadData();
      if (onSceneUpdated) onSceneUpdated();
    } catch (err) {
      setError(err.message || 'Gagal menambahkan overlay');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEnabled = async (overlay) => {
    try {
      await updateSceneOverlay(projectId, scene.scene_id, overlay.overlay_id, {
        enabled: !overlay.enabled
      });
      await loadData();
      if (onSceneUpdated) onSceneUpdated();
    } catch (err) {
      alert(`Gagal mengubah status: ${err.message}`);
    }
  };

  const handleConfirmDeleteOverlay = async () => {
    if (!overlayToDelete) return;
    try {
      await deleteSceneOverlay(projectId, scene.scene_id, overlayToDelete.overlay_id);
      await loadData();
      if (onSceneUpdated) onSceneUpdated();
    } catch (err) {
      alert(`Gagal menghapus overlay: ${err.message}`);
      throw err;
    }
  };

  const previewUrl = getOverlayPreviewUrl(selectedTemplateId, contentForm, 1.0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '1020px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="project-aspect-tag" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                ✨ MOTION GRAPHICS
              </span>
              <h2 className="modal-title">Adegan #{scene.scene_number}: {scene.title}</h2>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              Investigative Motion Graphics Studio • Durasi Adegan: {sceneDuration}s
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', color: '#fca5a5', marginBottom: '1rem', fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.35rem' }}>
          {/* Active Overlays List */}
          <div style={{ marginBottom: '1.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                Daftar Overlay Aktif ({overlays.length})
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                Urutan layer rendah → tinggi (Layer tinggi tampil di atas)
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                Memuat daftar overlay...
              </div>
            ) : overlays.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-subtle)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Belum ada motion graphics overlay pada adegan ini.
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Gunakan form di bawah untuk menambahkan titlecard, stat card, timeline marker, atau HUD.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {overlays.map((ovl) => {
                  const tmplInfo = templates.find((t) => t.template_id === ovl.template_id);
                  return (
                    <div
                      key={ovl.overlay_id}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: `1px solid ${ovl.enabled ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        opacity: ovl.enabled ? 1 : 0.6
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          LAYER {ovl.layer}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
                            {tmplInfo?.name || ovl.template_id}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                            Waktu: {ovl.start_time}s → {Math.min(sceneDuration, ovl.start_time + ovl.duration).toFixed(1)}s (Durasi: {ovl.duration}s) • Posisi: {ovl.position}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          className="btn btn-secondary"
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.25rem 0.55rem',
                            borderColor: ovl.enabled ? '#10b981' : '#64748b',
                            color: ovl.enabled ? '#34d399' : '#94a3b8'
                          }}
                          onClick={() => handleToggleEnabled(ovl)}
                        >
                          {ovl.enabled ? '✓ Aktif' : 'Off'}
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                          onClick={() => setOverlayToDelete(ovl)}
                          title="Hapus grafis animasi overlay ini"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Overlay Form */}
          <form onSubmit={handleAddOverlay} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>➕</span> Tambah Motion Graphics Overlay Baru
            </h3>

            {/* Template Selection Tabs */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Pilih Template Motion Graphics:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
                {templates.map((tmpl) => {
                  const isSelected = tmpl.template_id === selectedTemplateId;
                  return (
                    <div
                      key={tmpl.template_id}
                      onClick={() => setSelectedTemplateId(tmpl.template_id)}
                      style={{
                        background: isSelected ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-secondary)',
                        border: `1.5px solid ${isSelected ? '#ef4444' : 'rgba(255, 255, 255, 0.08)'}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#ef4444' : '#f8fafc', marginBottom: '0.25rem' }}>
                        {tmpl.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.3 }}>
                        {tmpl.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
              {/* Content Inputs customized for selected template */}
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.75rem' }}>
                  Konten Template ({selectedTemplateId})
                </h4>

                {selectedTemplateId === 'kinetic_title' && (
                  <>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Judul Utama *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Contoh: PERADABAN YANG HILANG"
                        value={contentForm.title || ''}
                        onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Sub-Judul</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Contoh: Analisis Forensik & Temuan Megalitik"
                        value={contentForm.subtitle || ''}
                        onChange={(e) => setContentForm({ ...contentForm, subtitle: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Tag Arsip / Nomor Kasus</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Contoh: ARSIP INVESTIGASI // KASUS #01"
                        value={contentForm.tag || ''}
                        onChange={(e) => setContentForm({ ...contentForm, tag: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {selectedTemplateId === 'stat_card' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Nilai Statistik *</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="Contoh: 4.200"
                          value={contentForm.value || ''}
                          onChange={(e) => setContentForm({ ...contentForm, value: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Unit / Satuan</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ha / % / Km²"
                          value={contentForm.unit || ''}
                          onChange={(e) => setContentForm({ ...contentForm, unit: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Label Pengukuran *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Contoh: Hektar Hutan Hilang Selama 5 Tahun"
                        value={contentForm.label || ''}
                        onChange={(e) => setContentForm({ ...contentForm, label: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Sumber Data</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Contoh: Laporan Satelit Forensik 2024"
                        value={contentForm.source || ''}
                        onChange={(e) => setContentForm({ ...contentForm, source: e.target.value })}
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                        *Prinsip Kejujuran Data: Jika dikosongkan, label sumber otomatis menampilkan "SUMBER: BELUM DICANTUMKAN".
                      </span>
                    </div>
                  </>
                )}

                {selectedTemplateId === 'timeline_event' && (
                  <>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Tanggal / Periode Waktu *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Contoh: 14 OKTOBER 2024 • 03:15 WIB"
                        value={contentForm.date_or_period || ''}
                        onChange={(e) => setContentForm({ ...contentForm, date_or_period: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Judul Peristiwa *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Contoh: Titik Anomali Terdeteksi"
                        value={contentForm.event_title || ''}
                        onChange={(e) => setContentForm({ ...contentForm, event_title: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Lokasi</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Contoh: Pos Pengamatan Sektor Barat"
                        value={contentForm.location || ''}
                        onChange={(e) => setContentForm({ ...contentForm, location: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Deskripsi Ringkas</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Contoh: Sensor seismik mencatat amplitudo maksimum 48 mm."
                        value={contentForm.description || ''}
                        onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {selectedTemplateId === 'investigation_hud' && (
                  <>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Koordinat GPS / Label Lokasi *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Contoh: LAT -7.5401° S, LONG 110.4456° E"
                        value={contentForm.coordinates_or_location || ''}
                        onChange={(e) => setContentForm({ ...contentForm, coordinates_or_location: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Kode / Nomor Bukti *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Contoh: EVID-098-B"
                        value={contentForm.evidence_code || ''}
                        onChange={(e) => setContentForm({ ...contentForm, evidence_code: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Klasifikasi Dokumen</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="DOKUMEN RAHASIA"
                          value={contentForm.classification || ''}
                          onChange={(e) => setContentForm({ ...contentForm, classification: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Label Timecode</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="REC • 00:04:12"
                          value={contentForm.timestamp_label || ''}
                          onChange={(e) => setContentForm({ ...contentForm, timestamp_label: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Timing & Layer Parameters */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Mulai (s)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max={Math.max(0, sceneDuration - 0.5)}
                      className="form-input"
                      value={startTime}
                      onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Durasi (s)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max={sceneDuration}
                      className="form-input"
                      value={duration}
                      onChange={(e) => setDuration(parseFloat(e.target.value) || 1.0)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Layer</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="form-input"
                      value={layer}
                      onChange={(e) => setLayer(parseInt(e.target.value, 10) || 1)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Posisi</label>
                    <select
                      className="form-select"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                    >
                      <option value="center">Tengah</option>
                      <option value="bottom">Bawah</option>
                      <option value="top">Atas</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Live Preview Frame Box */}
              <div style={{ background: '#070b14', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.5rem', width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Live Frame Preview (9:16)</span>
                  <span style={{ color: '#ef4444', fontFamily: 'var(--font-mono)' }}>t=1.0s</span>
                </div>
                <div style={{ width: '180px', height: '320px', background: '#0b1120', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={previewUrl}
                    alt="Preview Motion Graphics"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                  Overlay transparan 1080×1920 30 FPS
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Tutup
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              >
                {submitting ? 'Menyimpan...' : '+ Tambah Overlay ke Adegan'}
              </button>
            </div>
          </form>
        </div>

        {/* Delete Overlay Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={!!overlayToDelete}
          onClose={() => setOverlayToDelete(null)}
          onConfirm={handleConfirmDeleteOverlay}
          title="Hapus Motion Graphics Overlay"
          itemType="Overlay Grafis"
          itemName={overlayToDelete ? `${overlayToDelete.template_id} (${overlayToDelete.start_time}s - ${overlayToDelete.start_time + overlayToDelete.duration}s)` : ''}
          details="Lapisan grafis animasi ini akan dihapus dari adegan storyboard."
        />
      </div>
    </div>
  );
}
