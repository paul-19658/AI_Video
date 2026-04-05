import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppStep, GenerationState, Project } from '../types';
import * as api from '../services/api';

interface GenerationContextType {
  // State
  currentStep: AppStep;
  state: GenerationState;
  nextStepTrigger: AppStep | null;
  selectedTemplate: string;
  projects: Project[];
  editingOutline: boolean;
  editingStory: boolean;
  editOutlineTitle: string;
  editOutlineChapters: string;
  editStoryContent: string;
  enlargedImage: string | null;
  showProjects: boolean;
  showVersionHistory: boolean;
  showProfile: boolean;
  showChangePassword: boolean;
  versions: any;
  // Setters
  setCurrentStep: (step: AppStep) => void;
  setNextStepTrigger: (step: AppStep | null) => void;
  setSelectedTemplate: (id: string) => void;
  setEditingOutline: (v: boolean) => void;
  setEditingStory: (v: boolean) => void;
  setEditOutlineTitle: (v: string) => void;
  setEditOutlineChapters: (v: string) => void;
  setEditStoryContent: (v: string) => void;
  setEnlargedImage: (url: string | null) => void;
  setState: React.Dispatch<React.SetStateAction<GenerationState>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setShowProjects: (v: boolean) => void;
  setShowVersionHistory: (v: boolean) => void;
  setShowProfile: (v: boolean) => void;
  setShowChangePassword: (v: boolean) => void;
  setVersions: (v: any) => void;
  // Handlers
  handleError: (msg: string) => void;
  startGeneration: () => Promise<void>;
  triggerNextStep: () => Promise<void>;
  loadProject: (project: Project) => Promise<void>;
  handleLoadProject: (projectId: string) => Promise<void>;
  handleDeleteProject: (projectId: string) => Promise<void>;
  formatDate: (dateStr: string) => string;
  loadProjects: () => Promise<void>;
  loadVersionHistory: () => Promise<void>;
}

const GenerationContext = createContext<GenerationContextType | null>(null);

const TEMPLATES = [
  { id: 'steampunk', name: '蒸汽朋克', icon: 'fa-solid fa-gear', color: 'from-amber-600 to-orange-500', prompt: '蒸汽朋克风格的', placeholder: '例如：日食下的蒸汽朋克云端之城...' },
  { id: 'scifi', name: '科幻', icon: 'fa-solid fa-rocket', color: 'from-cyan-500 to-blue-600', prompt: '科幻风格的', placeholder: '例如：火星殖民地的叛军领袖...' },
  { id: 'fantasy', name: '奇幻', icon: 'fa-solid fa-wand-magic-sparkles', color: 'from-purple-600 to-pink-500', prompt: '奇幻风格的', placeholder: '例如：被遗忘的龙之传承...' },
  { id: 'mystery', name: '悬疑', icon: 'fa-solid fa-magnifying-glass', color: 'from-gray-600 to-slate-800', prompt: '悬疑风格的', placeholder: '例如：古宅深夜的脚步声...' },
  { id: 'romance', name: '爱情', icon: 'fa-solid fa-heart', color: 'from-rose-500 to-pink-400', prompt: '爱情风格的', placeholder: '例如：咖啡店里的雨中邂逅...' },
  { id: 'custom', name: '自定义', icon: 'fa-solid fa-pen', color: 'from-gray-500 to-gray-400', prompt: '', placeholder: '输入你自己的想法...' },
];

