import React, { useState } from 'react';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Penghapusan',
  itemName = '',
  itemType = 'Item',
  details = 'Tindakan ini tidak dapat dibatalkan.',
  isProtected = false,
  protectedMessage = 'Item ini dilindungi oleh sistem dan tidak dapat dihapus.'
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (isProtected) return;
    try {
      setLoading(true);
      setError(null);
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menghapus.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return; // prevent closing while in-flight
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-content"
        style={{ maxWidth: '520px', border: '1px solid rgba(239, 68, 68, 0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottomColor: 'rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171',
                fontSize: '1.25rem',
                fontWeight: 700
              }}
            >
              🗑️
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.1rem', color: '#f8fafc' }}>
                {title}
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Tipe Objek: <strong style={{ color: 'var(--accent-cyan)' }}>{itemType}</strong>
              </div>
            </div>
          </div>
          {!loading && (
            <button className="close-btn" onClick={handleClose}>
              &times;
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '1rem 0' }}>
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

          {isProtected ? (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                marginBottom: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                <span>🔒</span> Dilindungi Sistem
              </div>
              <p style={{ fontSize: '0.825rem', color: '#fde68a', margin: 0, lineHeight: 1.5 }}>
                {protectedMessage}
              </p>
            </div>
          ) : (
            <div
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                marginBottom: '1rem'
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                Objek yang dipilih:
              </div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#f8fafc',
                  wordBreak: 'break-word',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {itemName || '(Tidak ada nama)'}
              </div>
            </div>
          )}

          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            {details}
          </p>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={loading}
          >
            {isProtected ? 'Tutup' : 'Batal'}
          </button>
          {!isProtected && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirm}
              disabled={loading}
              style={{
                background: loading ? 'rgba(239, 68, 68, 0.4)' : '#ef4444',
                borderColor: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {loading && (
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                />
              )}
              <span>{loading ? 'Menghapus...' : 'Ya, Hapus Sekarang'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
