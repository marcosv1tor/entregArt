import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Verificar token ao carregar a aplicação
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const userData = await authService.verifyToken();
          setUser(userData.user);
          setToken(savedToken);
        } catch (error) {
          console.error('Token inválido:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, senha) => {
    try {
      const response = await authService.login(email, senha);
      const { user: userData, token: userToken } = response;
      
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Erro no login:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao fazer login' 
      };
    }
  };

  const register = async (nome, email, senha) => {
    try {
      const response = await authService.register(nome, email, senha);
      const { user: userData, token: userToken } = response;
      
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao criar conta' 
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};