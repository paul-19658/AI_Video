import React from 'react';
import { AppStep } from '../../types';
import { useGeneration } from '../../contexts/GenerationContext';

const KeyframesStep: React.FC = () => {
  const { state, nextStepTrigger, setState, setNextStepTrigger, setEnlargedImage } = useGeneration();

  return (
    <div className="space-y-12 animate-slideUp" style={{ width: '100%', maxWidth: '1152px', margin: '0 auto' }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[0, 1, 2].map((idx) => {
          const kf = state.keyframes[idx];
          return (
            <div
              key={idx}
              className="glass rounded-3xl overflow-hidden group border-2 border-transparent hover:border-purple-500/30 transition-all"
            >
              <div className="aspect-video bg-gray-800 relative">
                {kf ? (
                  <img
                    src={kf.imageUrl}
                    alt={kf.description}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700 cursor-pointer"
                    onClick={() => setEnlargedImage(kf.imageUrl)}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                    <i className="fa-solid fa-image text-4xl mb-2 animate-pulse"></i>
                    <p className="text-xs uppercase tracking-widest">正在生成画面...</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
              <div className="p-6">
                <h4 className="font-bold text-purple-400 mb-2">场景 {idx + 1}</h4>
                <p className="text-sm text-gray-400 line-clamp-3">
                  {kf ? kf.description : '正在分析故事脉络，寻找最佳画面...'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {state.status !== 'processing' && state.keyframes.length > 0 && (
        <div className="text-center space-y-6 pt-6">
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setNextStepTrigger(AppStep.VIDEO)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-4 rounded-full font-bold shadow-xl transition-all text-lg"
            >
              继续生成视频
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, status: 'idle' }))}
              className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-full font-bold transition-all text-lg"
            >
              返回修改
            </button>
          </div>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            视频合成约需 2 分钟，正在将故事精髓化为动态画面，请稍候。
          </p>
        </div>
      )}
      {state.status === 'processing' && nextStepTrigger === AppStep.VIDEO && (
        <div className="text-center space-y-4 pt-10">
          <div className="flex items-center justify-center gap-4 text-pink-400 text-xl font-semibold">
            <i className="fa-solid fa-video animate-pulse"></i>
            正在为第一帧注入电影感...
          </div>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            视频合成约需 2 分钟，正在将故事精髓化为动态画面，请稍候。
          </p>
        </div>
      )}
    </div>
  );
};

export default KeyframesStep;
