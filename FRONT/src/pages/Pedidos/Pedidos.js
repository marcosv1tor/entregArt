import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import pedidoService from '../../services/pedidoService';
import clienteService from '../../services/clienteService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './Pedidos.css';

const Pedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 10;

  const statusOptions = [
    { value: '', label: 'Todos os status' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'confirmado', label: 'Confirmado' },
    { value: 'em_preparacao', label: 'Em Preparação' },
    { value: 'enviado', label: 'Enviado' },
    { value: 'entregue', label: 'Entregue' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  useEffect(() => {
    fetchPedidos();
    fetchClientes();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const response = await pedidoService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        status: statusFilter
      });
      setPedidos(response.pedidos || []);
      setTotalPages(response.pagination ? response.pagination.pages : 1);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await clienteService.getAll({ limit: 1000 });
      setClientes(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setClientes([]);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este pedido?')) {
      try {
        await pedidoService.delete(id);
        // Remover alert duplicado - o interceptor já mostra o toast
        fetchPedidos(); // Recarregar a lista
      } catch (error) {
        console.error('Erro ao excluir pedido:', error);
        // Remover alert duplicado - o interceptor já mostra o toast
      }
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

 const getClienteName = (cliente) => {
    // Se empresa é um objeto (populado pelo backend)
    if (typeof cliente === 'object' && cliente !== null) {
      return cliente.nome|| 'N/A';
    }
    // Se empresa é apenas um ID
    if (typeof cliente === 'string') {
      const clienteEncontrado = clientes.find(c => c._id === cliente);
      return clienteEncontrado ? clienteEncontrado.nomeFantasia || clienteEncontrado.razaoSocial : 'N/A';
    }
    return 'N/A';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pendente: { label: 'Pendente', class: 'status-pendente' },
      confirmado: { label: 'Confirmado', class: 'status-confirmado' },
      em_preparacao: { label: 'Em Preparação', class: 'status-preparacao' },
      enviado: { label: 'Enviado', class: 'status-enviado' },
      entregue: { label: 'Entregue', class: 'status-entregue' },
      cancelado: { label: 'Cancelado', class: 'status-cancelado' }
    };

    const config = statusConfig[status] || { label: status, class: 'status-default' };
    return (
      <span className={`status-badge ${config.class}`}>
        {config.label}
      </span>
    );
  };

  if (loading && pedidos.length === 0) {
    return <LoadingSpinner message="Carregando pedidos..." />;
  }

  return (
    <div className="pedidos-page">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Pedidos</h1>
          <p className="page-subtitle">Gerencie os pedidos dos seus clientes</p>
        </div>
        <Link to="/pedidos/novo" className="btn btn-primary">
          <Plus size={20} />
          Novo Pedido
        </Link>
      </div>

      <div className="page-content">
        <div className="filters">
          <div className="filters-row">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Buscar pedidos..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
            </div>
            <div className="filter-select">
              <select
                value={statusFilter}
                onChange={handleStatusFilter}
                className="form-input"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
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
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Observações</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.length > 0 ? (
                    pedidos.map((pedido) => (
                      <tr key={pedido._id || pedido.id}>
                        <td>
                          <div className="pedido-numero">
                            #{pedido.numero || pedido._id || pedido.id}
                          </div>
                        </td>
                        <td>
                          <div className="pedido-cliente">
                            {getClienteName(pedido.cliente)}
                          </div>
                        </td>
                        <td>
                          <span className="pedido-data">
                            {formatDate(pedido.data)}
                          </span>
                        </td>
                        <td>
                          {getStatusBadge(pedido.status)}
                        </td>
                        <td>
                          <span className="pedido-total">
                            {formatCurrency(pedido.valorTotal || 0)}
                          </span>
                        </td>
                        <td>
                          <span className="pedido-observacoes">
                            {pedido.observacao || 'N/A'}
                          </span>
                        </td>
                        <td className="actions">
                          <Link to={`/pedidos/${pedido._id || pedido.id}`} className="btn-action btn-view" title="Visualizar">
                            <Eye size={16} />
                          </Link>
                          <Link to={`/pedidos/editar/${pedido._id || pedido.id}`} className="btn-action btn-edit" title="Editar">
                            <Edit size={16} />
                          </Link>
                          <button 
                            onClick={() => handleDelete(pedido._id || pedido.id)} 
                            className="btn-action btn-delete" 
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">
                        {searchTerm || statusFilter ? 'Nenhum pedido encontrado.' : 'Nenhum pedido cadastrado.'}
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
    </div>
  );
};

export default Pedidos;