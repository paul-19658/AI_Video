import React from 'react';
import { AppStep } from '../../types';
import { useGeneration } from '../../contexts/GenerationContext';
import * as api from '../../services/api';

const StoryStep: React.FC = () => {
  const { state, nextStepTrigger, setState, setNextStepTrigger, editingStory, setEditingStory,
          editStoryContent, setEditStoryContent } = useGeneration();

  return (
    <div className="animate-slideUp space-y-6" style={{ width: '100%', maxWidth: '896px', margin: '0 auto' }}>
      {/* 标题区 */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          {state.outline?.title}
        </h2>
        {!editingStory && state.longStory && (
          <button
            onClick={() => {
              setEditStoryContent(state.longStory || '');
              setEditingStory(true);
            }}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 px-4 py-2 rounded-full border border-gray-700 transition-all"
          >
            <i className="fa-solid fa-pen"></i> 编辑故事
          </button>
        )}
      </div>

      {/* 故事内容 */}
      <div className="glass rounded-2xl p-6 md:p-8">
        {editingStory ? (
          /* 编辑模式 */
          <div className="space-y-4">
            <textarea
              value={editStoryContent}
              onChange={(e) => setEditStoryContent(e.target.value)}
              className="w-full bg-gray-800/80 border border-gray-600 rounded-xl px-4 py-3 text-white min-h-[350px] focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
              placeholder="故事内容..."
            />
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setEditingStory(false)}
                className="px-6 py-2.5 rounded-xl text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 transition-all"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  if (!state.projectId || !state.outlineId) {
                    alert('缺少大纲信息');
                    return;
                  }
                  try {
                    await api.saveStoryVersion(state.projectId, editStoryContent, state.outlineId, undefined);
                    setEditingStory(false);
                    setState(prev => ({ ...prev, longStory: editStoryContent }));
                  } catch {
                    alert('保存失败');
                  }
                }}
                className="px-6 py-2.5 rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold shadow-lg shadow-blue-900/30 transition-all"
              >
                保存新版本
              </button>
            </div>
          </div>
        ) : state.longStory ? (
          /* 展示模式 */
          <div className="prose prose-invert prose-lg max-w-none leading-loose">
            <p className="text-gray-300 whitespace-pre-wrap text-base md:text-lg leading-relaxed">{state.longStory}</p>
          </div>
        ) : (
          /* 加载中 */
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <i className="fa-solid fa-feather-pointed text-5xl mb-4 animate-bounce text-blue-400"></i>
            <p className="text-gray-400">正在描绘你的世界...</p>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {!editingStory && state.status !== 'processing' && state.longStory && (
        <div className="flex justify-center gap-5">
          <button
            onClick={() => setNextStepTrigger(AppStep.KEYFRAMES)}
            className="px-10 py-4 rounded-2xl text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 font-semibold text-base shadow-lg shadow-purple-900/30 transition-all"
          >
            继续生成关键帧
          </button>
          <button
            onClick={() => setState(prev => ({ ...prev, status: 'idle' }))}
            className="px-10 py-4 rounded-2xl text-gray-300 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-600 text-base font-medium transition-all"
          >
            返回修改
          </button>
        </div>
      )}

      {/* 生成中提示 */}
      {state.status === 'processing' && nextStepTrigger === AppStep.KEYFRAMES && (
        <div className="flex items-center justify-center gap-3 text-blue-400 animate-pulse py-4">
          <i className="fa-solid fa-wand-magic-sparkles"></i>
          <span>正在提取关键帧视觉...</span>
        </div>
      )}
    </div>
  );
};

export default StoryStep;
