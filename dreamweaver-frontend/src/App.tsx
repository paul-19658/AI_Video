import React, { useEffect } from 'react';
import './stability-ai.css';
import VideoBackground from './components/VideoBackground';
import { AuthProvider } from './contexts/AuthContext';
import { GenerationProvider, useGeneration } from './contexts/GenerationContext';
import Header from './components/Header';
import Progress from './components/Progress';
import InputStep from './components/steps/InputStep';
import OutlineStep from './components/steps/OutlineStep';
import StoryStep from './components/steps/StoryStep';
import KeyframesStep from './components/steps/KeyframesStep';
import VideoStep from './components/steps/VideoStep';
import AuthModal from './components/modals/AuthModal';
import ProjectsModal from './components/modals/ProjectsModal';
import ProfileModal from './components/modals/ProfileModal';
import VersionHistoryModal from './components/modals/VersionHistoryModal';
import ChangePasswordModal from './components/modals/ChangePasswordModal';
import { AppStep } from './types';
import { useAuth } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  const { currentStep, state, nextStepTrigger, enlargedImage, setEnlargedImage, triggerNextStep, setState, showProfile, showProjects } = useGeneration();
  const { showLogin, showRegister } = useAuth();

  // 监听 nextStepTrigger 变化，自动执行对应步骤
  useEffect(() => {
    if (nextStepTrigger) {
      triggerNextStep();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextStepTrigger]);

  const renderDisplay = () => {
    switch (currentStep) {
      case AppStep.OUTLINE:
        return <OutlineStep />;
      case AppStep.STORY:
        return <StoryStep />;
      case AppStep.KEYFRAMES:
        return <KeyframesStep />;
      case AppStep.VIDEO:
        return <VideoStep />;
      default:
        return <InputStep />;
    }
  };

  return (
    <>
      {enlargedImage && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <img
            src={enlargedImage}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setEnlargedImage(null)}
            className="absolute right-4 top-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-xl"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
      )}
      <VideoBackground />
      <div className="dw-container">
        <Header />

        {/* 项目弹窗 */}
        {showProjects && <ProjectsModal />}

        {/* 版本历史弹窗 */}
        <VersionHistoryModal />

        <main className="dw-main w-full px-3 py-6 sm:px-6 md:px-8 lg:px-12 md:py-12">
          {state.error && (
            <div className="max-w-2xl mx-auto mb-10 bg-red-900/20 border border-red-500/50 p-4 rounded-2xl flex items-start gap-3 text-red-200 animate-shake">
              <i className="fa-solid fa-circle-exclamation mt-1"></i>
              <div>
                <p className="font-bold">生成出错</p>
                <p className="text-sm opacity-80">{state.error}</p>
                <button onClick={() => setState((prev) => ({ ...prev, status: 'idle', error: null }))} className="mt-2 text-xs font-bold underline">
                  关闭
                </button>
              </div>
            </div>
          )}

          <Progress />

          <div className="relative w-full min-w-0">{renderDisplay()}</div>
        </main>

        <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full"></div>
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
          .animate-fadeIn { animation: fadeIn 0.8s ease-out; }
          .animate-slideUp { animation: slideUp 0.6s ease-out forwards; }
          .animate-shake { animation: shake 0.4s ease-in-out; }
        `}</style>

        {/* 登录/注册弹窗 */}
        {(showLogin || showRegister) && <AuthModal />}

        {/* 个人中心弹窗 */}
        {showProfile && <ProfileModal />}

        {/* 修改密码弹窗 */}
        <ChangePasswordModal />
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <GenerationProvider>
        <AppContent />
      </GenerationProvider>
    </AuthProvider>
  );
};

export default App;
