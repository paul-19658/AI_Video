import type { StoryOutline, Keyframe } from '../types';

const API_BASE = '/dreamweaver-api/api';

// Token management
let authToken: string | null = localStorage.getItem('token');

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export function getToken(): string | null {
  return authToken;
}

export function clearToken() {
  setToken(null);
}

async function fetchApi<T>(url: string, body?: object, method: string = 'POST'): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (res.status === 401) {
    clearToken();
    throw new Error('请重新登录');
  }
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : err.detail?.message || '请求失败');
  }
  return res.json();
}

// Auth API
export async function login(username: string, password: string): Promise<{ access_token: string }> {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '登录失败' }));
    throw new Error(err.detail || '登录失败');
  }
  
  const data = await res.json();
  setToken(data.access_token);
  return data;
}

export async function register(username: string, password: string, email?: string): Promise<void> {
  await fetchApi<{ id: string }>(`${API_BASE}/auth/register`, {
    username,
    password,
    email: email || undefined,
  });
}

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
}

export async function getCurrentUser(): Promise<User> {
  return fetchApi<User>(`${API_BASE}/auth/me`, undefined, 'GET');
}

export async function updateUser(avatar?: string, email?: string): Promise<User> {
  return fetchApi<User>(`${API_BASE}/auth/me`, { avatar, email }, 'PUT');
}

export async function uploadAvatar(file: File): Promise<User> {
  const formData = new FormData();
  formData.append('file', file);
  
  const headers: Record<string, string> = {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const res = await fetch(`${API_BASE}/auth/avatar`, {
    method: 'POST',
    headers,
    body: formData,
  });
  
  if (res.status === 401) {
    clearToken();
    throw new Error('请重新登录');
  }
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '上传失败' }));
    throw new Error(typeof err.detail === 'string' ? err.detail : err.detail?.message || '上传失败');
  }
  return res.json();
}

// Projects API
export interface Project {
  id: string;
  prompt: string;
  title?: string;
  status: string;
  current_step: string;
  created_at: string;
  updated_at: string;
}

export async function getProjects(): Promise<Project[]> {
  return fetchApi<Project[]>(`${API_BASE}/projects`, undefined, 'GET');
}

export async function createProject(prompt: string): Promise<Project> {
  return fetchApi<Project>(`${API_BASE}/projects`, { prompt });
}

export async function getProject(id: string): Promise<any> {
  return fetchApi<any>(`${API_BASE}/projects/${id}`, undefined, 'GET');
}

export async function deleteProject(id: string): Promise<void> {
  await fetchApi<any>(`${API_BASE}/projects/${id}`, undefined, 'DELETE');
}

// 保存版本 API
export async function saveOutlineVersion(projectId: string, title: string, chapters: string[], parentId?: string): Promise<{ id: string }> {
  return fetchApi<{ id: string }>(`${API_BASE}/projects/${projectId}/outline`, {
    title,
    chapters,
    parent_id: parentId || null,
    is_ai_generated: 0
  });
}

export async function saveStoryVersion(projectId: string, content: string, outlineId: string, parentId?: string): Promise<{ id: string }> {
  return fetchApi<{ id: string }>(`${API_BASE}/projects/${projectId}/story`, {
    content,
    outline_id: outlineId,
    parent_id: parentId || null,
    is_ai_generated: 0
  });
}

export async function saveKeyframeVersion(projectId: string, description: string, visualPrompt: string, storyId: string, imagePath?: string, parentId?: string): Promise<{ id: string }> {
  return fetchApi<{ id: string }>(`${API_BASE}/projects/${projectId}/keyframes`, {
    description,
    visual_prompt: visualPrompt,
    image_path: imagePath || null,
    story_id: storyId,
    parent_id: parentId || null,
    is_ai_generated: 0
  });
}

