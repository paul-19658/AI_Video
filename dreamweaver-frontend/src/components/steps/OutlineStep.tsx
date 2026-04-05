import React from 'react';
import { AppStep } from '../../types';
import { useGeneration } from '../../contexts/GenerationContext';
import * as api from '../../services/api';

const OutlineStep: React.FC = () => {
  const { state, currentStep, setState, setNextStepTrigger, editingOutline, setEditingOutline,
          editOutlineTitle, setEditOutlineTitle, editOutlineChapters, setEditOutlineChapters } = useGeneration();

  return (
    <div className="animate-slideUp" style={{ width: '100%', maxWidth: '896px', margin: '0 auto' }}>
      {state.status === 'processing' && currentStep === AppStep.OUTLINE ? (
        <div className="flex flex-col items-center justify-center py-24 w-full">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-6"></div>
          <p className="text-purple-400 text-lg animate-pulse">正在构思叙事...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 标题区 */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center justify-center gap-3">
              <i className="fa-solid fa-list-check text-purple-400"></i>
              <span>{state.outline?.title || ''}</span>
            </h2>
            {!editingOutline && state.outline && (
              <button
                onClick={() => {
                  setEditOutlineTitle(state.outline?.title || '');
                  setEditOutlineChapters(state.outline?.chapters.join('\n') || '');
                  setEditingOutline(true);
                }}
                className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 px-4 py-2 rounded-full border border-gray-700 transition-all"
              >
                <i className="fa-solid fa-pen"></i> 编辑大纲
              </button>
            )}
          </div>

          {/* 章节列表 */}
          {editingOutline ? (
            /* 编辑模式 */
            <div className="glass rounded-2xl p-6 md:p-8 space-y-4">
              <input
                type="text"
                value={editOutlineTitle}
                onChange={(e) => setEditOutlineTitle(e.target.value)}
                className="w-full bg-gray-800/80 border border-gray-600 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="大纲标题"
              />
              <textarea
                value={editOutlineChapters}
                onChange={(e) => setEditOutlineChapters(e.target.value)}
                className="w-full bg-gray-800/80 border border-gray-600 rounded-xl px-4 py-3 text-white min-h-[250px] focus:outline-none focus:border-purple-500 transition-colors resize-none"
                placeholder="每行一个章节..."
              />
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setEditingOutline(false)}
                  className="px-6 py-2.5 rounded-xl text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={async () => {
                    const chapters = editOutlineChapters.split('\n').filter(c => c.trim());
                    try {
                      await api.saveOutlineVersion(state.projectId!, editOutlineTitle, chapters, undefined);
                      setEditingOutline(false);
                      setState(prev => ({ ...prev, outline: { title: editOutlineTitle, chapters } }));
                    } catch {
                      alert('保存失败');
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 font-semibold shadow-lg shadow-purple-900/30 transition-all"
                >
                  保存新版本
                </button>
              </div>
            </div>
          ) : (
            /* 展示模式 */
            <div className="space-y-3">
              {state.outline?.chapters.map((chapter, i) => (
                <div key={i} className="group glass rounded-2xl p-5 flex gap-5 items-start border border-white/5 hover:border-purple-500/20 transition-all">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-sm">
                    {i + 1}
                  </div>
                  <p className="text-gray-300 leading-relaxed pt-1.5 text-base md:text-lg">{chapter}</p>
                </div>
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          {!editingOutline && state.status !== 'processing' && (
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={() => {
                  setEditOutlineTitle(state.outline?.title || '');
                  setEditOutlineChapters(state.outline?.chapters.join('\n') || '');
                  setEditingOutline(true);
                }}
                className="min-w-[140px] px-6 py-4 rounded-xl text-sm text-gray-400 hover:text-white bg-gray-800/60 hover:bg-gray-700/60 border border-gray-600 font-medium transition-all"
              >
                编辑大纲
              </button>
              <button
                onClick={() => setNextStepTrigger(AppStep.STORY)}
                className="min-w-[160px] px-8 py-4 rounded-xl text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 font-semibold text-sm shadow-lg shadow-purple-900/30 transition-all"
              >
                继续生成故事
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OutlineStep;
