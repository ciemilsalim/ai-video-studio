import React, { useState, useEffect } from 'react';
import {
  fetchAssets,
  importAsset,
  uploadAsset,
  attachAsset,
  detachAsset,
  deleteAsset
} from '../services/api';

export default function AssetManagerModal({
  project,
  isOpen,
  onClose,
  onProjectUpdated,
  initialSceneId = null
}) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ingestion inputs
  const [importPath, setImportPath] = useState('');
  const [targetSceneId, setTargetSceneId] = useState(initialSceneId || '');
  const [uploadFile, setUploadFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Preview state
  const [previewAsset, setPreviewAsset] = useState(null);

  useEffect(() => {
    if (isOpen && project?.id) {
      loadAssets();
      if (initialSceneId) {
        setTargetSceneId(initialSceneId);
      }
    }
  }, [isOpen, project?.id, initialSceneId]);

  if (!isOpen || !project) return null;

  const scenes = project.storyboard?.scenes || [];

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAssets(project.id);
      setAssets(data);
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar aset');
    } finally {
      setLoading(false);
    }
  };

  const handleImportByPath = async (e) => {
    e.preventDefault();
    if (!importPath.trim()) return;

    try {
      setActionLoading(true);
      setError(null);
      await importAsset(project.id, importPath.trim(), targetSceneId || null);
      setImportPath('');
      await loadAssets();
      if (onProjectUpdated) {
        const res = await fetch(`/api/projects/${project.id}`);
        const updated = await res.json();
        onProjectUpdated(updated);
      }
    } catch (err) {
      setError(err.message || 'Gagal mengimpor file lokal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    try {
      setActionLoading(true);
      setError(null);
      await uploadAsset(project.id, uploadFile, targetSceneId || null);
      setUploadFile(null);
      // Reset file input element
      const fileInput = document.getElementById('asset-file-input');
      if (fileInput) fileInput.value = '';
      await loadAssets();
      if (onProjectUpdated) {
        const res = await fetch(`/api/projects/${project.id}`);
        const updated = await res.json();
        onProjectUpdated(updated);
      }
    } catch (err) {
      setError(err.message || 'Gagal mengunggah file media');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAttachToScene = async (assetId, sceneId) => {
    try {
      setActionLoading(true);
      setError(null);
      await attachAsset(project.id, assetId, sceneId);
      await loadAssets();
      if (onProjectUpdated) {
        const res = await fetch(`/api/projects/${project.id}`);
        const updated = await res.json();
        onProjectUpdated(updated);
      }
    } catch (err) {
      setError(err.message || 'Gagal menautkan aset');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDetach = async (sceneId) => {
    try {
      setActionLoading(true);
      setError(null);
      await detachAsset(project.id, sceneId);
      await loadAssets();
      if (onProjectUpdated) {
        const res = await fetch(`/api/projects/${project.id}`);
        const updated = await res.json();
        onProjectUpdated(updated);
      }
    } catch (err) {
      setError(err.message || 'Gagal melepas aset');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (assetId) => {
    if (!window.confirm('Hapus aset ini dari pustaka proyek? File di disk akan dihapus.')) return;
    try {
      setActionLoading(true);
      setError(null);
      await deleteAsset(project.id, assetId);
      await loadAssets();
      if (onProjectUpdated) {
        const res = await fetch(`/api/projects/${project.id}`);
        const updated = await res.json();
        onProjectUpdated(updated);
      }
    } catch (err) {
      setError(err.message || 'Gagal menghapus aset');
    } finally {
      setActionLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
              <span className="project-aspect-tag" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                📁 ASSET MANAGER
              </span>
              <h2 className="modal-title">{project.title}</h2>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              Pustaka Visual & Ingest Footage Lokal ({assets.length} Aset Terdaftar)
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
          {/* Ingestion Panel */}
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📥</span> Ingest Footage atau Gambar Baru
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {/* Option A: Local Path */}
              <form onSubmit={handleImportByPath} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
                  Metode 1: Path File Lokal Windows
                </div>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: D:\Footage\candi_drone.mp4"
                    value={importPath}
                    onChange={(e) => setImportPath(e.target.value)}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Mendukung MP4, MOV, WebM, MKV, PNG, JPG (Maks 500MB).
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Tautkan Langsung ke Adegan (Opsional)</label>
                  <select
                    className="form-select"
                    value={targetSceneId}
                    onChange={(e) => setTargetSceneId(e.target.value)}
                  >
                    <option value="">-- Jangan tautkan (hanya simpan di pustaka) --</option>
                    {scenes.map((sc) => (
                      <option key={sc.scene_id} value={sc.scene_id}>
                        Adegan #{sc.scene_number}: {sc.title}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-secondary"
                  disabled={actionLoading || !importPath.trim()}
                  style={{ width: '100%', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', fontSize: '0.8rem' }}
                >
                  {actionLoading ? 'Memproses...' : 'Import dari Path Lokal'}
                </button>
              </form>

              {/* Option B: Direct File Upload */}
              <form onSubmit={handleUploadFile} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#a5b4fc', marginBottom: '0.5rem' }}>
                  Metode 2: Unggah File Media
                </div>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <input
                    id="asset-file-input"
                    type="file"
                    className="form-input"
                    accept="video/mp4,video/quicktime,video/webm,video/x-matroska,image/png,image/jpeg,image/webp"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Pilih file media dari browser untuk diimpor ke proyek.
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Tautkan Langsung ke Adegan (Opsional)</label>
                  <select
                    className="form-select"
                    value={targetSceneId}
                    onChange={(e) => setTargetSceneId(e.target.value)}
                  >
                    <option value="">-- Jangan tautkan (hanya simpan di pustaka) --</option>
                    {scenes.map((sc) => (
                      <option key={sc.scene_id} value={sc.scene_id}>
                        Adegan #{sc.scene_number}: {sc.title}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading || !uploadFile}
                  style={{ width: '100%', fontSize: '0.8rem' }}
                >
                  {actionLoading ? 'Mengunggah...' : 'Unggah File Media'}
                </button>
              </form>
            </div>
          </div>

          {/* Assets Grid */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                Pustaka Aset ({assets.length})
              </h3>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                onClick={loadAssets}
                disabled={loading}
              >
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Memuat pustaka aset visual...
              </div>
            ) : assets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-primary)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Belum ada aset visual yang diimpor untuk proyek ini.
                </p>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  Gunakan form di atas untuk mengimpor rekaman footage atau referensi visual lokal.
                </span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {assets.map((asset) => {
                  const linkedScene = scenes.find((s) => s.scene_id === asset.scene_id);
                  const isVideo = asset.asset_type === 'footage';

                  return (
                    <div
                      key={asset.asset_id}
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {/* Media Thumbnail Container */}
                      <div
                        style={{
                          height: '160px',
                          background: '#090d16',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          overflow: 'hidden'
                        }}
                        onClick={() => setPreviewAsset(asset)}
                        title="Klik untuk pratinjau media"
                      >
                        {asset.thumbnail_url ? (
                          <img
                            src={asset.thumbnail_url}
                            alt={asset.filename}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div style={{ color: 'var(--text-dim)', fontSize: '2rem' }}>
                            {isVideo ? '🎬' : '🖼️'}
                          </div>
                        )}

                        <span
                          style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            background: isVideo ? 'rgba(99, 102, 241, 0.85)' : 'rgba(16, 185, 129, 0.85)',
                            color: '#fff',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          {asset.asset_type}
                        </span>

                        {isVideo && asset.duration_sec && (
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '8px',
                              right: '8px',
                              background: 'rgba(0, 0, 0, 0.75)',
                              color: '#38bdf8',
                              fontSize: '0.75rem',
                              fontFamily: 'var(--font-mono)',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px'
                            }}
                          >
                            ⏱️ {asset.duration_sec}s
                          </span>
                        )}
                      </div>

                      {/* Info & Metadata */}
                      <div style={{ padding: '0.85rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            color: '#f8fafc',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginBottom: '0.4rem'
                          }}
                          title={asset.filename}
                        >
                          {asset.filename}
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                          {asset.width && asset.height && (
                            <span style={{ background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                              {asset.width}x{asset.height}
                            </span>
                          )}
                          {asset.fps && (
                            <span style={{ background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                              {asset.fps} FPS
                            </span>
                          )}
                          <span style={{ background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                            {formatFileSize(asset.size_bytes)}
                          </span>
                        </div>

                        {/* Scene Linkage Status */}
                        <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                            Status Adegan:
                          </label>
                          {linkedScene ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '4px', padding: '0.35rem 0.5rem', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                ✓ Adegan #{linkedScene.scene_number}: {linkedScene.title}
                              </span>
                              <button
                                className="btn btn-secondary"
                                style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem', color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.3)' }}
                                onClick={() => handleDetach(linkedScene.scene_id)}
                                title="Lepas aset dari adegan"
                              >
                                Lepas
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                              <select
                                className="form-select"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.4rem' }}
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAttachToScene(asset.asset_id, e.target.value);
                                  }
                                }}
                              >
                                <option value="" disabled>-- Tautkan ke adegan --</option>
                                {scenes.map((sc) => (
                                  <option key={sc.scene_id} value={sc.scene_id}>
                                    Adegan #{sc.scene_number}: {sc.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', color: '#38bdf8' }}
                              onClick={() => setPreviewAsset(asset)}
                            >
                              ▶ Preview
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                              onClick={() => handleDelete(asset.asset_id)}
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Media Preview Modal Overlay */}
        {previewAsset && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1100,
              padding: '1rem'
            }}
            onClick={() => setPreviewAsset(null)}
          >
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                maxWidth: '640px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                  {previewAsset.filename}
                </h4>
                <button className="close-btn" onClick={() => setPreviewAsset(null)}>&times;</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', borderRadius: 'var(--radius-sm)', overflow: 'hidden', minHeight: '300px' }}>
                {previewAsset.asset_type === 'footage' ? (
                  <video
                    controls
                    autoPlay
                    src={previewAsset.web_url}
                    style={{ maxWidth: '100%', maxHeight: '65vh' }}
                  />
                ) : (
                  <img
                    src={previewAsset.web_url}
                    alt={previewAsset.filename}
                    style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }}
                  />
                )}
              </div>

              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Tipe: {previewAsset.asset_type} ({previewAsset.mime_type})</span>
                <span>Resolusi: {previewAsset.width}x{previewAsset.height}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
