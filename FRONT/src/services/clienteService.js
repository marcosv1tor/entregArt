import api from './api';

const clienteService = {
  // Listar clientes
  async getAll(params = {}) {
    const response = await api.get('/clientes', { params });
    return response;
  },

  // Buscar cliente por ID
  async getById(id) {
    const response = await api.get(`/clientes/${id}`);
    return response;
  },

  // Criar novo cliente
  async create(data) {
    const response = await api.post('/clientes', data);
    return response;
  },

  // Atualizar cliente
  async update(id, data) {
    const response = await api.put(`/clientes/${id}`, data);
    return response;
  },

  // Deletar cliente
  async delete(id) {
    const response = await api.delete(`/clientes/${id}`);
    return response;
  }
};

export default clienteService;