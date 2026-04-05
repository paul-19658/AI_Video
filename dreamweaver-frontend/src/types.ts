export enum AppStep {
  INPUT = 'INPUT',
  OUTLINE = 'OUTLINE',
  STORY = 'STORY',
  KEYFRAMES = 'KEYFRAMES',
  VIDEO = 'VIDEO'
}

export interface Project {
  id: string;
  prompt: string;
  title?: string;
  status: string;
  current_step: string;
  created_at: string;
  updated_at: string;
}

export interface StoryOutline {
  title: string;
  chapters: string[];
}

export interface Keyframe {
  id: string;
  storyId: string | null;  // 关联的故事 ID
  description: string;
  imageUrl: string;
  visualPrompt: string;
}

export interface GenerationState {
  prompt: string;
  outline: StoryOutline | null;
  outlineId: string | null;  // 当前大纲版本 ID
  longStory: string | null;
  storyId: string | null;    // 当前故事版本 ID
  keyframes: Keyframe[];
  videoUrl: string | null;
  projectId: string | null;
  status: 'idle' | 'processing' | 'waiting' | 'completed' | 'error';
  error: string | null;
}
