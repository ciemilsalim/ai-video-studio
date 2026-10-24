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
