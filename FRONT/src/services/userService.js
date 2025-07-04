import api from './api';

const userService = {
  // Listar usuários
  async getAll(params = {}) {
    const response = await api.get('/users', { params });
    return response;
  },

  // Buscar usuário por ID
  async getById(id) {
    const response = await api.get(`/users/${id}`);
    return response;
  },

  // Atualizar perfil do usuário
  async updateProfile(data) {
    const response = await api.put('/users/profile', data);
    return response;
  },

  // Atualizar senha do usuário
  async updatePassword(data) {
    const response = await api.put('/users/password', data);
    return response;
  },

  // Deletar conta do usuário
  async deleteAccount() {
    const response = await api.delete('/users/account');
    return response;
  }
};

export default userService;