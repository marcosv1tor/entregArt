import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building2,
  X
} from 'lucide-react';
import empresaService from '../../services/empresaService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './Empresas.css';

const Empresas = () => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState(null);
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
  }, [pagination.page, searchTerm]);

  const loadEmpresas = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm })
      };
      
      const response = await empresaService.getAll(params);
      setEmpresas(response.empresas || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 0
      }));
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast.error('Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const openModal = (empresa = null) => {
    setEditingEmpresa(empresa);
    if (empresa) {
      reset({
        nomeFantasia: empresa.nomeFantasia,
        razaoSocial: empresa.razaoSocial,
        cnpj: empresa.cnpj.replace(/\D/g, '') // Remove formatação para edição
      });
    } else {
      reset();
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEmpresa(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      // Formatar CNPJ para o formato esperado pela API
      const formattedData = {
        ...data,
        cnpj: formatCNPJForAPI(data.cnpj)
      };

      if (editingEmpresa) {
        await empresaService.update(editingEmpresa._id, formattedData);
        toast.success('Empresa atualizada com sucesso!');
      } else {
        await empresaService.create(formattedData);
        toast.success('Empresa criada com sucesso!');
      }
      closeModal();
      loadEmpresas();
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao salvar empresa';
      toast.error(message);
    }
  };

  const handleDelete = async (empresa) => {
    if (window.confirm(`Tem certeza que deseja excluir a empresa "${empresa.nomeFantasia}"?`)) {
      try {
        await empresaService.delete(empresa._id);
        toast.success('Empresa excluída com sucesso!');
        loadEmpresas();
      } catch (error) {
        const message = error.response?.data?.message || 'Erro ao excluir empresa';
        toast.error(message);
      }
    }
  };

  const formatCNPJ = (cnpj) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatCNPJForAPI = (cnpj) => {
    // Remove tudo que não é número
    const numbers = cnpj.replace(/\D/g, '');
    // Formata para XX.XXX.XXX/XXXX-XX
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (loading && empresas.length === 0) {
    return <LoadingSpinner message="Carregando empresas..." />;
  }

  return (
    <div className="empresas-page">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Empresas</h1>
          <p className="page-subtitle">Gerencie suas empresas</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => openModal()}
        >
          <Plus size={20} />
          Nova Empresa
        </button>
      </div>

      <div className="page-content">
        {/* Filtros */}
        <div className="filters">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Buscar empresas..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
        </div>

        {/* Lista de empresas */}
        {empresas.length > 0 ? (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome Fantasia</th>
                    <th>Razão Social</th>
                    <th>CNPJ</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {empresas.map((empresa) => (
                    <tr key={empresa._id}>
                      <td className="font-medium">{empresa.nomeFantasia}</td>
                      <td>{empresa.razaoSocial}</td>
                      <td>{formatCNPJ(empresa.cnpj)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon btn-icon-primary"
                            onClick={() => openModal(empresa)}
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="btn-icon btn-icon-danger"
                            onClick={() => handleDelete(empresa)}
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
            <Building2 size={48} />
            <h3>Nenhuma empresa encontrada</h3>
            <p>Comece criando sua primeira empresa</p>
            <button 
              className="btn btn-primary"
              onClick={() => openModal()}
            >
              <Plus size={20} />
              Nova Empresa
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
                {editingEmpresa ? 'Editar Empresa' : 'Nova Empresa'}
              </h2>
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
              <div className="form-group">
                <label htmlFor="nomeFantasia" className="form-label">
                  Nome Fantasia *
                </label>
                <input
                  type="text"
                  id="nomeFantasia"
                  className={`form-input ${errors.nomeFantasia ? 'form-input-error' : ''}`}
                  placeholder="Digite o nome fantasia"
                  {...register('nomeFantasia', {
                    required: 'Nome fantasia é obrigatório'
                  })}
                />
                {errors.nomeFantasia && (
                  <span className="form-error">{errors.nomeFantasia.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="razaoSocial" className="form-label">
                  Razão Social *
                </label>
                <input
                  type="text"
                  id="razaoSocial"
                  className={`form-input ${errors.razaoSocial ? 'form-input-error' : ''}`}
                  placeholder="Digite a razão social"
                  {...register('razaoSocial', {
                    required: 'Razão social é obrigatória'
                  })}
                />
                {errors.razaoSocial && (
                  <span className="form-error">{errors.razaoSocial.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="cnpj" className="form-label">
                  CNPJ *
                </label>
                <input
                  type="text"
                  id="cnpj"
                  className={`form-input ${errors.cnpj ? 'form-input-error' : ''}`}
                  placeholder="Digite o CNPJ"
                  {...register('cnpj', {
                    required: 'CNPJ é obrigatório',
                    pattern: {
                      value: /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$|^\d{14}$/,
                      message: 'CNPJ deve conter 14 dígitos'
                    }
                  })}
                />
                {errors.cnpj && (
                  <span className="form-error">{errors.cnpj.message}</span>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEmpresa ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Empresas;