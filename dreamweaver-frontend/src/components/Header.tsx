import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGeneration } from '../contexts/GenerationContext';
import * as api from '../services/api';

const Header: React.FC = () => {
  const { isLoggedIn, currentUser, handleLogout, setShowLogin, setShowRegister, setCurrentUser } = useAuth();
  const { state, setCurrentStep, loadProjects, setShowProfile, loadVersionHistory } = useGeneration();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleAvatarUpload = async (file: File) => {
    try {
      const user = await api.uploadAvatar(file);
      setCurrentUser(user);
    } catch {
      alert('上传失败');
    }
    setShowUserMenu(false);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] border-b border-white/10 bg-black/75 backdrop-blur-xl"
      onClick={() => setShowUserMenu(false)}
    >
      <div className="flex h-16 w-full justify-between">
        {/* Logo */}
        <div
          className="flex min-w-0 cursor-pointer items-center gap-2.5 md:gap-3"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentStep(0 as any);
          }}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-blue-600 text-sm font-bold text-white shadow-md shadow-purple-900/30 md:h-10 md:w-10 md:rounded-xl">
            D
          </div>
          <span className="truncate text-lg font-bold tracking-tight text-white md:text-xl">
            DreamWeaver<span className="text-purple-500">AI</span>
          </span>
        </div>

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-2 md:gap-4">
          {/* Status indicator (mobile) */}
          <div
            className={`flex rounded-full border px-2 py-1 text-xs font-bold transition-colors sm:hidden ${
              state.status === 'processing'
                ? 'animate-pulse border-yellow-500/50 text-yellow-500'
                : 'border-emerald-500/50 text-emerald-500'
            }`}
            title={state.status === 'processing' ? '生成中' : '就绪'}
          >
            <i className={`fa-solid ${state.status === 'processing' ? 'fa-bolt' : 'fa-check'}`}></i>
          </div>

          {/* Status indicator (desktop) */}
          <div
            className={`hidden rounded-full border px-2 py-1 text-xs font-bold transition-colors sm:inline-flex md:px-4 md:py-1.5 ${
              state.status === 'processing'
                ? 'animate-pulse border-yellow-500/50 text-yellow-500'
                : 'border-emerald-500/50 text-emerald-500'
            }`}
          >
            <i className={`fa-solid ${state.status === 'processing' ? 'fa-bolt' : 'fa-check'} mr-1 md:mr-2`}></i>
            <span className="hidden md:inline">
              {state.status === 'processing' ? '生成中...' : '就绪'}
            </span>
          </div>

          <button type="button" className="text-gray-400 transition-colors hover:text-white" title="帮助">
            <i className="fa-regular fa-circle-question text-lg md:text-xl"></i>
          </button>

          {isLoggedIn && state.projectId && (
            <button
              type="button"
              onClick={loadVersionHistory}
              className="text-gray-400 transition-colors hover:text-yellow-400"
              title="版本历史"
            >
              <i className="fa-solid fa-code-branch text-lg md:text-xl"></i>
            </button>
          )}

          {isLoggedIn && (
            <button
              type="button"
              onClick={loadProjects}
              className="text-gray-400 transition-colors hover:text-cyan-400"
              title="我的项目"
            >
              <i className="fa-solid fa-folder-open text-lg md:text-xl"></i>
            </button>
          )}

          <a
            href="/dreamweaver/plan.html"
            target="_blank"
            rel="noreferrer"
            className="text-gray-400 transition-colors hover:text-purple-400"
            title="开发计划"
          >
            <i className="fa-solid fa-clipboard-list text-lg md:text-xl"></i>
          </a>

          {!isLoggedIn ? (
            <>
              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="dw-header-btn dw-header-btn-ghost hidden sm:inline-flex"
              >
                登录
              </button>
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="dw-header-btn dw-header-btn-primary"
              >
                开始创作
              </button>
            </>
          ) : currentUser ? (
            <div className="relative flex items-center gap-2">
              <span
                className="hidden cursor-pointer text-sm text-gray-400 hover:text-white md:inline"
                onClick={() => {
                  loadProjects();
                  setShowProfile(true);
                }}
              >
                {currentUser.username}
              </span>
              <div
                className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 text-sm font-bold text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserMenu(!showUserMenu);
                }}
              >
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  currentUser.username[0].toUpperCase()
                )}
              </div>
              {showUserMenu && (
                <div
                  className="absolute right-0 top-14 z-50 min-w-[160px] rounded-lg border border-gray-700 bg-gray-800 py-2 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                    }}
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700"
                  >
                    <i className="fa-solid fa-user-circle"></i> 更换头像
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowProfile(true);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700"
                  >
                    <i className="fa-solid fa-id-card"></i> 个人中心
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700"
                  >
                    <i className="fa-solid fa-sign-out-alt"></i> 退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="text-gray-400 transition-colors hover:text-red-400"
            >
              <i className="fa-solid fa-sign-out-alt text-xl"></i>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
