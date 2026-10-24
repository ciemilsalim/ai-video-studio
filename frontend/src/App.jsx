import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProjectCard from './components/ProjectCard';
import CreateProjectModal from './components/CreateProjectModal';
import StoryboardViewer from './components/StoryboardViewer';
import PromptStudioModal from './components/PromptStudioModal';
import { fetchHealth, fetchProjects, fetchProject, createProject, deleteProject } from './services/api';

export default function App() {
  const [health, setHealth] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeStoryboardProject, setActiveStoryboardProject] = useState(null);
  const [activePromptStudioId, setActivePromptStudioId] = useState(null);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      setLoading(true);
      const [hData, pData] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchProjects().catch(() => [])
      ]);
      setHealth(hData);
      setProjects(pData);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (payload) => {
    const newProj = await createProject(payload);
    await initApp();
    setActiveStoryboardProject(newProj);
  };

  const handleViewStoryboard = async (id) => {
    try {
      const proj = await fetchProject(id);
      setActiveStoryboardProject(proj);
    } catch (err) {
      alert(`Gagal memuat storyboard: ${err.message}`);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm(`Yakin ingin menghapus proyek ini?`)) return;
    try {
      await deleteProject(id);
      await initApp();
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  return (
    <div className="app-container">
      <Header health={health} onNewProjectClick={() => setIsCreateOpen(true)} />

      <main className="main-content">
        <section className="hero-banner">
          <div className="hero-text">
            <h1>Studio Produksi Video Dokumenter AI</h1>
            <p>
              Otomasi alur produksi video sinematik dengan visual prompts terstandarisasi untuk Google Flow,
              naskah terstruktur, motion graphics deklaratif, dan perakitan FFmpeg 1080×1920 (9:16).
            </p>
          </div>
          <div>
            <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
              + Mulai Proyek Baru
            </button>
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Daftar Proyek Aktif</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              {projects.length} Proyek Tersimpan
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              Memuat data proyek lokal...
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Belum ada proyek dokumenter</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Klik tombol di bawah untuk membuat proyek dokumenter pertama Anda.
              </p>
              <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
                Buat Proyek Pertama
              </button>
            </div>
          ) : (
            <div className="project-grid">
              {projects.map((proj) => (
                <ProjectCard
                  key={proj.id}
                  project={proj}
                  onViewStoryboard={handleViewStoryboard}
                  onOpenPromptStudio={(id) => setActivePromptStudioId(id)}
                  onDeleteProject={handleDeleteProject}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateProject}
      />

      {activeStoryboardProject && (
        <StoryboardViewer
          project={activeStoryboardProject}
          onClose={() => setActiveStoryboardProject(null)}
          onOpenPromptStudio={(id) => {
            setActiveStoryboardProject(null);
            setActivePromptStudioId(id);
          }}
        />
      )}

      {activePromptStudioId && (
        <PromptStudioModal
          projectId={activePromptStudioId}
          onClose={() => setActivePromptStudioId(null)}
        />
      )}
    </div>
  );
}
