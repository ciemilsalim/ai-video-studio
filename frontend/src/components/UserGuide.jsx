import React, { useState, useMemo } from 'react';

export default function UserGuide({ onGoDashboard, onNewProject, onQuickRender }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('section-a');
  const [expandedSections, setExpandedSections] = useState({
    'section-a': true,
    'section-b': true,
    'section-c': true,
    'section-d': true,
    'section-e': true,
    'section-f': true,
    'section-g': true,
    'section-h': true,
    'section-i': true,
    'section-j': true,
    'section-k': true
  });

  // Interactive Checklist State (Section K)
  const [checklist, setChecklist] = useState([
    { id: 'c1', label: 'Seluruh adegan memiliki visual utama (footage video atau gambar diam terverifikasi)', checked: false },
    { id: 'c2', label: 'Visual utama relevan dan merepresentasikan substansi naskah adegan', checked: false },
    { id: 'c3', label: 'Narasi suara Edge-TTS terdengar artikulatif, jernih, dan tidak terpotong di akhir', checked: false },
    { id: 'c4', label: 'Durasi adegan sinkron dan memberi jeda wajar (padding minimal 0.5s) untuk narasi', checked: false },
    { id: 'c5', label: 'Motion graphics terbaca kontras di atas visual utama pada orientasi layar ponsel 9:16', checked: false },
    { id: 'c6', label: 'Tidak ada kartu teks placeholder hitam-putih yang tertinggal tanpa disengaja', checked: false },
    { id: 'c7', label: 'Tidak ada teks judul, subtitle, atau HUD yang terpotong di luar safe zone vertikal', checked: false },
    { id: 'c8', label: 'Data statistik, tanggal sejarah, koordinat GPS, dan atribusi sumber diverifikasi akurat', checked: false },
    { id: 'c9', label: 'Video final MP4 1080×1920 telah diputar penuh dari awal hingga selesai tanpa glitch', checked: false }
  ]);

  const toggleChecklistItem = (id) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleCheckAll = (status) => {
    setChecklist((prev) => prev.map((item) => ({ ...item, checked: status })));
  };

  const completedCount = checklist.filter((i) => i.checked).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  const toggleSection = (secId) => {
    setExpandedSections((prev) => ({ ...prev, [secId]: !prev[secId] }));
  };

  const toggleAll = (expand) => {
    const updated = {};
    Object.keys(expandedSections).forEach((k) => {
      updated[k] = expand;
    });
    setExpandedSections(updated);
  };

  const scrollToSection = (secId) => {
    setActiveSection(secId);
    setExpandedSections((prev) => ({ ...prev, [secId]: true }));
    const el = document.getElementById(secId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const sectionsList = [
    { id: 'section-a', code: 'A', title: 'Selamat Datang & Pengenalan', icon: '🌟' },
    { id: 'section-b', code: 'B', title: 'Persiapan & Menjalankan Aplikasi', icon: '🚀' },
    { id: 'section-c', code: 'C', title: 'Membuat & Mengelola Proyek', icon: '📁' },
    { id: 'section-d', code: 'D', title: 'Memahami Storyboard & Adegan', icon: '🎬' },
    { id: 'section-e', code: 'E', title: 'Menyiapkan Visual Utama (Prioritas)', icon: '🖼️' },
    { id: 'section-f', code: 'F', title: 'Sintesis Narasi Suara (Edge-TTS)', icon: '🎙️' },
    { id: 'section-g', code: 'G', title: 'Menggunakan Motion Graphics', icon: '✨' },
    { id: 'section-h', code: 'H', title: 'Merakit Video Final (Assembly)', icon: '⚙️' },
    { id: 'section-i', code: 'I', title: 'Pemecahan Masalah (FAQ)', icon: '🛠️' },
    { id: 'section-j', code: 'J', title: 'Tips Produksi Dokumenter Premium', icon: '💡' },
    { id: 'section-k', code: 'K', title: 'Checklist Interaktif Pra-Publikasi', icon: '✅' }
  ];

  // Search filter
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sectionsList;
    const q = searchQuery.toLowerCase();
    return sectionsList.filter(
      (s) => s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div style={{ paddingBottom: '5rem' }}>
      {/* Top Banner Navigation */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '1.5rem 2rem',
          marginBottom: '2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                background: 'rgba(99, 102, 241, 0.2)',
                color: 'var(--accent-cyan)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)'
              }}
            >
              DOKUMENTASI RESMI V1.0
            </span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>• Bahasa Indonesia</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Panduan Pengguna AI Video Studio
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '780px', marginTop: '0.35rem' }}>
            Panduan komprehensif alur kerja produksi video dokumenter vertikal 1080×1920 (9:16).
            Pelajari setiap tahapan dari penyusunan naskah storyboard, visual utama, sintesis suara Edge-TTS, motion graphics terstandarisasi, hingga perakitan FFmpeg.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={onGoDashboard}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
          >
            ← Kembali ke Dashboard
          </button>
          <button
            className="btn btn-primary"
            onClick={onNewProject}
            style={{ fontSize: '0.85rem' }}
          >
            + Buat Proyek Baru
          </button>
        </div>
      </div>

      {/* Main Grid: Sticky Sidebar + Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Sticky Sidebar: Daftar Isi & Pencarian */}
        <aside
          style={{
            position: 'sticky',
            top: '80px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
                letterSpacing: '0.05em'
              }}
            >
              Pencarian Cepat
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Cari topik panduan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Daftar Isi (11 Bagian)
            </span>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              <button
                onClick={() => toggleAll(true)}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.7rem', cursor: 'pointer' }}
                title="Buka semua bagian"
              >
                Buka
              </button>
              <span style={{ color: 'var(--border-subtle)', fontSize: '0.7rem' }}>|</span>
              <button
                onClick={() => toggleAll(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '0.7rem', cursor: 'pointer' }}
                title="Tutup semua bagian"
              >
                Tutup
              </button>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {filteredSections.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.55rem 0.75rem',
                    background: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(99, 102, 241, 0.4)' : 'transparent'}`,
                    borderRadius: 'var(--radius-sm)',
                    color: isActive ? '#f8fafc' : 'var(--text-muted)',
                    textAlign: 'left',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontWeight: isActive ? 600 : 400
                  }}
                >
                  <span style={{ fontSize: '0.95rem' }}>{sec.icon}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sec.code}. {sec.title}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Checklist Widget Snapshot */}
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.78rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Checklist Publikasi:</span>
              <span style={{ fontWeight: 700, color: progressPercent === 100 ? 'var(--accent-success)' : 'var(--accent-cyan)' }}>
                {completedCount}/{checklist.length} ({progressPercent}%)
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: progressPercent === 100 ? 'var(--accent-success)' : 'linear-gradient(90deg, #6366f1, #06b6d4)',
                  transition: 'width 0.3s'
                }}
              />
            </div>
            <button
              onClick={() => scrollToSection('section-k')}
              style={{
                marginTop: '0.75rem',
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                color: 'var(--accent-cyan)',
                fontSize: '0.75rem',
                padding: '0.4rem',
                cursor: 'pointer'
              }}
            >
              Buka Checklist Lengkap →
            </button>
          </div>
        </aside>

        {/* Content Area: Sections A through K */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* SECTION A */}
          <section
            id="section-a"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}
          >
            <div
              onClick={() => toggleSection('section-a')}
              style={{
                padding: '1.25rem 1.75rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: expandedSections['section-a'] ? '1px solid var(--border-subtle)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🌟</span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                    A. Selamat Datang dan Pengenalan AI Video Studio
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Fungsi aplikasi, spesifikasi keluaran terverifikasi, dan alur perakitan video
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>
                {expandedSections['section-a'] ? '▲' : '▼'}
              </span>
            </div>

            {expandedSections['section-a'] && (
              <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <p style={{ color: 'var(--text-main)', lineHeight: '1.7', fontSize: '0.95rem' }}>
                  <strong>AI Video Studio</strong> adalah aplikasi desktop lokal untuk Windows yang dirancang khusus untuk memproduksi video dokumenter investigatif vertikal secara otomatis. Aplikasi ini menggabungkan penyusunan storyboard modular, naskah narasi dengan sintesis suara neural, aset visual sinematik, serta lapisan motion graphics investigatif yang dirakit secara presisi menggunakan mesin FFmpeg tanpa memerlukan software editing manual berbayar.
                </p>

                {/* Verified Specs Card */}
                <div
                  style={{
                    background: 'rgba(99, 102, 241, 0.06)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem'
                  }}
                >
                  <h4 style={{ color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                    ✓ Spesifikasi Standar Video Terverifikasi (Engine Baseline):
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block' }}>Format & Rasio:</span>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>1080 × 1920 (9:16 Vertikal)</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block' }}>Frame Rate:</span>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>30.0 FPS Constant (CFR)</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block' }}>Video Codec:</span>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>H.264 (yuv420p)</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block' }}>Audio Codec:</span>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>AAC Stereo (48kHz / 128kbps)</strong>
                    </div>
                  </div>
                </div>

                {/* Perbedaan Visual Utama vs Motion Graphics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>🎬</span>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399' }}>1. Visual Utama (Base Video / Image)</h4>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                      Merupakan rekaman footage video nyata atau gambar latar diam beresolusi tinggi yang menjadi fondasi adegan. Lapisan ini mengisi seluruh bidang 1080×1920 dan menggambarkan subjek atau peristiwa yang sedang dinarasikan.
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>✨</span>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8' }}>2. Motion Graphics (Alpha Overlays)</h4>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                      Merupakan grafis animasi transparan (judul kinetik, kartu metrik, tanggal, atau HUD forensik) yang di-composite di atas visual utama dengan saluran alpha channel, tanpa menutupi keseluruhan pemandangan dasar.
                    </p>
                  </div>
                </div>

                {/* Workflow Diagram */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem' }}>
                    Diagram Alur Produksi Video AI Studio:
                  </h4>
                  <div
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                      color: 'var(--accent-cyan)',
                      lineHeight: '1.8',
                      overflowX: 'auto'
                    }}
                  >
                    [1. Konsep / Riset] → [2. Storyboard & Naskah] → [3. Visual Utama (Footage / Still Image)]<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br />
                    [6. Video MP4 Final] ← [5. FFmpeg Multi-Layer Assembly] ← [4. Narasi Suara (TTS) + Motion Graphics]
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* SECTION B */}
          <section
            id="section-b"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}
          >
            <div
              onClick={() => toggleSection('section-b')}
              style={{
                padding: '1.25rem 1.75rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: expandedSections['section-b'] ? '1px solid var(--border-subtle)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🚀</span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                    B. Persiapan dan Menjalankan Aplikasi
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Launcher 1-klik, verifikasi port, runtime lokal, dan cara menghentikan sistem dengan aman
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>
                {expandedSections['section-b'] ? '▲' : '▼'}
              </span>
            </div>

            {expandedSections['section-b'] && (
              <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <p style={{ color: 'var(--text-main)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  Aplikasi dikonfigurasi untuk dijalankan secara portabel pada lingkungan lokal Windows tanpa memerlukan instalasi web server pihak ketiga seperti Apache, PHP, atau MySQL.
                </p>

                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.75rem' }}>
                    Langkah Menjalankan Aplikasi:
                  </h4>
                  <ol style={{ paddingLeft: '1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                    <li>
                      Buka direktori workspace: <code style={{ fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>D:\laragon\www\ai-video-studio</code>.
                    </li>
                    <li>
                      Klik ganda pada file batch: <strong style={{ color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>Start AI Video Studio.bat</strong>.
                    </li>
                    <li>
                      Script akan memeriksa kesiapan runtime secara otomatis:
                      <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                        <li>Python 3.10+ (untuk backend FastAPI).</li>
                        <li>Node.js v18+ & npm (untuk frontend Vite React).</li>
                        <li>FFmpeg lokal pada sistem Windows.</li>
                      </ul>
                    </li>
                    <li>
                      Dua jendela konsol Windows Command Prompt akan terbuka:
                      <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                        <li><strong>AI Video Studio Backend</strong>: Berjalan pada alamat <code style={{ color: '#38bdf8' }}>http://127.0.0.1:8000</code>.</li>
                        <li><strong>AI Video Studio Frontend</strong>: Berjalan pada alamat <code style={{ color: '#38bdf8' }}>http://localhost:5173</code>.</li>
                      </ul>
                    </li>
                    <li>
                      Browser default Anda akan terbuka secara otomatis mengarah ke <code style={{ color: '#38bdf8' }}>http://localhost:5173</code>.
                    </li>
                  </ol>
                </div>

                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    fontSize: '0.85rem'
                  }}
                >
                  <strong style={{ color: '#fbbf24' }}>⚠️ Kebutuhan Koneksi Internet:</strong>
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem', lineHeight: '1.6' }}>
                    Sebagian besar modul (Assembly FFmpeg, rendering motion graphics SVG/Pillow, database proyek JSON, dan ingestion aset) bekerja <strong>100% lokal dan offline</strong>. Namun, sintesis suara <strong>Edge-TTS memerlukan koneksi internet aktif</strong> untuk menghubungi server Microsoft Azure Speech API. Jika offline, proses pembuatan audio narasi akan mengalami timeout.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
                    Cara Mematikan Aplikasi dengan Aman:
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    Untuk menghentikan AI Video Studio, cukup tutup kedua jendela terminal CMD (*AI Video Studio Backend* dan *AI Video Studio Frontend*). Jangan menghentikan proses paksa di Task Manager saat proses perakitan video (FFmpeg) sedang berlangsung guna mencegah kerusakan file sementara.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* SECTION C */}
          <section
            id="section-c"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}
          >
            <div
              onClick={() => toggleSection('section-c')}
              style={{
                padding: '1.25rem 1.75rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: expandedSections['section-c'] ? '1px solid var(--border-subtle)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>📁</span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                    C. Membuat dan Mengelola Proyek Dokumenter
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Manajemen dashboard, project cards, struktur file JSON, dan preservasi data
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>
                {expandedSections['section-c'] ? '▲' : '▼'}
              </span>
            </div>

            {expandedSections['section-c'] && (
              <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <p style={{ color: 'var(--text-main)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  Halaman Dashboard menampilkan seluruh proyek dokumenter yang tersimpan secara lokal pada folder <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>backend/data/projects/</code>.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <h5 style={{ color: '#f8fafc', fontWeight: 700, marginBottom: '0.35rem', fontSize: '0.88rem' }}>1. Membuat Proyek Baru</h5>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      Klik tombol <strong>+ Mulai Proyek Baru</strong> di header atau banner hero. Berikan judul yang deskriptif (misal: "Misteri Jalur Sutra Maritim"), deskripsi singkat, rasio aspek (default 9:16), serta pilihan suara default.
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <h5 style={{ color: '#f8fafc', fontWeight: 700, marginBottom: '0.35rem', fontSize: '0.88rem' }}>2. Membuka Storyboard Viewer</h5>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      Pada setiap kartu proyek, klik tombol <strong>Lihat Storyboard</strong> untuk masuk ke editor adegan, naskah narasi suara, pengelolaan aset footage, dan motion overlays.
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <h5 style={{ color: '#f8fafc', fontWeight: 700, marginBottom: '0.35rem', fontSize: '0.88rem' }}>3. Pustaka Aset Media</h5>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      Gunakan tombol <strong>Aset Media</strong> pada kartu proyek untuk melihat repositori file video, foto, dan thumbnail yang telah diimpor untuk proyek tersebut.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    fontSize: '0.85rem'
                  }}
                >
                  <strong style={{ color: '#34d399' }}>🛡️ Keamanan File Proyek Lama:</strong>
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem', lineHeight: '1.6' }}>
                    Proyek bawaan sistem seperti <code style={{ fontFamily: 'var(--font-mono)' }}>misteri-gunung-merapi.json</code> dan <code style={{ fontFamily: 'var(--font-mono)' }}>misteri-peradaban-nusantara.json</code> dilindungi sebagai data referensi arsitektur. Anda dapat membuat proyek uji baru kapan saja tanpa khawatir merusak proyek yang sudah ada.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* SECTION D */}
          <section
            id="section-d"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}
          >
            <div
              onClick={() => toggleSection('section-d')}
              style={{
                padding: '1.25rem 1.75rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: expandedSections['section-d'] ? '1px solid var(--border-subtle)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🎬</span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                    D. Memahami Storyboard dan Scene
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Anatomi struktur adegan, parameter naskah, durasi adaptif, dan contoh kasus
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>
                {expandedSections['section-d'] ? '▲' : '▼'}
              </span>
            </div>

            {expandedSections['section-d'] && (
              <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <p style={{ color: 'var(--text-main)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  Storyboard adalah inti cerita video Anda. Setiap video dokumenter terdiri dari serangkaian adegan (*scenes*) berurutan. Setiap adegan memiliki field terstruktur berikut:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: '#a5b4fc', display: 'block', marginBottom: '0.25rem' }}>1. Judul & Nomor Adegan</strong>
                    <span style={{ color: 'var(--text-muted)' }}>Identifikasi urutan segmen cerita (misal: "#1 Pembuka / Hook", "#2 Bukti Lapangan").</span>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '0.25rem' }}>2. Naskah Voice-Over</strong>
                    <span style={{ color: 'var(--text-muted)' }}>Teks narasi yang akan diucapkan oleh generator Edge-TTS dan ditampilkan sebagai subtitle.</span>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '0.25rem' }}>3. Target Durasi (Detik)</strong>
                    <span style={{ color: 'var(--text-muted)' }}>Estimasi waktu adegan (default 3.0s - 6.0s). Otomatis memanjang jika narasi audio melebihi angka ini.</span>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: '#34d399', display: 'block', marginBottom: '0.25rem' }}>4. Visual Prompt & Status</strong>
                    <span style={{ color: 'var(--text-muted)' }}>Deskripsi visual sinematik dan status kesiapan footage utama (Ready / Missing).</span>
                  </div>
                </div>

                {/* Contoh Adegan Demonstrasi */}
                <div
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px dashed rgba(99, 102, 241, 0.4)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ background: 'rgba(99, 102, 241, 0.25)', color: '#a5b4fc', padding: '0.15rem 0.5rem', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      CONTOH DATA DEMO (FIKTIF/ILUSTRATIF)
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Bukan fakta sejarah mutlak</span>
                  </div>

                  <div style={{ fontSize: '0.85rem', lineHeight: '1.7', color: 'var(--text-main)' }}>
                    <strong style={{ color: '#f8fafc' }}>Judul:</strong> Kejayaan Jalur Rempah Selat Malaka<br />
                    <strong style={{ color: '#fbbf24' }}>Narasi:</strong> "Pada abad ke-14, armada kapal bercadik mengarungi selat sempit ini, membawa muatan pala dan cengkeh bernilai tinggi menuju pasar dunia."<br />
                    <strong style={{ color: '#38bdf8' }}>Prompt Visual:</strong> <em>"Cinematic 35mm anamorphic wide drone shot of ancient wooden sailing fleet navigating tropical mist-covered strait at sunrise, dramatic rim light, 9:16 vertical composition"</em><br />
                    <strong style={{ color: '#34d399' }}>Durasi Target:</strong> 5.0 Detik
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* SECTION E */}
          <section
            id="section-e"
            style={{
              background: 'var(--bg-card)',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}
          >
            <div
              onClick={() => toggleSection('section-e')}
              style={{
                padding: '1.25rem 1.75rem',
                background: 'rgba(16, 185, 129, 0.06)',
                borderBottom: expandedSections['section-e'] ? '1px solid var(--border-subtle)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🖼️</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399' }}>
                      E. Menyiapkan Visual Utama (Prioritas Penting)
                    </h2>
                    <span style={{ background: '#059669', color: '#fff', fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '3px', fontWeight: 700 }}>
                      PRIORITAS
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Dua jalur resmi: Impor footage lokal dan generator visual prosedural 1080×1920
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>
                {expandedSections['section-e'] ? '▲' : '▼'}
              </span>
            </div>

            {expandedSections['section-e'] && (
              <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    fontSize: '0.88rem'
                  }}
                >
                  <strong style={{ color: '#f87171' }}>Penting untuk Dipahami:</strong>
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: '1.6' }}>
                    Video dokumenter tidak akan bermakna jika hanya berisi suara narasi dan motion graphics di atas layar hitam kosong. <strong>Visual utama adalah keharusan mutlak</strong> untuk setiap adegan. Jangan menganggap render berhasil jika Anda belum memastikan setiap adegan memiliki visual nyata yang terhubung.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {/* Jalur 1: Impor Lokal */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>📥</span>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                        Jalur 1: Impor Video atau Gambar Lokal
                      </h4>
                    </div>
                    <ol style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                      <li>Buka tombol <strong>+ Pasang Footage / Gambar</strong> pada kartu adegan di Storyboard.</li>
                      <li>
                        <strong>Metode Path Windows:</strong> Masukkan path lengkap file media lokal (contoh: <code style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>D:\Footage\pelabuhan_drone.mp4</code>).
                      </li>
                      <li>
                        <strong>Metode Upload File:</strong> Pilih file langsung dari disk komputer Anda.
                      </li>
                      <li>Format didukung: <code>.mp4</code>, <code>.mov</code>, <code>.webm</code> (maks 500MB) dan <code>.png</code>, <code>.jpg</code>, <code>.webp</code> (maks 30MB).</li>
                      <li>Sistem otomatis mengekstrak resolusi, durasi, dan membuat thumbnail pratinjau.</li>
                      <li>Status visual adegan akan berubah menjadi <span style={{ color: '#34d399', fontWeight: 700 }}>✓ Visual Siap</span>.</li>
                    </ol>
                  </div>

                  {/* Jalur 2: Procedural Generator */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>✨</span>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                        Jalur 2: Generator Visual Prosedural Lokal
                      </h4>
                    </div>
                    <ol style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                      <li>Klik tombol <strong>✨ Generate Visual Sinematik</strong> pada kartu adegan.</li>
                      <li>Engine lokal secara otomatis menganalisis kata kunci dalam prompt visual adegan Anda (Samudera, Vulkanik, Candi/Purba, atau Investigasi Umum).</li>
                      <li>Engine merender video vertikal murni 1080×1920 30 FPS dengan gerakan kamera, pencahayaan atmosferis, dan partikel debu sinematik.</li>
                      <li>Hasil video langsung ditautkan secara otomatis ke adegan yang bersangkutan.</li>
                      <li>
                        <strong style={{ color: '#fbbf24' }}>Catatan Kejujuran Teknis:</strong> Generator prosedural lokal menghasilkan visual atmosferik terprogram, bukan model AI Diffusion fotorealistik cloud. Hasilnya adalah visual bergerak yang valid secara teknis.
                      </li>
                    </ol>
                  </div>
                </div>

                {/* Status Google Flow yang Transparan */}
                <div
                  style={{
                    background: 'rgba(56, 189, 248, 0.06)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem'
                  }}
                >
                  <h4 style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.92rem' }}>
                    ℹ️ Status Integrasi Google Flow (Audit Transparan):
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                    Google Flow saat ini <strong>belum merilis endpoint REST API publik lokal atau SDK otomatis</strong>. Oleh karena itu, aplikasi kami tidak menggunakan endpoint fiktif atau kunci palsu. Alur kerja yang didukung saat ini: gunakan menu <strong>Flow Prompts</strong> untuk menyalin prompt standar yang telah diformulasikan ke platform Google Flow, lalu unduh hasilnya dan masukkan ke adegan melalui <strong>Asset Manager</strong>.
                  </p>
                </div>

                {/* Checklist Pra-Assembly Visual */}
                <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                  <h4 style={{ color: '#f8fafc', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                    Checklist Kesiapan Visual Sebelum Menekan Tombol Assembly:
                  </h4>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                    <li>Semua adegan memiliki badge hijau <span style={{ color: '#34d399', fontWeight: 600 }}>✓ Visual Siap</span>.</li>
                    <li>Thumbnail visual pada kartu adegan menampilkan gambar atau cuplikan yang relevan.</li>
                    <li>File footage tidak kosong (berukuran &gt; 0 byte) dan dapat didekode oleh FFmpeg.</li>
                    <li>Jika menggunakan gambar diam, gambar memiliki orientasi vertikal memadai agar tidak terdistorsi saat dipotong ke 1080×1920.</li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* SECTION F */}
          <section
            id="section-f"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}
          >
            <div
              onClick={() => toggleSection('section-f')}
              style={{
                padding: '1.25rem 1.75rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: expandedSections['section-f'] ? '1px solid var(--border-subtle)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🎙️</span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                    F. Pembuatan Narasi Suara (Edge-TTS Neural)
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Pemilihan suara neural, durasi adaptif otomatis, dan pemutar audio terintegrasi
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>
                {expandedSections['section-f'] ? '▲' : '▼'}
              </span>
            </div>

            {expandedSections['section-f'] && (
              <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <p style={{ color: 'var(--text-main)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  AI Video Studio menggunakan teknologi neural speech synthesis Microsoft Edge-TTS yang menghasilkan intonasi alami tanpa biaya langganan API berbayar.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '0.25rem' }}>id-ID-ArdiNeural (Pria)</strong>
                    <span style={{ color: 'var(--text-muted)' }}>Karakter suara narator dokumenter investigatif, berwibawa, tegas, dan artikulatif. Cocok untuk topik sejarah dan misteri.</span>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '0.25rem' }}>id-ID-GadisNeural (Wanita)</strong>
                    <span style={{ color: 'var(--text-muted)' }}>Karakter suara naratif eksposisi, tenang, jernih, dan profesional. Cocok untuk ulasan sains, alam, dan biografi.</span>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: '#a5b4fc', display: 'block', marginBottom: '0.25rem' }}>en-US-BrianMultilingualNeural</strong>
                    <span style={{ color: 'var(--text-muted)' }}>Suara dokumenter internasional berbahasa Inggris dengan aksen netral yang berwibawa.</span>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                  <h4 style={{ color: '#f8fafc', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    Alur Kerja Narasi Voice-Over:
                  </h4>
                  <ol style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                    <li>Tulis teks naskah pada form <strong>Naskah Voice-Over</strong> di setiap adegan.</li>
                    <li>Klik <strong>⚡ Sintesis Suara (TTS)</strong> untuk memproses satu adegan, atau <strong>🎙️ Sintesis Semua Narasi</strong> di action bar atas untuk memproses seluruh adegan sekaligus.</li>
                    <li>Setelah selesai, audio player mini akan muncul tepat di bawah naskah. Klik tombol play untuk mendengarkan hasil ucapan dan intonasinya.</li>
                    <li>
                      <strong>Sinkronisasi Durasi Cerdas:</strong> Sistem otomatis menghitung durasi file audio MP3 yang dihasilkan. Jika suara berdurasi 4.8 detik sementara target adegan 4.0 detik, mesin assembly akan otomatis menaikkan durasi adegan menjadi 5.3 detik (ditambah padding 0.5s) agar narasi tidak terpotong.
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </section>

          {/* SECTION G */}
          <section
            id="section-g"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}
          >
            <div
              onClick={() => toggleSection('section-g')}
              style={{
                padding: '1.25rem 1.75rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: expandedSections['section-g'] ? '1px solid var(--border-subtle)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>✨</span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                    G. Menggunakan Motion Graphics Investigatif
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Panduan 4 template bawaan, pratinjau live frame, dan etika verifikasi data
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>
                {expandedSections['section-g'] ? '▲' : '▼'}
              </span>
            </div>

            {expandedSections['section-g'] && (
              <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <p style={{ color: 'var(--text-main)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  Motion Graphics adalah elemen penjelas transparan yang dirender menggunakan grafis RGBA 32-bit di atas visual utama. Untuk mengelola motion graphics, klik tombol <strong>⚡ Kelola Motion Graphics</strong> pada kartu adegan di Storyboard Viewer.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {/* Template 1: Kinetic Title */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#f87171', fontSize: '0.95rem' }}>1. kinetic_title</strong>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.2)', padding: '0.1rem 0.4rem', borderRadius: '3px', color: '#fca5a5' }}>Judul Pembuka</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '0.75rem' }}>
                      Animasi tipografi tebal dengan garis aksen merah darah dan kategori investigasi.
                    </p>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      Field: <code>title</code>, <code>subtitle</code>, <code>tag</code><br />
                      Waktu rekomendasi: detik 0.0 - 2.5
                    </div>
                  </div>

                  {/* Template 2: Stat Card */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#fbbf24', fontSize: '0.95rem' }}>2. stat_card</strong>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(245, 158, 11, 0.2)', padding: '0.1rem 0.4rem', borderRadius: '3px', color: '#fde68a' }}>Metrik Data</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '0.75rem' }}>
                      Kartu data berukuran besar untuk menonjolkan estimasi angka, persentase, atau nilai temuan.
                    </p>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      Field: <code>value</code>, <code>label</code>, <code>unit</code>, <code>source</code> (wajib jujur)<br />
                      Waktu rekomendasi: detik 1.0 - 4.0
                    </div>
                  </div>

                  {/* Template 3: Timeline Event */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>3. timeline_event</strong>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(56, 189, 248, 0.2)', padding: '0.1rem 0.4rem', borderRadius: '3px', color: '#bae6fd' }}>Kronologi</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '0.75rem' }}>
                      Badge tahun/periode bersejarah dengan tag lokasi geografis dan ringkasan peristiwa.
                    </p>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      Field: <code>date_or_period</code>, <code>event_title</code>, <code>location</code>, <code>description</code><br />
                      Waktu rekomendasi: detik 0.5 - 3.5
                    </div>
                  </div>

                  {/* Template 4: Investigation HUD */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#34d399', fontSize: '0.95rem' }}>4. investigation_hud</strong>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.2)', padding: '0.1rem 0.4rem', borderRadius: '3px', color: '#a7f3d0' }}>Forensik HUD</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '0.75rem' }}>
                      Overlay bingkai bidik reticle militer, indikator REC kedip, koordinat GPS, dan kode bukti arsip.
                    </p>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      Field: <code>coordinates_or_location</code>, <code>evidence_code</code>, <code>classification</code>, <code>timestamp_label</code><br />
                      Waktu rekomendasi: tampil penuh sepanjang adegan
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    fontSize: '0.85rem'
                  }}
                >
                  <strong style={{ color: '#f87171' }}>⚠️ Etika Integritas Informasi & Verifikasi Data:</strong>
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem', lineHeight: '1.6' }}>
                    Template <code>stat_card</code> dan <code>investigation_hud</code> memiliki field sumber data (*data source*) dan klasifikasi. Jangan menuliskan data spekulatif sebagai data fakta. Pastikan angka tahun, persentase, dan koordinat diverifikasi sebelum merilis video ke publik.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* SECTION H */}
          <section
            id="section-h"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}
          >
            <div
              onClick={() => toggleSection('section-h')}
              style={{
                padding: '1.25rem 1.75rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: expandedSections['section-h'] ? '1px solid var(--border-subtle)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>⚙️</span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                    H. Merakit Video Final (FFmpeg Multi-Scene Assembly)
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Panduan langkah demi langkah proses render, lokasi file, dan inspeksi frame
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>
                {expandedSections['section-h'] ? '▲' : '▼'}
              </span>
            </div>

            {expandedSections['section-h'] && (
              <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <p style={{ color: 'var(--text-main)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  Perakitan (*assembly*) adalah tahap akhir di mana seluruh elemen per adegan disatukan menjadi sebuah file video MP4 utuh.
                </p>

                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                  <h4 style={{ color: '#f8fafc', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                    Langkah-demi-Langkah Menjalankan Assembly:
                  </h4>
                  <ol style={{ paddingLeft: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                    <li>Buka <strong>Storyboard Viewer</strong> pada proyek yang ingin dirakit.</li>
                    <li>Periksa bahwa setiap adegan memiliki status <span style={{ color: '#34d399', fontWeight: 600 }}>✓ Visual Siap</span> dan narasi audio telah disintesis.</li>
                    <li>Klik tombol hijau <strong>🎬 Rakit Video Lengkap (Assembly)</strong> di bar aksi bagian atas.</li>
                    <li>
                      Jika ada adegan yang belum memiliki visual, sistem akan memunculkan dialog konfirmasi pencegahan. Disarankan untuk membatalkan dan melengkapi visual terlebih dahulu.
                    </li>
                    <li>Modal render akan terbuka menampilkan animasi proses perakitan. Sistem mengeksekusi pipeline di background tanpa memblokir antarmuka.</li>
                    <li>Setelah selesai, video player interaktif vertikal akan langsung memutar hasil render final.</li>
                    <li>
                      File video final tersimpan di: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>backend/data/renders/assembled_[project-id]_[timestamp].mp4</code>.
                    </li>
                  </ol>
                </div>

                <div
                  style={{
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    fontSize: '0.85rem'
                  }}
                >
                  <strong style={{ color: '#a5b4fc' }}>Kiat Pemeriksaan Mutu (Quality Control):</strong>
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem', lineHeight: '1.6' }}>
                    Setelah render selesai, jangan hanya memastikan file MP4 dapat diputar di detik pertama. Geser slider pemutar (*seek*) ke beberapa timestamp berbeda (misal detik ke-2, ke-5, dan ke-8) untuk memverifikasi bahwa: (1) Visual utama bergerak aktif jika sumbernya video, (2) Audio narasi terdengar jelas dan sinkron, dan (3) Teks grafis tampil tajam dan mudah dibaca.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* SECTION I */}
          <section
            id="section-i"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}
          >
            <div
              onClick={() => toggleSection('section-i')}
              style={{
                padding: '1.25rem 1.75rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: expandedSections['section-i'] ? '1px solid var(--border-subtle)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🛠️</span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                    I. Pemecahan Masalah (FAQ & Troubleshooting)
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Daftar gejala kendala umum, akar penyebab, dan solusi aman teruji
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>
                {expandedSections['section-i'] ? '▲' : '▼'}
              </span>
            </div>

            {expandedSections['section-i'] && (
              <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* FAQ 1 */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                    <h4 style={{ color: '#f87171', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                      Q1: Video berhasil dirender, narasi terdengar dan teks muncul, tetapi visual utama tidak tampil (hanya layar teks/placeholder)?
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                      <strong>Penyebab:</strong> Adegan belum memiliki footage atau gambar yang ditautkan ke <code>scene.footage_path</code>.<br />
                      <strong>Solusi:</strong> Buka Storyboard Viewer, cari adegan dengan badge kuning <code>⚠️ Visual Belum Tersedia</code>. Klik <code>+ Pasang Footage / Gambar</code> untuk mengimpor file lokal, atau klik <code>✨ Generate Visual Sinematik</code> untuk membuat video 1080×1920 prosedural. Pastikan badge berubah menjadi hijau <code>✓ Visual Siap</code> sebelum melakukan assembly ulang.
                    </p>
                  </div>

                  {/* FAQ 2 */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                    <h4 style={{ color: '#fbbf24', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                      Q2: Sintesis suara Edge-TTS gagal dengan pesan "Timeout 25 detik" atau "Gagal menghubungi layanan"?
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                      <strong>Penyebab:</strong> Koneksi internet komputer terputus atau server Microsoft Edge-TTS mengalami hambatan jaringan sementara.<br />
                      <strong>Solusi:</strong> Periksa koneksi internet Anda. Pastikan browser dapat membuka halaman web lain secara normal. Tunggu beberapa detik, kemudian klik kembali tombol <code>⚡ Sintesis Suara (TTS)</code>.
                    </p>
                  </div>

                  {/* FAQ 3 */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                    <h4 style={{ color: '#38bdf8', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                      Q3: Error "Aset visual tidak ditemukan di disk" saat menjalankan perakitan?
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                      <strong>Penyebab:</strong> File media yang pernah ditautkan telah dihapus, dipindahkan foldernya, atau berganti nama pada Windows Explorer.<br />
                      <strong>Solusi:</strong> Buka Storyboard Viewer, klik <code>Ganti / Pilih Aset</code> pada adegan tersebut, dan tautkan kembali file media yang berada pada lokasi folder terkini.
                    </p>
                  </div>

                  {/* FAQ 4 */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                    <h4 style={{ color: '#a5b4fc', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                      Q4: Teks pada Motion Graphics terpotong atau keluar dari bidang layar ponsel?
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                      <strong>Penyebab:</strong> Judul atau deskripsi yang dimasukkan terlalu panjang untuk rasio vertikal 9:16.<br />
                      <strong>Solusi:</strong> Buka <code>⚡ Kelola Motion Graphics</code>, perhatikan live preview. Singkat teks judul menjadi 2-4 kata kunci yang padat, atau gunakan fasilitas line wrap otomatis yang telah disediakan oleh engine.
                    </p>
                  </div>

                  {/* FAQ 5 */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                    <h4 style={{ color: '#34d399', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                      Q5: Web Dashboard tidak bisa dibuka (Halaman Blank atau Network Error)?
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                      <strong>Penyebab:</strong> Jendela terminal backend FastAPI atau frontend Vite tertutup tanpa sengaja.<br />
                      <strong>Solusi:</strong> Jalankan kembali file <code>Start AI Video Studio.bat</code> dari root workspace <code>D:\laragon\www\ai-video-studio</code>.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* SECTION J */}
          <section
            id="section-j"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}
          >
            <div
              onClick={() => toggleSection('section-j')}
              style={{
                padding: '1.25rem 1.75rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: expandedSections['section-j'] ? '1px solid var(--border-subtle)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>💡</span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                    J. Tips Praktis Produksi Dokumenter Premium
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Rekomendasi teknis dan estetik untuk hasil video vertikal yang memikat penonton
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>
                {expandedSections['section-j'] ? '▲' : '▼'}
              </span>
            </div>

            {expandedSections['section-j'] && (
              <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', fontSize: '0.85rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: 'var(--accent-cyan)', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                      1. Satu Adegan, Satu Gagasan
                    </strong>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                      Hindari menumpuk terlalu banyak fakta dalam satu adegan 4 detik. Bagi narasi kompleks ke dalam beberapa adegan pendek (masing-masing 3.5s - 5.0s) agar penonton memiliki waktu mencerna visual dan pesan.
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                      2. Gunakan Motion Graphics Secukupnya
                    </strong>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                      Jangan menempatkan overlay grafis di setiap detik adegan. Berikan jeda bernafas di mana penonton hanya menikmati rekaman visual utama tanpa gangguan teks. Gunakan grafis hanya ketika ada data penting yang perlu disorot.
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: '#34d399', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                      3. Perhatikan Area Aman Seluler (Safe Zone)
                    </strong>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                      Pada video vertikal 9:16 untuk media sosial, bagian bawah (200px) sering tertutup nama akun dan caption, sementara bagian kanan tertutup tombol like/share. Tempatkan judul dan data penting di sepertiga tengah layar vertikal.
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: '#a5b4fc', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                      4. Tonton Utuh Sebelum Publikasi
                    </strong>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                      Jangan mempublikasikan video hanya berdasarkan keberhasilan log FFmpeg. Selalu putar video final dari awal hingga detik terakhir pada layar ponsel untuk mengevaluasi ritme, kejelasan vokal, dan keterbacaan teks.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* SECTION K */}
          <section
            id="section-k"
            style={{
              background: 'var(--bg-card)',
              border: '2px solid rgba(99, 102, 241, 0.4)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}
          >
            <div
              onClick={() => toggleSection('section-k')}
              style={{
                padding: '1.25rem 1.75rem',
                background: 'rgba(99, 102, 241, 0.08)',
                borderBottom: expandedSections['section-k'] ? '1px solid var(--border-subtle)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>✅</span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                    K. Checklist Interaktif Pra-Publikasi Video
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Daftar periksa kualitas mandiri (State lokal interaktif tanpa mengubah backend)
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>
                {expandedSections['section-k'] ? '▲' : '▼'}
              </span>
            </div>

            {expandedSections['section-k'] && (
              <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h4 style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1rem' }}>
                      Status Kesiapan: {completedCount} dari {checklist.length} Poin Terpenuhi ({progressPercent}%)
                    </h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                      Centang setiap item setelah Anda memverifikasinya secara langsung pada proyek.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                      onClick={() => handleCheckAll(true)}
                    >
                      Centang Semua
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                      onClick={() => handleCheckAll(false)}
                    >
                      Reset Checklist
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: '100%',
                      background: progressPercent === 100 ? 'var(--accent-success)' : 'linear-gradient(90deg, #6366f1, #06b6d4)',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>

                {/* Checklist Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                  {checklist.map((item, idx) => (
                    <label
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        padding: '0.75rem 1rem',
                        background: item.checked ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-secondary)',
                        border: `1px solid ${item.checked ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleChecklistItem(item.id)}
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: 'var(--accent-success)',
                          cursor: 'pointer'
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.88rem',
                          color: item.checked ? '#f8fafc' : 'var(--text-muted)',
                          textDecoration: item.checked ? 'none' : 'none',
                          fontWeight: item.checked ? 500 : 400
                        }}
                      >
                        {idx + 1}. {item.label}
                      </span>
                    </label>
                  ))}
                </div>

                {progressPercent === 100 && (
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      textAlign: 'center',
                      color: '#34d399',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      marginTop: '0.5rem'
                    }}
                  >
                    🎉 SEMUA STANDAR TERPENUHI! Video dokumenter Anda siap untuk dirilis ke publik.
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Bottom Back Button */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
            <button
              className="btn btn-secondary"
              onClick={onGoDashboard}
              style={{ fontSize: '0.9rem', padding: '0.6rem 1.5rem' }}
            >
              ← Kembali ke Dashboard Proyek
            </button>
            <button
              className="btn btn-primary"
              onClick={onNewProject}
              style={{ fontSize: '0.9rem', padding: '0.6rem 1.5rem' }}
            >
              Mulai Buat Proyek Sekarang →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