export interface ProjectVersions {
  outlines: Array<{
    id: string;
    title: string;
    parent_id: string | null;
    is_ai_generated: number;
    created_at: string;
  }>;
  stories: Array<{
    id: string;
    outline_id: string | null;
    parent_id: string | null;
    is_ai_generated: number;
    created_at: string;
    content_preview: string;
  }>;
  keyframes: Array<{
    id: string;
    story_id: string | null;
    parent_id: string | null;
    is_ai_generated: number;
    created_at: string;
  }>;
}

export async function getProjectVersions(projectId: string): Promise<ProjectVersions> {
  return fetchApi<ProjectVersions>(`${API_BASE}/projects/${projectId}/versions`, undefined, 'GET');
}

export interface OutlineVersionDetail {
  id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  chapters: string;
  is_ai_generated: number;
  created_at: string;
}

export interface StoryVersionDetail {
  id: string;
  project_id: string;
  outline_id: string | null;
  parent_id: string | null;
  content: string;
  is_ai_generated: number;
  created_at: string;
}

export interface KeyframeVersionDetail {
  id: string;
  project_id: string;
  story_id: string | null;
  parent_id: string | null;
  sequence: number;
  description: string;
  visual_prompt: string;
  image_path: string;
  is_ai_generated: number;
  created_at: string;
}

export async function getOutlineVersion(projectId: string, outlineId: string): Promise<OutlineVersionDetail> {
  return fetchApi<OutlineVersionDetail>(`${API_BASE}/projects/${projectId}/outlines/${outlineId}`, undefined, 'GET');
}

export async function getStoryVersion(projectId: string, storyId: string): Promise<StoryVersionDetail> {
  return fetchApi<StoryVersionDetail>(`${API_BASE}/projects/${projectId}/stories/${storyId}`, undefined, 'GET');
}

export async function getKeyframeVersion(projectId: string, keyframeId: string): Promise<KeyframeVersionDetail> {
  return fetchApi<KeyframeVersionDetail>(`${API_BASE}/projects/${projectId}/keyframes/${keyframeId}`, undefined, 'GET');
}

// Generation API
const GEN_API_BASE = '/dreamweaver-api/api/generate';

export async function generateOutline(prompt: string): Promise<{ outline: StoryOutline, project_id: string }> {
  return fetchApi<{ outline: StoryOutline, project_id: string }>(`${GEN_API_BASE}/outline`, { prompt });
}

export async function generateLongStory(outline: StoryOutline, projectId?: string, outlineId?: string): Promise<{ long_story: string, project_id: string, outline_id: string }> {
  const data = await fetchApi<{ long_story: string, project_id: string, outline_id: string }>(`${GEN_API_BASE}/story`, { 
    outline, 
    project_id: projectId,
    outline_id: outlineId 
  });
  return data;
}

export async function generateKeyframeScenes(longStory: string, projectId?: string, storyId?: string): Promise<{ keyframes: Keyframe[], project_id: string, story_id: string }> {
  const data = await fetchApi<{ keyframes: Array<{ id: string; story_id: string; description: string; visual_prompt: string; image_url: string }>, project_id: string, story_id: string }>(`${GEN_API_BASE}/keyframes`, { 
    long_story: longStory, 
    project_id: projectId,
    story_id: storyId
  });
  return {
    project_id: data.project_id,
    story_id: data.story_id,
    keyframes: data.keyframes.map((k) => ({
      id: k.id,
      storyId: k.story_id,
      description: k.description,
      visualPrompt: k.visual_prompt,
      imageUrl: k.image_url,
    }))
  };
}

export async function generateVideo(prompt: string, imageBase64?: string, projectId?: string, keyframeId?: string): Promise<string> {
  const data = await fetchApi<{ video_url: string }>(`${GEN_API_BASE}/video`, {
    prompt,
    image_base64: imageBase64 || undefined,
    project_id: projectId,
    keyframe_id: keyframeId
  });
  return data.video_url;
}

// Change password
export async function changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`${API_BASE}/auth/change-password`, {
    old_password: oldPassword,
    new_password: newPassword
  });
}
