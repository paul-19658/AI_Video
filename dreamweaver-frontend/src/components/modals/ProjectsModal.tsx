import React from 'react';
import { useGeneration } from '../../contexts/GenerationContext';

const ProjectsModal: React.FC = () => {
  const { projects, loadProject, formatDate, setShowProjects } = useGeneration();

  return (
    <div className="dw-modal-overlay" onClick={() => setShowProjects(false)}>
      <div className="dw-modal dw-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="dw-modal-header">
          <h2 className="dw-modal-title">我的项目</h2>
          <button onClick={() => setShowProjects(false)} className="dw-modal-close" title="关闭">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <div className="dw-modal-body">
          {projects.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
              <i className="fa-solid fa-folder-open text-4xl mb-4 opacity-50"></i>
              <p>暂无项目</p>
            </div>
          ) : (
            <div className="space-y-3" style={{ overflowY: 'auto', maxHeight: '60vh' }}>
              {projects.map(project => (
                <div
                  key={project.id}
                  onClick={() => loadProject(project)}
                  className="dw-card"
                  style={{ padding: 'var(--spacing-md)', cursor: 'pointer' }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold truncate flex-1" style={{ color: 'var(--color-text)' }}>{project.title || project.prompt}</h3>
                    <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>{formatDate(project.created_at)}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {project.current_step === 'outline' && <span className="dw-project-card-status">大纲</span>}
                    {project.current_step === 'story' && <span className="dw-project-card-status" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>故事</span>}
                    {project.current_step === 'keyframes' && <span className="dw-project-card-status" style={{ background: 'rgba(236, 72, 153, 0.2)', color: '#ec4899' }}>关键帧</span>}
                    {project.current_step === 'video' && <span className="dw-project-card-status" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}>视频</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsModal;
