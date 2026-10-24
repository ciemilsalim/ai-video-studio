import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProjectCard from './components/ProjectCard';
import CreateProjectModal from './components/CreateProjectModal';
import StoryboardViewer from './components/StoryboardViewer';
import PromptStudioModal from './components/PromptStudioModal';
import RenderModal from './components/RenderModal';
import AssetManagerModal from './components/AssetManagerModal';
import MotionOverlayModal from './components/MotionOverlayModal';
import {
  fetchHealth,
  fetchProjects,
  fetchProject,
  createProject,
  deleteProject,
  renderProjectDemo,
  renderStandaloneDemo,
  assembleProjectVideo
} from './services/api';

export default function App() {
  const [health, setHealth] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeStoryboardProject, setActiveStoryboardProject] = useState(null);
  const [activePromptStudioId, setActivePromptStudioId] = useState(null);
  const [activeAssetProject, setActiveAssetProject] = useState(null);
  const [assetTargetSceneId, setAssetTargetSceneId] = useState(null);
  const [activeMotionScene, setActiveMotionScene] = useState(null);

  // Render modal state
  const [isRenderOpen, setIsRenderOpen] = useState(false);
  const [isAssemblyMode, setIsAssemblyMode] = useState(false);
  const [renderTarget, setRenderTarget] = useState(null); // project object or null (for standalone)
  const [renderStatus, setRenderStatus] = useState('idle'); // idle, rendering, success, error
  const [renderResult, setRenderResult] = useState(null);

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

  const handleOpenRender = (project) => {
    setRenderTarget(project);
    setIsAssemblyMode(false);
    setRenderStatus('idle');
    setRenderResult(null);
    setIsRenderOpen(true);
  };

  const handleOpenStandaloneRender = () => {
    setRenderTarget(null);
    setIsAssemblyMode(false);
    setRenderStatus('idle');
    setRenderResult(null);
    setIsRenderOpen(true);
  };

  const handleOpenAssembly = (project) => {
    setRenderTarget(project);
    setIsAssemblyMode(true);
    setRenderStatus('idle');
    setRenderResult(null);
    setIsRenderOpen(true);
  };

  const handleOpenAssetManager = async (projectOrId, sceneId = null) => {
    try {
      let targetProj = projectOrId;
      if (typeof projectOrId === 'string') {
        targetProj = await fetchProject(projectOrId);
      }
      setActiveAssetProject(targetProj);
      setAssetTargetSceneId(sceneId);
    } catch (err) {
      alert(`Gagal membuka Asset Manager: ${err.message}`);
    }
  };

  const handleTriggerRender = async (durationSec) => {
    try {
      setRenderStatus('rendering');
      let res;
      if (isAssemblyMode && renderTarget) {
        res = await assembleProjectVideo(renderTarget.id);
      } else if (renderTarget) {
        res = await renderProjectDemo(renderTarget.id, durationSec);
      } else {
        res = await renderStandaloneDemo(
          'Demonstrasi Video Vertikal 1080x1920',
          'Uji Coba Langsung Mesin FFmpeg 7.1',
          durationSec
        );
      }
      setRenderResult(res);
      setRenderStatus('success');
    } catch (err) {
      setRenderResult({ error: err.message });
      setRenderStatus('error');
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
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              style={{ borderColor: 'var(--accent-success)', color: '#34d399' }}
              onClick={handleOpenStandaloneRender}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              Uji Render 9:16 Cepat
            </button>
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
                  onOpenRender={handleOpenRender}
                  onOpenAssembly={handleOpenAssembly}
                  onOpenAssetManager={handleOpenAssetManager}
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
          onOpenAssembly={(p) => {
            setActiveStoryboardProject(null);
            handleOpenAssembly(p);
          }}
          onOpenAssetManager={(sceneId) => {
            handleOpenAssetManager(activeStoryboardProject, sceneId);
          }}
          onOpenMotionOverlay={(scene) => {
            setActiveMotionScene(scene);
          }}
          onProjectUpdated={(p) => {
            setActiveStoryboardProject(p);
            initApp();
          }}
        />
      )}

      {activeAssetProject && (
        <AssetManagerModal
          isOpen={!!activeAssetProject}
          project={activeAssetProject}
          initialSceneId={assetTargetSceneId}
          onClose={() => {
            setActiveAssetProject(null);
            setAssetTargetSceneId(null);
          }}
          onProjectUpdated={(updated) => {
            setActiveAssetProject(updated);
            if (activeStoryboardProject && activeStoryboardProject.id === updated.id) {
              setActiveStoryboardProject(updated);
            }
            initApp();
          }}
        />
      )}

      {activePromptStudioId && (
        <PromptStudioModal
          projectId={activePromptStudioId}
          onClose={() => setActivePromptStudioId(null)}
        />
      )}

      {activeMotionScene && activeStoryboardProject && (
        <MotionOverlayModal
          isOpen={!!activeMotionScene}
          projectId={activeStoryboardProject.id}
          scene={activeMotionScene}
          onClose={() => setActiveMotionScene(null)}
          onOverlaysUpdated={async () => {
            try {
              const fresh = await fetchProject(activeStoryboardProject.id);
              setActiveStoryboardProject(fresh);
              const freshScene = fresh.storyboard?.scenes?.find(s => s.scene_id === activeMotionScene.scene_id);
              if (freshScene) setActiveMotionScene(freshScene);
              initApp();
            } catch (err) {
              console.error('Failed refreshing project after overlay update:', err);
            }
          }}
        />
      )}

      <RenderModal
        isOpen={isRenderOpen}
        onClose={() => setIsRenderOpen(false)}
        projectName={renderTarget ? renderTarget.title : 'Demonstrasi Standalone FFmpeg'}
        renderStatus={renderStatus}
        renderResult={renderResult}
        onTriggerRender={handleTriggerRender}
        isAssembly={isAssemblyMode}
      />
    </div>
  );
}
