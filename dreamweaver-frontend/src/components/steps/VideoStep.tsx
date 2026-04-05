import React from 'react';
import { useGeneration } from '../../contexts/GenerationContext';

const VideoStep: React.FC = () => {
  const { state } = useGeneration();

  return (
    <div className="animate-slideUp" style={{ width: '100%', maxWidth: '1152px', margin: '0 auto' }}>
      <div className="glass p-4 rounded-[40px] overflow-hidden shadow-2xl shadow-purple-900/20">
        <div className="aspect-video bg-black rounded-[32px] overflow-hidden relative group">
          {state.videoUrl ? (
            <video
              src={state.videoUrl}
              controls
              autoPlay
              loop
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                <i className="fa-solid fa-film text-3xl text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></i>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold gradient-text mb-2">正在完成电影级作品</h3>
                <p className="text-gray-500 animate-pulse">视频接口尚未实现，请在后端实现 Veo。</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {state.videoUrl && (
        <div className="mt-12 text-center space-y-6">
          <div className="flex justify-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-full font-bold transition-all"
            >
              创作新故事
            </button>
            <a
              href={state.videoUrl}
              download="dreamweaver_story.mp4"
              className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-full font-bold shadow-lg transition-all flex items-center gap-2"
            >
              <i className="fa-solid fa-download"></i>
              下载视频
            </a>
          </div>
          <div className="p-8 glass rounded-3xl text-left">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <i className="fa-solid fa-circle-info text-blue-400"></i>
              幕后说明
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              本项目使用 AI：<span className="text-white px-2 py-0.5 bg-white/5 rounded">大模型</span> 生成叙事，图片生成绘制关键帧，视频由后端 API 合成。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoStep;
