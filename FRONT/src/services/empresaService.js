import api from './api';

const empresaService = {
  // Listar empresas
  async getAll(params = {}) {
    const response = await api.get('/empresas', { params });
    return response;
  },

  // Buscar empresa por ID
  async getById(id) {
    const response = await api.get(`/empresas/${id}`);
    return response;
  },

  // Criar nova empresa
  async create(data) {
    const response = await api.post('/empresas', data);
    return response;
  },

  // Atualizar empresa
  async update(id, data) {
    const response = await api.put(`/empresas/${id}`, data);
    return response;
  },

  // Deletar empresa
  async delete(id) {
    const response = await api.delete(`/empresas/${id}`);
    return response;
  }
};

export default empresaService;