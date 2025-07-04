import api from './api';

const produtoService = {
  // Listar produtos
  async getAll(params = {}) {
    const response = await api.get('/produtos', { params });
    return response;
  },

  // Buscar produto por ID
  async getById(id) {
    const response = await api.get(`/produtos/${id}`);
    return response;
  },

  // Buscar produtos por empresa
  async getByEmpresa(empresaId) {
    const response = await api.get(`/produtos/empresa/${empresaId}`);
    return response;
  },

  // Criar novo produto
  async create(data) {
    const response = await api.post('/produtos', data);
    return response;
  },

  // Atualizar produto
  async update(id, data) {
    const response = await api.put(`/produtos/${id}`, data);
    return response;
  },

  // Deletar produto
  async delete(id) {
    const response = await api.delete(`/produtos/${id}`);
    return response;
  }
};

export default produtoService;