import api from './api';

export const authService = {
  // Registrar novo usuário
  async register(nome, email, senha) {
    const response = await api.post('/auth/register', {
      nome,
      email,
      senha
    });
    return response;
  },

  // Fazer login
  async login(email, senha) {
    const response = await api.post('/auth/login', {
      email,
      senha
    });
    return response;
  },

  // Verificar token
  async verifyToken() {
    const response = await api.get('/auth/verify');
    return response;
  },

  // Fazer logout
  async logout() {
    const response = await api.post('/auth/logout');
    return response;
  }
};