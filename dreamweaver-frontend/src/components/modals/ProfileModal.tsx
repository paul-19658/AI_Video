import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGeneration } from '../../contexts/GenerationContext';

const ProfileModal: React.FC = () => {
  const { currentUser, handleLogout } = useAuth();
  const { projects, handleLoadProject, handleDeleteProject, setShowProfile, setShowChangePassword } = useGeneration();

  if (!currentUser) return null;

  return (
    <div className="dw-modal-overlay" onClick={() => setShowProfile(false)}>
      <div className="dw-modal dw-modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="dw-modal-header">
          <h2 className="dw-modal-title">个人中心</h2>
          <button onClick={() => setShowProfile(false)} className="dw-modal-close">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <div className="dw-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
          {/* 用户信息 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div className="dw-avatar dw-avatar-lg" style={{ marginBottom: 'var(--spacing-md)' }}>
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="avatar" />
              ) : (
                currentUser?.username?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-text)', marginBottom: 'var(--spacing-xs)' }}>{currentUser.username}</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: 'var(--spacing-md)' }}>{currentUser.email || '未设置邮箱'}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', width: '100%' }}>
              <button
                onClick={() => setShowChangePassword(true)}
                className="dw-btn dw-btn-secondary"
                style={{ width: '100%' }}
              >
                <i className="fa-solid fa-key"></i> 修改密码
              </button>
              <button
                onClick={() => { setShowProfile(false); handleLogout(); }}
                style={{ width: '100%', background: 'var(--color-bg-card)', border: '1px solid var(--border-color)', color: 'var(--color-error)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-sign-out-alt"></i> 退出登录
              </button>
            </div>
          </div>

          {/* 项目列表 */}
          <div style={{ width: '100%' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-text)', marginBottom: 'var(--spacing-md)' }}>我的项目</h4>
            {projects.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 'var(--spacing-xl)' }}>暂无项目</p>
            ) : (
              <div className="space-y-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {projects.map((project) => (
                  <div key={project.id} className="dw-card" style={{ padding: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h5 style={{ color: 'var(--color-text)', fontWeight: '500' }}>{project.title || (project.prompt && project.prompt.slice(0, 30))}</h5>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{new Date(project.created_at).toLocaleDateString()}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                      <button
                        onClick={() => handleLoadProject(project.id)}
                        style={{ padding: '4px 12px', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--color-accent)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '14px' }}
                      >
                        查看
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        style={{ padding: '4px 12px', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-error)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '14px' }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
