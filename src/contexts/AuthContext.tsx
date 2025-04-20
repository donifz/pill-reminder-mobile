import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, User, LoginData, RegisterData } from '../services/authService';
import PostLoginService from '../services/postLoginService';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginData) => {
    const loggedInUser = await authService.login(data);
    setUser(loggedInUser);
    
    // Handle post-login tasks
    try {
      const postLoginService = PostLoginService.getInstance();
      await postLoginService.handlePostLoginTasks();
    } catch (error) {
      console.error('Error in post-login tasks:', error);
    }
  };

  const register = async (data: RegisterData) => {
    const registeredUser = await authService.register(data);
    setUser(registeredUser);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 