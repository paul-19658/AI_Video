import React, { useState } from 'react';
import { useGeneration } from '../../contexts/GenerationContext';
import * as api from '../../services/api';

const ChangePasswordModal: React.FC = () => {
  const { showChangePassword, setShowChangePassword } = useGeneration();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  if (!showChangePassword) return null;

  const handleChangePassword = async () => {
    setPasswordError('');
    if (newPassword.length < 6) {
      setPasswordError('新密码至少6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('两次密码不一致');
      return;
    }

    try {
      await api.changePassword(oldPassword, newPassword);
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : '修改失败');
    }
  };

  return (
    <div className="dw-modal-overlay" style={{ zIndex: 1060 }} onClick={() => setShowChangePassword(false)}>
      <div className="dw-modal" onClick={e => e.stopPropagation()}>
        <div className="dw-modal-header">
          <h2 className="dw-modal-title">修改密码</h2>
          <button onClick={() => setShowChangePassword(false)} className="dw-modal-close">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <div className="dw-modal-body">
          {passwordSuccess ? (
            <div className="text-center py-8">
              <i className="fa-solid fa-check-circle text-5xl mb-4" style={{ color: 'var(--color-success)' }}></i>
              <p style={{ color: 'var(--color-success)', fontSize: '18px' }}>密码修改成功！</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="dw-form-group">
                  <label className="dw-form-label">旧密码</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    className="dw-form-input"
                    placeholder="请输入旧密码"
                  />
                </div>
                <div className="dw-form-group">
                  <label className="dw-form-label">新密码</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="dw-form-input"
                    placeholder="请输入新密码（至少6位）"
                  />
                </div>
                <div className="dw-form-group">
                  <label className="dw-form-label">确认新密码</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="dw-form-input"
                    placeholder="请再次输入新密码"
                  />
                </div>
                {passwordError && (
                  <p className="dw-form-error">{passwordError}</p>
                )}
              </div>
              <button
                onClick={handleChangePassword}
                className="dw-btn dw-btn-primary"
                style={{ width: '100%', marginTop: 'var(--spacing-lg)' }}
              >
                确认修改
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
