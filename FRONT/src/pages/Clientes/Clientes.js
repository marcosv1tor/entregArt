import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  X
} from 'lucide-react';
import clienteService from '../../services/clienteService';
import empresaService from '../../services/empresaService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './Clientes.css';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  useEffect(() => {
    loadEmpresas();
  }, []);

  useEffect(() => {
    loadClientes();
  }, [pagination.page, searchTerm]);

  const loadEmpresas = async () => {
    try {
      const response = await empresaService.getAll({ limit: 100 });
      setEmpresas(response.data?.empresas || response.empresas || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast.error('Erro ao carregar empresas');
    }
  };

  const loadClientes = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm })
      };
      
      const response = await clienteService.getAll(params);
      setClientes(response.data?.clientes || response.clientes || []);
      setPagination(prev => ({
        ...prev,
        total: response.data?.total || response.total || 0,
        totalPages: response.data?.totalPages || response.totalPages || 0
      }));
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const openModal = (cliente = null) => {
    setEditingCliente(cliente);
    if (cliente) {
      reset({
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        empresa: cliente.empresa?._id || cliente.empresa
      });
    } else {
      reset();
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCliente(null);
    reset();
  };

  const formatPhoneForSubmit = (phone) => {
    if (!phone) return '';
    // Remove todos os caracteres não numéricos
    const numbers = phone.replace(/\D/g, '');
    // Formata para (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  const onSubmit = async (data) => {
    try {
      // Formatar telefone antes de enviar
      const formattedData = {
        ...data,
        telefone: formatPhoneForSubmit(data.telefone)
      };

      if (editingCliente) {
        await clienteService.update(editingCliente._id, formattedData);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await clienteService.create(formattedData);
        toast.success('Cliente criado com sucesso!');
      }
      closeModal();
      loadClientes();
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao salvar cliente';
      toast.error(message);
    }
  };

  const handleDelete = async (cliente) => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente "${cliente.nome}"?`)) {
      try {
        await clienteService.delete(cliente._id);
        toast.success('Cliente excluído com sucesso!');
        loadClientes();
      } catch (error) {
        const message = error.response?.data?.message || 'Erro ao excluir cliente';
        toast.error(message);
      }
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      if (value.length > 6) {
        value = value.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
      } else if (value.length > 2) {
        value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
      } else if (value.length > 0) {
        value = value.replace(/(\d{0,2})/, '($1');
      }
    }
    e.target.value = value;
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (loading && clientes.length === 0) {
    return <LoadingSpinner message="Carregando clientes..." />;
  }

  return (
    <div className="clientes-page">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">Gerencie seus clientes</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => openModal()}
        >
          <Plus size={20} />
          Novo Cliente
        </button>
      </div>

      <div className="page-content">
        {/* Filtros */}
        <div className="filters">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
        </div>

        {/* Lista de clientes */}
        {clientes.length > 0 ? (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Telefone</th>
                    <th>Empresa</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cliente) => (
                    <tr key={cliente._id}>
                      <td className="font-medium">{cliente.nome}</td>
                      <td>{cliente.email}</td>
                      <td>{formatPhone(cliente.telefone)}</td>
                      <td>{cliente.empresa?.nomeFantasia || cliente.empresa?.razaoSocial || 'N/A'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon btn-icon-primary"
                            onClick={() => openModal(cliente)}
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="btn-icon btn-icon-danger"
                            onClick={() => handleDelete(cliente)}
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Anterior
                </button>
                <span className="pagination-info">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <Users size={48} />
            <h3>Nenhum cliente encontrado</h3>
            <p>Comece criando seu primeiro cliente</p>
            <button 
              className="btn btn-primary"
              onClick={() => openModal()}
            >
              <Plus size={20} />
              Novo Cliente
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
              <div className="form-group">
                <label htmlFor="nome" className="form-label">
                  Nome *
                </label>
                <input
                  type="text"
                  id="nome"
                  className={`form-input ${errors.nome ? 'form-input-error' : ''}`}
                  placeholder="Digite o nome do cliente"
                  {...register('nome', {
                    required: 'Nome é obrigatório'
                  })}
                />
                {errors.nome && (
                  <span className="form-error">{errors.nome.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  E-mail *
                </label>
                <input
                  type="email"
                  id="email"
                  className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                  placeholder="Digite o e-mail"
                  {...register('email', {
                    required: 'E-mail é obrigatório',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'E-mail inválido'
                    }
                  })}
                />
                {errors.email && (
                  <span className="form-error">{errors.email.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="telefone" className="form-label">
                  Telefone *
                </label>
                <input
                  type="text"
                  id="telefone"
                  className={`form-input ${errors.telefone ? 'form-input-error' : ''}`}
                  placeholder="(XX) XXXXX-XXXX"
                  maxLength="15"
                  onInput={handlePhoneChange}
                  {...register('telefone', {
                    required: 'Telefone é obrigatório'
                  })}
                />
                {errors.telefone && (
                  <span className="form-error">{errors.telefone.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="empresa" className="form-label">
                  Empresa *
                </label>
                <select
                  id="empresa"
                  className={`form-input ${errors.empresa ? 'form-input-error' : ''}`}
                  {...register('empresa', {
                    required: 'Empresa é obrigatória'
                  })}
                >
                  <option value="">Selecione uma empresa</option>
                  {empresas.map((empresa) => (
                    <option key={empresa._id} value={empresa._id}>
                      {empresa.nomeFantasia || empresa.razaoSocial}
                    </option>
                  ))}
                </select>
                {errors.empresa && (
                  <span className="form-error">{errors.empresa.message}</span>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCliente ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;