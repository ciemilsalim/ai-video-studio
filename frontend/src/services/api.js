const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch system health');
  return res.json();
}

export async function fetchProjects() {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function fetchProject(id) {
  const res = await fetch(`${API_BASE}/projects/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch project ${id}`);
  return res.json();
}

export async function createProject(payload) {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export async function updateProject(id, projectData) {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectData)
  });
  if (!res.ok) throw new Error(`Failed to update project ${id}`);
  return res.json();
}

export async function deleteProject(id) {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`Failed to delete project ${id}`);
  return res.json();
}

export async function fetchFlowPrompts(projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/prompts/flow`);
  if (!res.ok) throw new Error(`Failed to fetch Flow prompts for ${projectId}`);
  return res.json();
}

export async function fetchFlowPromptsMarkdown(projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/prompts/flow/export-markdown`);
  if (!res.ok) throw new Error(`Failed to export Flow prompts markdown`);
  return res.json();
}

export async function renderProjectDemo(projectId, durationSec = 5.0, fps = 30) {
  const res = await fetch(`${API_BASE}/renders/project/${projectId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ duration_sec: durationSec, fps })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Render request failed' }));
    throw new Error(errorData.detail || 'Gagal merender video');
  }
  return res.json();
}

export async function renderStandaloneDemo(title, subtitle = null, durationSec = 5.0, fps = 30) {
  const res = await fetch(`${API_BASE}/renders/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, subtitle, duration_sec: durationSec, fps })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Render request failed' }));
    throw new Error(errorData.detail || 'Gagal merender video demo');
  }
  return res.json();
}

export async function fetchRenders() {
  const res = await fetch(`${API_BASE}/renders`);
  if (!res.ok) throw new Error('Failed to fetch renders list');
  return res.json();
}

export async function addScene(projectId, sceneData) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/storyboard/scenes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sceneData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to add scene' }));
    throw new Error(err.detail || 'Gagal menambah adegan');
  }
  return res.json();
}

export async function updateScene(projectId, sceneId, sceneData) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/storyboard/scenes/${sceneId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sceneData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update scene' }));
    throw new Error(err.detail || 'Gagal mengubah adegan');
  }
  return res.json();
}

export async function deleteScene(projectId, sceneId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/storyboard/scenes/${sceneId}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete scene' }));
    throw new Error(err.detail || 'Gagal menghapus adegan');
  }
  return res.json();
}

export async function reorderScenes(projectId, sceneIds) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/storyboard/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scene_ids: sceneIds })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to reorder scenes' }));
    throw new Error(err.detail || 'Gagal mengurutkan adegan');
  }
  return res.json();
}

export async function generateSceneNarration(projectId, sceneId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/narration/scene/${sceneId}`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to generate speech' }));
    throw new Error(err.detail || 'Gagal membuat narasi suara');
  }
  return res.json();
}

export async function generateAllNarration(projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/narration/all`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to generate speech batch' }));
    throw new Error(err.detail || 'Gagal membuat narasi batch');
  }
  return res.json();
}

export async function assembleProjectVideo(projectId) {
  const res = await fetch(`${API_BASE}/renders/assemble/${projectId}`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to assemble video' }));
    throw new Error(err.detail || 'Gagal merakit video multi-adegan');
  }
  return res.json();
}

