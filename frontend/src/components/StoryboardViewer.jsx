import React, { useState } from 'react';
import {
  addScene,
  updateScene,
  deleteScene,
  reorderScenes,
  generateSceneNarration,
  generateAllNarration,
  detachAsset
} from '../services/api';

export default function StoryboardViewer({
  project,
  onClose,
  onOpenPromptStudio,
  onOpenAssembly,
  onOpenAssetManager,
  onOpenMotionOverlay,
  onProjectUpdated
}) {
  const [editingSceneId, setEditingSceneId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isAddingScene, setIsAddingScene] = useState(false);
  const [newSceneForm, setNewSceneForm] = useState({
    title: '',
    narration_text: '',
    target_duration_seconds: 4.0,
    visual_prompt: '',
    footage_path: ''
  });
  const [generatingTtsId, setGeneratingTtsId] = useState(null);
  const [batchTtsLoading, setBatchTtsLoading] = useState(false);

  if (!project) return null;

  const scenes = project.storyboard?.scenes || [];

  const handleStartEdit = (scene) => {
    setEditingSceneId(scene.scene_id);
    setEditForm({
      title: scene.title,
      narration_text: scene.narration_text || '',
      target_duration_seconds: scene.target_duration_seconds || 4.0,
      visual_prompt: scene.visual_prompt || (scene.shots?.[0]?.visual_prompt || ''),
      footage_path: scene.footage_path || ''
    });
  };

  const handleSaveEdit = async (sceneId) => {
    try {
      const updatedProject = await updateScene(project.id, sceneId, editForm);
      onProjectUpdated(updatedProject);
      setEditingSceneId(null);
    } catch (err) {
      alert(`Gagal menyimpan adegan: ${err.message}`);
    }
  };

  const handleDeleteScene = async (sceneId) => {
    if (!window.confirm('Hapus adegan ini dari storyboard?')) return;
    try {
      const updatedProject = await deleteScene(project.id, sceneId);
      onProjectUpdated(updatedProject);
    } catch (err) {
      alert(`Gagal menghapus adegan: ${err.message}`);
    }
  };

  const handleMoveScene = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= scenes.length) return;

    const newOrder = [...scenes];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    const sceneIds = newOrder.map((s) => s.scene_id);
    try {
      const updatedProject = await reorderScenes(project.id, sceneIds);
      onProjectUpdated(updatedProject);
    } catch (err) {
      alert(`Gagal mengurutkan adegan: ${err.message}`);
    }
  };

  const handleAddSceneSubmit = async (e) => {
    e.preventDefault();
    if (!newSceneForm.title.trim()) return;

    try {
      const updatedProject = await addScene(project.id, newSceneForm);
      onProjectUpdated(updatedProject);
      setIsAddingScene(false);
      setNewSceneForm({
        title: '',
        narration_text: '',
        target_duration_seconds: 4.0,
        visual_prompt: '',
        footage_path: ''
      });
    } catch (err) {
      alert(`Gagal menambah adegan: ${err.message}`);
    }
  };

  const handleGenerateNarration = async (sceneId) => {
    try {
      setGeneratingTtsId(sceneId);
      await generateSceneNarration(project.id, sceneId);
      // Reload project state to refresh audio URLs
      const res = await fetch(`/api/projects/${project.id}`);
      const updatedProject = await res.json();
      onProjectUpdated(updatedProject);
    } catch (err) {
      alert(`Gagal sintesis Edge-TTS: ${err.message}`);
    } finally {
      setGeneratingTtsId(null);
    }
  };

  const handleGenerateAllNarration = async () => {
    try {
      setBatchTtsLoading(true);
      await generateAllNarration(project.id);
      const res = await fetch(`/api/projects/${project.id}`);
      const updatedProject = await res.json();
      onProjectUpdated(updatedProject);
      alert('Selesai membuat seluruh narasi audio Edge-TTS.');
    } catch (err) {
      alert(`Gagal membuat narasi: ${err.message}`);
    } finally {
      setBatchTtsLoading(false);
    }
  };

  const handleDetachFootage = async (sceneId) => {
    if (!window.confirm('Lepas footage dari adegan ini dan kembali ke placeholder?')) return;
    try {
      await detachAsset(project.id, sceneId);
      const res = await fetch(`/api/projects/${project.id}`);
      const updated = await res.json();
      onProjectUpdated(updated);
    } catch (err) {
      alert(`Gagal melepas footage: ${err.message}`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '980px', maxHeight: '92vh' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="project-aspect-tag">{project.aspect_ratio}</span>
              <h2 className="modal-title">{project.title}</h2>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              Storyboard & Audio Production Studio ({scenes.length} Adegan)
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Total Durasi: </span>
              <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>~{project.storyboard?.total_estimated_duration_sec}s</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Suara: </span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{project.settings?.voice}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', borderColor: '#38bdf8', color: '#38bdf8' }} onClick={() => onOpenAssetManager && onOpenAssetManager(null)}>
              📁 Pustaka Aset Media
            </button>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }} onClick={() => setIsAddingScene(!isAddingScene)}>
              {isAddingScene ? 'Tutup Form' : '+ Tambah Adegan'}
            </button>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', borderColor: '#f59e0b', color: '#fbbf24' }}
              disabled={batchTtsLoading}
              onClick={handleGenerateAllNarration}
            >
              {batchTtsLoading ? 'Sintesis Berjalan...' : '🎙️ Sintesis Semua Narasi'}
            </button>
            <button
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}
              onClick={() => onOpenAssembly(project)}
            >
              🎬 Rakit Video Lengkap (Assembly)
            </button>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', color: '#38bdf8' }} onClick={() => onOpenPromptStudio(project.id)}>
              Flow Prompts
            </button>
          </div>
        </div>

        {/* Add Scene Form */}
        {isAddingScene && (
          <form onSubmit={handleAddSceneSubmit} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#a5b4fc' }}>+ Tambah Adegan Baru</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label">Judul Adegan *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Contoh: Kejayaan Pelabuhan Malaka"
                  value={newSceneForm.title}
                  onChange={(e) => setNewSceneForm({ ...newSceneForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Target Durasi (Detik)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="60"
                  className="form-input"
                  value={newSceneForm.target_duration_seconds}
                  onChange={(e) => setNewSceneForm({ ...newSceneForm, target_duration_seconds: parseFloat(e.target.value) || 4.0 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Naskah Narasi Voice-Over</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Tuliskan kalimat naskah yang akan disuarakan oleh Edge-TTS..."
                value={newSceneForm.narration_text}
                onChange={(e) => setNewSceneForm({ ...newSceneForm, narration_text: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Prompt Visual Sinematik (Google Flow)</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Deskripsi kamera, pencahayaan, dan subjek visual..."
                value={newSceneForm.visual_prompt}
                onChange={(e) => setNewSceneForm({ ...newSceneForm, visual_prompt: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsAddingScene(false)}>Batal</button>
              <button type="submit" className="btn btn-primary">Simpan Adegan</button>
            </div>
          </form>
        )}

        {/* Scene Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {scenes.map((scene, idx) => {
            const isEditing = editingSceneId === scene.scene_id;
            const isGeneratingThisTts = generatingTtsId === scene.scene_id;
            const hasAudio = !!scene.narration_audio_path;

            return (
              <div key={scene.scene_id || idx} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', transition: 'border-color 0.2s' }}>
                {isEditing ? (
                  /* Edit Mode */
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>Mengedit Adegan #{scene.scene_number}</span>
                      <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => setEditingSceneId(null)}>Batal</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label className="form-label">Judul Adegan</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="form-label">Durasi (s)</label>
                        <input
                          type="number"
                          step="0.5"
                          className="form-input"
                          value={editForm.target_duration_seconds}
                          onChange={(e) => setEditForm({ ...editForm, target_duration_seconds: parseFloat(e.target.value) || 4.0 })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Naskah Narasi</label>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        value={editForm.narration_text}
                        onChange={(e) => setEditForm({ ...editForm, narration_text: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Prompt Visual Sinematik</label>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        value={editForm.visual_prompt}
                        onChange={(e) => setEditForm({ ...editForm, visual_prompt: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button className="btn btn-secondary" onClick={() => setEditingSceneId(null)}>Batal</button>
                      <button className="btn btn-primary" onClick={() => handleSaveEdit(scene.scene_id)}>Simpan Perubahan</button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          #{scene.scene_number}
                        </span>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                          {scene.title}
                        </h4>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          disabled={idx === 0}
                          title="Pindahkan ke atas"
                          onClick={() => handleMoveScene(idx, -1)}
                        >
                          ▲
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          disabled={idx === scenes.length - 1}
                          title="Pindahkan ke bawah"
                          onClick={() => handleMoveScene(idx, 1)}
                        >
                          ▼
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => handleStartEdit(scene)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => handleDeleteScene(scene.scene_id)}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>

                    {/* Narration Section */}
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600 }}>
                          NASKAH VOICE-OVER:
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {hasAudio && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-success)', fontFamily: 'var(--font-mono)' }}>
                              ✓ Audio Siap ({scene.narration_audio_duration_sec || 0}s)
                            </span>
                          )}
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem', borderColor: '#f59e0b', color: '#fbbf24' }}
                            disabled={isGeneratingThisTts || !scene.narration_text?.trim()}
                            onClick={() => handleGenerateNarration(scene.scene_id)}
                          >
                            {isGeneratingThisTts ? 'Menghasilkan...' : hasAudio ? 'Generate Ulang TTS' : '⚡ Sintesis Suara (TTS)'}
                          </button>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.875rem', fontStyle: 'italic', color: scene.narration_text ? 'var(--text-main)' : 'var(--text-dim)', marginBottom: hasAudio ? '0.75rem' : '0' }}>
                        {scene.narration_text ? `"${scene.narration_text}"` : 'Belum ada naskah narasi.'}
                      </div>

                      {/* Embedded Audio Player */}
                      {hasAudio && (
                        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <audio
                            controls
                            src={`/api/audio/${project.id}/${scene.scene_id}_narration.mp3`}
                            style={{ width: '100%', height: '32px' }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Visual Prompt Section */}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      <span style={{ color: 'var(--accent-cyan)' }}>Visual: </span>
                      <span style={{ color: 'var(--text-muted)' }}>{scene.visual_prompt || (scene.shots?.[0]?.visual_prompt || 'Placeholder visual deterministik')}</span>
                      <span style={{ marginLeft: '1rem', fontFamily: 'var(--font-mono)' }}>Durasi: {scene.target_duration_seconds}s</span>
                    </div>

                    {/* Visual Media & Footage Status */}
                    <div style={{ marginTop: '0.75rem', background: scene.footage_path ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)', border: `1px solid ${scene.footage_path ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`, borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 700, color: scene.footage_path ? '#34d399' : '#fbbf24' }}>
                          {scene.footage_path ? '✓ Footage Siap' : '⚡ Mode Placeholder'}
                        </span>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                          {scene.footage_path ? scene.footage_path.split(/[\\/]/).pop() : 'Visual sinematik dihasilkan FFmpeg otomatis'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {scene.footage_path ? (
                          <>
                            <button
                              className="btn btn-secondary"
                              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: '#38bdf8' }}
                              onClick={() => onOpenAssetManager && onOpenAssetManager(scene.scene_id)}
                            >
                              Ganti Footage
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.3)' }}
                              onClick={() => handleDetachFootage(scene.scene_id)}
                            >
                              Lepas
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem', borderColor: '#f59e0b', color: '#fbbf24' }}
                            onClick={() => onOpenAssetManager && onOpenAssetManager(scene.scene_id)}
                          >
                            + Pasang Footage / Gambar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Motion Graphics Overlays Status */}
                    <div style={{ marginTop: '0.5rem', background: (scene.motion_overlays && scene.motion_overlays.length > 0) ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)', border: `1px solid ${(scene.motion_overlays && scene.motion_overlays.length > 0) ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`, borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: (scene.motion_overlays && scene.motion_overlays.length > 0) ? '#38bdf8' : 'var(--text-dim)' }}>
                          ✨ Motion Overlays: {(scene.motion_overlays || []).length}
                        </span>
                        {scene.motion_overlays && scene.motion_overlays.map((ov, idx) => (
                          <span
                            key={ov.overlay_id || idx}
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '3px',
                              background: ov.enabled ? 'rgba(220, 38, 38, 0.2)' : 'rgba(255,255,255,0.05)',
                              color: ov.enabled ? '#f87171' : 'var(--text-dim)',
                              border: `1px solid ${ov.enabled ? 'rgba(220, 38, 38, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                              fontFamily: 'var(--font-mono)'
                            }}
                          >
                            {ov.template_id} ({ov.start_time}s-{ov.start_time + ov.duration}s)
                          </span>
                        ))}
                      </div>

                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderColor: '#38bdf8', color: '#38bdf8' }}
                        onClick={() => onOpenMotionOverlay && onOpenMotionOverlay(scene)}
                      >
                        ⚡ Kelola Motion Graphics
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
