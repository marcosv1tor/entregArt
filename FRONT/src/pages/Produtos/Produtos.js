import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import produtoService from '../../services/produtoService';
import empresaService from '../../services/empresaService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './Produtos.css';

const Produtos = () => {
  const [produtos, setProdutos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduto, setEditingProduto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const itemsPerPage = 10;

  useEffect(() => {
    fetchProdutos();
    fetchEmpresas();
  }, [currentPage, searchTerm]);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      const response = await produtoService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm
      });
      setProdutos(response.produtos || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmpresas = async () => {
    try {
      const response = await empresaService.getAll({ limit: 1000 });
      setEmpresas(response.empresas || []);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
      setEmpresas([]);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const openModal = (produto = null) => {
    setEditingProduto(produto);
    if (produto) {
      reset({
        nome: produto.nome,
        valor: produto.valor,
        descricao: produto.descricao || '',
        empresa: produto.empresa
      });
    } else {
      reset({
        nome: '',
        valor: '',
        descricao: '',
        empresa: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduto(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      
      const produtoData = {
        nome: data.nome,
        valor: parseFloat(data.valor),
        descricao: data.descricao,
        empresa: data.empresa
      };

      if (editingProduto) {
        await produtoService.update(editingProduto._id, produtoData);
        alert('Produto atualizado com sucesso!');
      } else {
        await produtoService.create(produtoData);
        alert('Produto cadastrado com sucesso!');
      }

      closeModal();
      fetchProdutos();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await produtoService.delete(id);
        alert('Produto excluído com sucesso!');
        fetchProdutos();
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto. Tente novamente.');
      }
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getEmpresaName = (empresa) => {
    // Se empresa é um objeto (populado pelo backend)
    if (typeof empresa === 'object' && empresa !== null) {
      return empresa.nomeFantasia || empresa.razaoSocial || 'N/A';
    }
    // Se empresa é apenas um ID
    if (typeof empresa === 'string') {
      const empresaEncontrada = empresas.find(e => e._id === empresa);
      return empresaEncontrada ? empresaEncontrada.nomeFantasia || empresaEncontrada.razaoSocial : 'N/A';
    }
    return 'N/A';
  };

  if (loading && produtos.length === 0) {
    return <LoadingSpinner message="Carregando produtos..." />;
  }

  return (
    <div className="produtos-page">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Produtos</h1>
          <p className="page-subtitle">Gerencie os produtos da sua empresa</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => openModal()}
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      <div className="page-content">
        <div className="filters">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner size="small" />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Valor</th>
                    <th>Descrição</th>
                    <th>Empresa</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.length > 0 ? (
                    produtos.map((produto) => (
                      <tr key={produto._id}>
                        <td>
                          <div className="produto-info">
                            <div className="produto-name">{produto.nome}</div>
                          </div>
                        </td>
                        <td>
                          <span className="produto-valor">
                            {formatCurrency(produto.valor)}
                          </span>
                        </td>
                        <td>
                          <span className="produto-descricao">
                            {produto.descricao || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className="produto-empresa">
                            {getEmpresaName(produto.empresa)}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-icon btn-icon-primary"
                              onClick={() => openModal(produto)}
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="btn-icon btn-icon-danger"
                              onClick={() => handleDelete(produto._id)}
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        {searchTerm ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </button>
                <span className="pagination-info">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  className="btn btn-outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingProduto ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input
                  type="text"
                  className={`form-input ${errors.nome ? 'error' : ''}`}
                  {...register('nome', { 
                    required: 'Nome é obrigatório',
                    minLength: { value: 2, message: 'Nome deve ter pelo menos 2 caracteres' }
                  })}
                />
                {errors.nome && <span className="error-message">{errors.nome.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Valor *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`form-input ${errors.valor ? 'error' : ''}`}
                  {...register('valor', { 
                    required: 'Valor é obrigatório',
                    min: { value: 0, message: 'Valor deve ser maior que zero' }
                  })}
                />
                {errors.valor && <span className="error-message">{errors.valor.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea
                  className="form-input"
                  rows="3"
                  {...register('descricao')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Empresa *</label>
                <select
                  className={`form-input ${errors.empresa ? 'error' : ''}`}
                  {...register('empresa', { required: 'Empresa é obrigatória' })}
                >
                  <option value="">Selecione uma empresa</option>
                  {empresas.map((empresa) => (
                    <option key={empresa._id} value={empresa._id}>
                      {empresa.nomeFantasia || empresa.razaoSocial}
                    </option>
                  ))}
                </select>
                {errors.empresa && <span className="error-message">{errors.empresa.message}</span>}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Salvando...' : (editingProduto ? 'Atualizar' : 'Criar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Produtos;