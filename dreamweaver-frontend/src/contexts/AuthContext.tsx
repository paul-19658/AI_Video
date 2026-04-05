import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  currentUser: User | null;
  showLogin: boolean;
  showRegister: boolean;
  authError: string;
  // Setters
  setShowLogin: (show: boolean) => void;
  setShowRegister: (show: boolean) => void;
  setAuthError: (error: string) => void;
  // Form fields
  username: string;
  password: string;
  email: string;
  setUsername: (v: string) => void;
  setPassword: (v: string) => void;
  setEmail: (v: string) => void;
  // Handlers
  handleLogin: (e: React.FormEvent) => Promise<void>;
  handleRegister: (e: React.FormEvent) => Promise<void>;
  handleLogout: () => void;
  setCurrentUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!api.getToken());
  const [currentUser, setCurrentUser] = useState<api.User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [authError, setAuthError] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  // 初始化时如果已登录，自动获取用户信息
  useEffect(() => {
    if (isLoggedIn && !currentUser) {
      api.getCurrentUser()
        .then(user => setCurrentUser(user))
        .catch(() => {
          api.clearToken();
          setIsLoggedIn(false);
        });
    }
  }, [isLoggedIn]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await api.login(username, password);
      setIsLoggedIn(true);
      setShowLogin(false);
      setUsername('');
      setPassword('');
      try {
        const user = await api.getCurrentUser();
        setCurrentUser(user);
      } catch {}
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '登录失败');
    }
  }, [username, password]);

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await api.register(username, password, email);
      await api.login(username, password);
      setIsLoggedIn(true);
      setShowRegister(false);
      setUsername('');
      setPassword('');
      setEmail('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '注册失败');
    }
  }, [username, password, email]);

  const handleLogout = useCallback(() => {
    api.clearToken();
    setIsLoggedIn(false);
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        currentUser,
        showLogin,
        showRegister,
        authError,
        setShowLogin,
        setShowRegister,
        setAuthError,
        username,
        password,
        email,
        setUsername,
        setPassword,
        setEmail,
        handleLogin,
        handleRegister,
        handleLogout,
        setCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
