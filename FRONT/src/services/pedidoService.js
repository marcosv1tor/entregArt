import api from './api';

const pedidoService = {
  // Listar pedidos
  async getAll(params = {}) {
    const response = await api.get('/pedidos', { params });
    return response;
  },

  // Buscar pedido por ID
  async getById(id) {
    const response = await api.get(`/pedidos/${id}`);
    return response;
  },

  // Criar novo pedido
  async create(data) {
    const response = await api.post('/pedidos', data);
    return response;
  },

  // Atualizar pedido
  async update(id, data) {
    const response = await api.put(`/pedidos/${id}`, data);
    return response;
  },

  // Atualizar status do pedido
  async updateStatus(id, status) {
    const response = await api.patch(`/pedidos/${id}/status`, { status });
    return response;
  },

  // Deletar pedido
  async delete(id) {
    const response = await api.delete(`/pedidos/${id}`);
    return response;
  },

  // Relatório de vendas
  async getRelatorio(params = {}) {
    const response = await api.get('/pedidos/relatorio', { params });
    return response;
  }
};

export default pedidoService;