export const GenerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.INPUT);
  const [state, setState] = useState<GenerationState>({
    prompt: '',
    outline: null,
    outlineId: null,
    longStory: null,
    storyId: null,
    keyframes: [],
    videoUrl: null,
    projectId: null,
    status: 'idle',
    error: null,
  });

  const [nextStepTrigger, setNextStepTrigger] = useState<AppStep | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');

  const [editingOutline, setEditingOutline] = useState(false);
  const [editingStory, setEditingStory] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [editOutlineTitle, setEditOutlineTitle] = useState('');
  const [editOutlineChapters, setEditOutlineChapters] = useState('');
  const [editStoryContent, setEditStoryContent] = useState('');
  const [versions, setVersions] = useState<any>(null);

  // Modal states
  const [showProjects, setShowProjects] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleError = useCallback((msg: string) => {
    setState((prev) => ({ ...prev, status: 'error', error: msg }));
  }, []);

  const loadProjects = useCallback(async () => {
    setShowProjects(true);
    try {
      const list = await api.getProjects();
      setProjects(list);
    } catch (err) {
      console.error('Failed to load projects:', err);
      setProjects([]);
    }
  }, []);

  const loadProject = useCallback(async (project: Project) => {
    try {
      const detail = await api.getProject(project.id);
      setState({
        prompt: project.prompt,
        outline: detail.outline ? { title: detail.outline.title, chapters: JSON.parse(detail.outline.chapters) } : null,
        outlineId: detail.outline?.id || null,
        longStory: detail.story?.content || null,
        storyId: detail.story?.id || null,
        keyframes: detail.keyframes?.map((k: any) => ({
          id: k.id,
          storyId: k.story_id || null,
          description: k.description,
          imageUrl: k.image_path || k.image_url || '',
          visualPrompt: k.visual_prompt,
        })) || [],
        videoUrl: null,
        projectId: project.id,
        status: 'idle',
        error: null,
      });
      if (detail.keyframes?.length > 0) {
        setCurrentStep(AppStep.KEYFRAMES);
      } else if (detail.story) {
        setCurrentStep(AppStep.STORY);
      } else if (detail.outline) {
        setCurrentStep(AppStep.OUTLINE);
      } else {
        setCurrentStep(AppStep.INPUT);
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    }
  }, []);

  const handleLoadProject = useCallback(async (projectId: string) => {
    const p = projects.find((x) => x.id === projectId);
    if (p) {
      await loadProject(p);
      return;
    }
    try {
      const detail = await api.getProject(projectId);
      await loadProject({
        id: projectId,
        prompt: typeof detail.prompt === 'string' ? detail.prompt : '',
        title: detail.title,
        status: String(detail.status ?? ''),
        current_step: String(detail.current_step ?? ''),
        created_at: detail.created_at ?? new Date().toISOString(),
        updated_at: detail.updated_at ?? new Date().toISOString(),
      });
    } catch {
      alert('加载项目失败');
    }
  }, [projects, loadProject]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    if (!window.confirm('确定删除该项目？')) return;
    try {
      await api.deleteProject(projectId);
      setProjects((prev) => prev.filter((x) => x.id !== projectId));
      if (state.projectId === projectId) {
        setState({
          prompt: '',
          outline: null,
          outlineId: null,
          longStory: null,
          storyId: null,
          keyframes: [],
          videoUrl: null,
          projectId: null,
          status: 'idle',
          error: null,
        });
        setCurrentStep(AppStep.INPUT);
      }
    } catch {
      alert('删除失败');
    }
  }, [state.projectId]);

  const formatDate = useCallback((dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }, []);

  const loadVersionHistory = useCallback(async () => {
    if (!state.projectId) return;
    try {
      const v = await api.getProjectVersions(state.projectId);
      setVersions(v);
      setShowVersionHistory(true);
    } catch (err) {
      console.error('Failed to load versions:', err);
    }
  }, [state.projectId]);

  const startGeneration = useCallback(async () => {
    if (!state.prompt.trim()) return;

    const template = TEMPLATES.find(t => t.id === selectedTemplate);
    const fullTheme = template && template.prompt
      ? `${template.prompt}${state.prompt}`
      : state.prompt;

    setState((prev) => ({ ...prev, status: 'processing', error: null }));
    setCurrentStep(AppStep.OUTLINE);

    try {
      const result = await api.generateOutline(fullTheme);
      setState((prev) => ({ ...prev, outline: result.outline, projectId: result.project_id, status: 'waiting' }));
      const list = await api.getProjects();
      setProjects(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '发生了意外错误。';
      handleError(message);
    }
  }, [state.prompt, selectedTemplate, handleError]);

  const triggerNextStep = useCallback(async () => {
    if (nextStepTrigger === AppStep.STORY) {
      try {
        setState(prev => ({ ...prev, status: 'processing' }));
        const result = await api.generateLongStory(state.outline!, state.projectId || undefined, state.outlineId || undefined);
        setState(prev => ({
          ...prev,
          longStory: result.long_story,
          storyId: result.outline_id,
          projectId: result.project_id,
          status: 'waiting',
        }));
        setCurrentStep(AppStep.STORY);
        setNextStepTrigger(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '发生了意外错误。';
        handleError(message);
      }
    } else if (nextStepTrigger === AppStep.KEYFRAMES) {
      try {
        setState(prev => ({ ...prev, status: 'processing' }));
        const result = await api.generateKeyframeScenes(state.longStory!, state.projectId || undefined, state.storyId || undefined);
        setState(prev => ({
          ...prev,
          keyframes: result.keyframes,
          projectId: result.project_id,
          status: 'waiting',
        }));
        setCurrentStep(AppStep.KEYFRAMES);
        setNextStepTrigger(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '发生了意外错误。';
        handleError(message);
      }
    } else if (nextStepTrigger === AppStep.VIDEO) {
      try {
        setState(prev => ({ ...prev, status: 'processing' }));
        if (state.keyframes.length > 0) {
          const videoUrl = await api.generateVideo(state.keyframes[0].visualPrompt, state.keyframes[0].imageUrl, state.projectId || undefined, state.keyframes[0].id);
          setState(prev => ({ ...prev, videoUrl, status: 'completed' }));
        } else {
          setState(prev => ({ ...prev, status: 'completed' }));
        }
        setCurrentStep(AppStep.VIDEO);
        setNextStepTrigger(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '发生了意外错误。';
        handleError(message);
      }
    }
  }, [nextStepTrigger, state]);

  return (
    <GenerationContext.Provider
      value={{
        currentStep,
        state,
        nextStepTrigger,
        selectedTemplate,
        projects,
        editingOutline,
        editingStory,
        editOutlineTitle,
        editOutlineChapters,
        editStoryContent,
        enlargedImage,
        showProjects,
        showVersionHistory,
        showProfile,
        showChangePassword,
        setCurrentStep,
        setNextStepTrigger,
        setSelectedTemplate,
        setEditingOutline,
        setEditingStory,
        setEditOutlineTitle,
        setEditOutlineChapters,
        setEditStoryContent,
        setEnlargedImage,
        setState,
        setProjects,
        setShowProjects,
        setShowVersionHistory,
        setShowProfile,
        setShowChangePassword,
        handleError,
        startGeneration,
        triggerNextStep,
        loadProject,
        handleLoadProject,
        handleDeleteProject,
        formatDate,
        loadProjects,
        loadVersionHistory,
        versions,
        setVersions,
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
};

export const useGeneration = () => {
  const ctx = useContext(GenerationContext);
  if (!ctx) throw new Error('useGeneration must be used within GenerationProvider');
  return ctx;
};

export { TEMPLATES };
