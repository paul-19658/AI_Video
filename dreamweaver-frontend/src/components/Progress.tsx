import React from 'react';
import { AppStep } from '../types';
import { useGeneration } from '../contexts/GenerationContext';

const STEP_DATA = [
  { step: AppStep.INPUT, label: '主题', icon: 'fa-lightbulb' },
  { step: AppStep.OUTLINE, label: '大纲', icon: 'fa-list-check' },
  { step: AppStep.STORY, label: '故事', icon: 'fa-book-open' },
  { step: AppStep.KEYFRAMES, label: '关键帧', icon: 'fa-film' },
  { step: AppStep.VIDEO, label: '视频', icon: 'fa-clapperboard' },
];

const Progress: React.FC = () => {
  const { currentStep, setCurrentStep, state } = useGeneration();

  const canClick = (step: AppStep) => {
    switch (step) {
      case AppStep.INPUT: return !!state.prompt;
      case AppStep.OUTLINE: return !!state.outline;
      case AppStep.STORY: return !!state.longStory;
      case AppStep.KEYFRAMES: return state.keyframes.length > 0;
      case AppStep.VIDEO: return !!state.videoUrl;
      default: return false;
    }
  };

  return (
    <>
      {/* 桌面：横向步骤条（md+） */}
      <div className="flex justify-center mb-8 w-full">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 md:px-8 lg:px-12">
          <div className="flex justify-center w-full">
            <div className="relative inline-flex w-[min(760px,100%)] justify-between">
              <div className="absolute left-6 right-6 top-6 z-0 h-0.5 bg-gray-800" />
              {STEP_DATA.map((item) => {
                const stepIdx = STEP_DATA.findIndex((s) => s.step === item.step);
                const activeIdx = STEP_DATA.findIndex((s) => s.step === currentStep);
                const isActive = activeIdx >= stepIdx;
                const isCurrent = currentStep === item.step;
                const clickable = canClick(item.step);

                return (
                  <div
                    key={item.step}
                    className="relative z-10 flex w-20 flex-col items-center md:w-24"
                    style={{ cursor: clickable ? 'pointer' : 'default' }}
                    onClick={() => clickable && setCurrentStep(item.step)}
                  >
                    <div
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isActive ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500'
                      } ${isCurrent ? 'step-active scale-105 ring-3 ring-purple-600/30' : ''} ${clickable ? 'hover:scale-105' : ''}`}
                    >
                      <i className={`fa-solid ${item.icon} text-sm md:text-lg`}></i>
                    </div>
                    <span className={`mt-2 hidden w-full text-center text-xs font-semibold tracking-wider md:block ${isActive ? 'text-purple-400' : 'text-gray-600'}`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 移动端：横向滚动进度条 */}
      <div className="flex gap-4 overflow-x-auto py-2 pb-2 md:hidden">
        {STEP_DATA.map((item) => {
          const stepIdx = STEP_DATA.findIndex((s) => s.step === item.step);
          const activeIdx = STEP_DATA.findIndex((s) => s.step === currentStep);
          const isActive = activeIdx >= stepIdx;
          const isCurrent = currentStep === item.step;
          const clickable = canClick(item.step);

          return (
            <div
              key={item.step}
              className="flex flex-col items-center flex-shrink-0"
              style={{ cursor: clickable ? 'pointer' : 'default' }}
              onClick={() => clickable && setCurrentStep(item.step)}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isActive ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500'
                } ${isCurrent ? 'step-active ring-2 ring-purple-600/50' : ''}`}
              >
                <i className={`fa-solid ${item.icon} text-lg`}></i>
              </div>
              <span className={`mt-1 text-xs font-semibold ${isActive ? 'text-purple-400' : 'text-gray-600'}`}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Progress;
