import React, { useState } from 'react';

export default function RenderModal({
  isOpen,
  onClose,
  renderStatus,
  renderResult,
  onTriggerRender,
  projectName,
  isAssembly = false
}) {
  const [duration, setDuration] = useState(5.0);

  if (!isOpen) return null;

  const isRendering = renderStatus === 'rendering';
  const isCompleted = renderStatus === 'success' && renderResult;
  const isError = renderStatus === 'error';

  return (
    <div className="modal-overlay" onClick={isRendering ? null : onClose}>
      <div className="modal-content" style={{ maxWidth: '660px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="brand-badge" style={{ background: isAssembly ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: isAssembly ? '#a5b4fc' : '#34d399', borderColor: isAssembly ? '#6366f1' : '#10b981' }}>
                {isAssembly ? 'MULTI-SCENE ASSEMBLY' : 'FFMPEG LOCAL ENGINE'}
              </span>
              <h2 className="modal-title">
                {isAssembly ? 'Rakit Video Lengkap Multi-Adegan' : 'Render Video Vertikal (1080×1920)'}
              </h2>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              {isAssembly
                ? 'Menggabungkan seluruh adegan storyboard, narasi suara Edge-TTS, dan grafis deterministik.'
                : 'Produksi video MP4 H.264 vertikal deterministik dengan audio AAC dan motion graphic card.'}
            </div>
          </div>
          {!isRendering && <button className="close-btn" onClick={onClose}>&times;</button>}
        </div>

        {renderStatus === 'idle' && (
          <div>
            <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Target Proyek:</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>{projectName}</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Format</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#38bdf8' }}>1080 × 1920 (9:16)</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Codec Video & Audio</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>H.264 / AAC 48kHz</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Frame Rate</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>30 FPS (CFR)</div>
                </div>
              </div>
            </div>

            {!isAssembly && (
              <div className="form-group">
                <label className="form-label">Durasi Video Demonstrasi (Detik):</label>
                <select className="form-select" value={duration} onChange={(e) => setDuration(parseFloat(e.target.value))}>
                  <option value={5.0}>5.0 Detik (Rekomendasi Cepat)</option>
                  <option value={7.0}>7.0 Detik</option>
                  <option value={10.0}>10.0 Detik</option>
                </select>
              </div>
            )}

            {isAssembly && (
              <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                💡 <strong>Pipeline Assembly:</strong> Engine akan memproses setiap adegan secara berurutan, menyesuaikan durasi visual dengan durasi audio narasi Edge-TTS, membakar subtitle sinkron, lalu menggabungkannya ke dalam MP4 final.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={onClose}>Batal</button>
              <button
                className="btn btn-primary"
                style={{ background: isAssembly ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'linear-gradient(135deg, #10b981, #059669)' }}
                onClick={() => onTriggerRender(duration)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                {isAssembly ? 'Mulai Rakit Video Sekarang' : 'Mulai Render Cepat'}
              </button>
            </div>
          </div>
        )}

        {isRendering && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ width: '48px', height: '48px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: isAssembly ? 'var(--accent-primary)' : 'var(--accent-success)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }}></div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
              {isAssembly ? 'Sedang Merakit Video Dokumenter Multi-Adegan...' : 'Sedang Merender Video MP4 Vertikal...'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto' }}>
              {isAssembly
                ? 'FFmpeg 7.1 sedang mengodekan segmen adegan individual, menyinkronkan audio narasi, dan menggabungkan manifest video.'
                : 'FFmpeg 7.1 sedang memproses layer grafis deterministik, mengomposisikan audio stereo, dan mengodekan frame ke 1080×1920.'}
            </p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {isCompleted && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', background: '#000', borderRadius: 'var(--radius-md)', padding: '0.75rem', border: '1px solid var(--border-subtle)' }}>
              <video
                src={renderResult.web_url}
                controls
                autoPlay
                playsInline
                style={{
                  height: '380px',
                  width: 'auto',
                  aspectRatio: '9/16',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.8)'
                }}
              />
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Status Verifikasi:</span>
                <span style={{ color: 'var(--accent-success)', fontWeight: 700 }}>
                  {isAssembly ? `✓ RAKITAN MULTI-ADEGAN SELESAI (${renderResult.scenes_count || 1} ADEGAN)` : '✓ TERVERIFIKASI REAL RENDER'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Dimensi & Codec:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{renderResult.verification?.width}×{renderResult.verification?.height} ({renderResult.verification?.codec})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Durasi & Ukuran:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{renderResult.verification?.duration_sec}s (~{Math.round(renderResult.verification?.file_size_bytes / 1024)} KB)</span>
              </div>
              <div style={{ marginTop: '0.6rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.4rem', wordBreak: 'break-all', color: 'var(--text-dim)' }}>
                File Disk: <span style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{renderResult.output_path}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <a href={renderResult.web_url} target="_blank" rel="noreferrer" download className="btn btn-secondary">
                Unduh Video MP4
              </a>
              <button className="btn btn-primary" onClick={onClose}>
                Selesai
              </button>
            </div>
          </div>
        )}

        {isError && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--accent-danger)' }}>⚠</div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--accent-danger)' }}>Rendering / Assembly Gagal</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              {renderResult?.error || 'Terjadi kesalahan teknis saat proses FFmpeg.'}
            </p>
            <button className="btn btn-secondary" onClick={onClose}>Tutup</button>
          </div>
        )}
      </div>
    </div>
  );
}
