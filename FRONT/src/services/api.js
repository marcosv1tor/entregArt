import axios from 'axios';
import { toast } from 'react-toastify';

// Configuração base da API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Tratar erros de autenticação
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      toast.error('Sessão expirada. Faça login novamente.');
      return Promise.reject(error);
    }

    // Tratar outros erros HTTP
    const message = error.response?.data?.message || 'Erro interno do servidor';
    
    // Não mostrar toast para erros de validação (400) pois são tratados nos componentes
    if (error.response?.status !== 400) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;