import React, { useEffect } from 'react';
import { useGeneration } from '../../contexts/GenerationContext';

const VersionHistoryModal: React.FC = () => {
  const { state, showVersionHistory, setShowVersionHistory, formatDate, versions, loadVersionHistory } = useGeneration();

  useEffect(() => {
    if (showVersionHistory) {
      loadVersionHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showVersionHistory]);

  if (!showVersionHistory) return null;

  const loadSpecificOutline = (_outlineId: string) => {
    alert('切换版本功能开发中');
    setShowVersionHistory(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowVersionHistory(false)}>
      <div className="bg-gray-900 p-6 md:p-8 rounded-xl max-w-lg w-full mx-4 border border-gray-800 max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold">版本历史</h2>
          <button onClick={() => setShowVersionHistory(false)} className="text-gray-400 hover:text-white">
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-6">
          {/* 大纲版本 */}
          <div>
            <h3 className="text-purple-400 font-bold mb-2">大纲 ({versions?.outlines?.length || 0})</h3>
            <div className="space-y-2">
              {versions?.outlines?.map((o: any) => (
                <div
                  key={o.id}
                  onClick={() => loadSpecificOutline(o.id)}
                  className={`p-3 rounded-lg cursor-pointer border ${o.id === state.outlineId ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{o.title}</span>
                    <span className="text-xs text-gray-500">{formatDate(o.created_at)}</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    {o.is_ai_generated ? (
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">AI</span>
                    ) : (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">用户修改</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 故事版本 */}
          {versions?.stories?.length > 0 && (
            <div>
              <h3 className="text-blue-400 font-bold mb-2">故事 ({versions.stories.length})</h3>
              <div className="space-y-2">
                {versions.stories.map((s: any) => (
                  <div key={s.id} className={`p-3 rounded-lg cursor-pointer border ${s.id === state.storyId ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'}`}>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-gray-300 truncate">{s.content_preview}...</span>
                      <span className="text-xs text-gray-500">{formatDate(s.created_at)}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {s.is_ai_generated ? (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">AI</span>
                      ) : (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">用户修改</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 关键帧版本 */}
          {versions?.keyframes?.length > 0 && (
            <div>
              <h3 className="text-pink-400 font-bold mb-2">关键帧 ({versions.keyframes.length})</h3>
              <div className="space-y-2">
                {versions.keyframes.map((k: any) => (
                  <div key={k.id} className="p-3 rounded-lg border border-gray-700 bg-gray-800/50">
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-gray-300">关键帧 {k.sequence || ''}</span>
                      <span className="text-xs text-gray-500">{formatDate(k.created_at)}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {k.is_ai_generated ? (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">AI</span>
                      ) : (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">用户修改</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryModal;
