import React from 'react';
import { useGeneration } from '../../contexts/GenerationContext';
import { TEMPLATES } from '../../contexts/GenerationContext';

const InputStep: React.FC = () => {
  const { state, setState, startGeneration, selectedTemplate, setSelectedTemplate } = useGeneration();

  return (
    <div className="dw-hero">
      <div className="dw-hero-bg">
        <div className="dw-hero-bg-overlay"></div>
      </div>

      <div className="dw-hero-content">
        <h1 className="dw-hero-title">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-lg)', flexWrap: 'wrap', marginBottom: 'var(--spacing-xl)' }}>
            <span style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 700, color: 'var(--color-text)' }}>
              想法
            </span>
            <i className="fa-solid fa-arrow-right" style={{ fontSize: '24px', color: 'var(--color-accent)' }}></i>
            <span style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              故事
            </span>
            <i className="fa-solid fa-arrow-right" style={{ fontSize: '24px', color: 'var(--color-accent)' }}></i>
            <span style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 700, color: 'var(--color-text)' }}>
              视频
            </span>
          </div>
          <p className="dw-hero-subtitle">
            从想法到视频，AI 一站式完成
          </p>
        </h1>

        {/* 模板选择器 */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3" style={{ marginBottom: 'var(--spacing-xl)' }}>
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                setSelectedTemplate(template.id);
                if (template.id !== 'custom') {
                  setState((prev) => ({ ...prev, prompt: '' }));
                }
              }}
              className="dw-card"
              style={{
                padding: 'var(--spacing-md)',
                cursor: 'pointer',
                background: selectedTemplate === template.id ? 'var(--gradient-button)' : 'var(--color-bg-card)',
                border: selectedTemplate === template.id ? 'none' : '1px solid var(--border-color)',
              }}
            >
              <i className={`${template.icon} text-lg md:text-xl mb-1 block`} style={{ color: selectedTemplate === template.id ? '#fff' : 'var(--color-text-secondary)' }}></i>
              <span className="text-xs md:text-sm" style={{ color: selectedTemplate === template.id ? '#fff' : 'var(--color-text-secondary)' }}>{template.name}</span>
            </button>
          ))}
        </div>

        {/* 输入框 */}
        <div className="dw-input-wrapper">
          <textarea
            className="dw-input"
            placeholder={TEMPLATES.find(t => t.id === selectedTemplate)?.placeholder || "描述你的故事主题..."}
            value={state.prompt}
            onChange={(e) => setState((prev) => ({ ...prev, prompt: e.target.value }))}
            rows={3}
            style={{ resize: 'none', minHeight: '100px', width: '100%' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && state.prompt.trim()) {
                e.preventDefault();
                startGeneration();
              }
            }}
          />
        </div>

        {/* 生成按钮 */}
        <button
          disabled={!state.prompt.trim() || state.status === 'processing'}
          onClick={startGeneration}
          className="dw-btn dw-btn-primary"
          style={{ marginTop: 'var(--spacing-lg)', width: '100%', maxWidth: '600px' }}
        >
          {state.status === 'processing' ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i>
              生成中...
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              开始生成
            </>
          )}
        </button>

        {state.error && (
          <div className="dw-form-error" style={{ marginTop: 'var(--spacing-md)' }}>
            {state.error}
          </div>
        )}
      </div>
    </div>
  );
};

export default InputStep;
