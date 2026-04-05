import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AuthModal: React.FC = () => {
  const {
    showLogin, showRegister, authError, setAuthError,
    username, password, email, setUsername, setPassword, setEmail,
    handleLogin, handleRegister, setShowLogin, setShowRegister,
  } = useAuth();

  if (!showLogin && !showRegister) return null;

  return (
    <div className="dw-modal-overlay">
      <div className="dw-modal">
        <div className="dw-modal-header">
          <h2 className="dw-modal-title" style={{ textAlign: 'center', width: '100%' }}>
            {showLogin ? '登录' : '注册'}
          </h2>
        </div>

        <div className="dw-modal-body">
          {authError && (
            <div className="dw-form-error" style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-md)', background: 'rgba(239, 68, 68, 0.2)' }}>
              {authError}
            </div>
          )}

          <form onSubmit={showLogin ? handleLogin : handleRegister}>
            <div className="dw-form-group">
              <label className="dw-form-label">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="dw-form-input"
                required
              />
            </div>

            {showRegister && (
              <div className="dw-form-group">
                <label className="dw-form-label">邮箱 (可选)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="dw-form-input"
                />
              </div>
            )}

            <div className="dw-form-group">
              <label className="dw-form-label">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="dw-form-input"
                required
              />
            </div>

            <button
              type="submit"
              className="dw-btn dw-btn-primary"
              style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
            >
              {showLogin ? '登录' : '注册'}
            </button>
          </form>

          <div className="mt-4 text-center" style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            {showLogin ? (
              <>
                没有账号？{' '}
                <button onClick={() => { setShowRegister(true); setShowLogin(false); setAuthError(''); }} style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  立即注册
                </button>
              </>
            ) : (
              <>
                已有账号？{' '}
                <button onClick={() => { setShowLogin(true); setShowRegister(false); setAuthError(''); }} style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  立即登录
                </button>
              </>
            )}
          </div>
        </div>

        <div className="dw-modal-footer">
          <button
            onClick={() => { setShowLogin(false); setShowRegister(false); }}
            style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
          >
            稍后再说
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
