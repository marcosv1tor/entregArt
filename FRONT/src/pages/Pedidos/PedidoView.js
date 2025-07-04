import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Calendar, User, Building, Package } from 'lucide-react';
import pedidoService from '../../services/pedidoService';
import clienteService from '../../services/clienteService';
import empresaService from '../../services/empresaService';
import produtoService from '../../services/produtoService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './PedidoView.css';

const PedidoView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPedido();
  }, [id]);

  const fetchPedido = async () => {
    try {
      setLoading(true);
      const pedidoData = await pedidoService.getById(id);
      console.log('Dados do pedido recebidos:', pedidoData);
      setPedido(pedidoData);

      // Buscar dados relacionados
      if (pedidoData.cliente) {
        try {
          const clienteData = await clienteService.getById(pedidoData.cliente);
          console.log('Dados do cliente recebidos:', clienteData);
          setCliente(clienteData);
        } catch (error) {
          console.error('Erro ao buscar cliente:', error);
        }
      }

      if (pedidoData.empresa) {
        try {
          const empresaData = await empresaService.getById(pedidoData.empresa);
          console.log('Dados da empresa recebidos:', empresaData);
          setEmpresa(empresaData);
        } catch (error) {
          console.error('Erro ao buscar empresa:', error);
        }
      }

      // Buscar produtos
      if (pedidoData.produtos && pedidoData.produtos.length > 0) {
        try {
          const produtosData = await produtoService.getAll();
          console.log('Dados dos produtos recebidos:', produtosData);
          // Verificar se é um array ou se tem uma propriedade que contém o array
          const produtosList = Array.isArray(produtosData) ? produtosData : 
                              (produtosData.produtos || produtosData.data || []);
          setProdutos(produtosList);
        } catch (error) {
          console.error('Erro ao buscar produtos:', error);
          setProdutos([]);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      // Remover alert duplicado - o interceptor já mostra o toast
      if (error.response?.status !== 401) {
        console.error('Erro detalhado:', error.response?.data || error.message);
      }
      navigate('/pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este pedido?')) {
      try {
        await pedidoService.delete(id);
        // Remover alert duplicado - o interceptor já mostra o toast
        navigate('/pedidos');
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
    if (!dateString) return 'Data não informada';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    return date.toLocaleDateString('pt-BR');
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

  const getProdutoNome = (produto) => {
    // Se produto é um objeto (populado pelo backend)
    if (typeof produto === 'object' && produto !== null) {
      return produto.nome|| 'N/A';
    }
    // Se produto é apenas um ID
    if (typeof produto === 'string') {
      const produtoEncontrado = produtos.find(p => p._id === produto);
      return produtoEncontrado ? produtoEncontrado.nome : 'N/A';
    }
    return 'N/A';
  };

  // const getProdutoNome = (produto) => {
  //   const produto = produtos.find(p => (p._id || p.id) === produtoId);
  //   return produto ? produto.nome : 'Produto não encontrado';
  // };

  if (loading) {
    return <LoadingSpinner message="Carregando pedido..." />;
  }

  if (!pedido) {
    return (
      <div className="pedido-view-page">
        <div className="error-message">
          <h2>Pedido não encontrado</h2>
          <Link to="/pedidos" className="btn btn-primary">
            Voltar para Pedidos
          </Link>
        </div>
      </div>
    );
  }

  // Debug logs
  console.log('Estado atual - pedido:', pedido);
  console.log('Estado atual - cliente:', cliente);
  console.log('Estado atual - empresa:', empresa);
  console.log('Estado atual - produtos:', produtos);

  return (
    <div className="pedido-view-page">
      <div className="page-header">
        <div className="page-title-section">
          <button 
            className="btn-back"
            onClick={() => navigate('/pedidos')}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">
              Pedido #{pedido.numero || pedido._id || pedido.id}
            </h1>
            <p className="page-subtitle">
              Detalhes do pedido
            </p>
          </div>
        </div>
        <div className="action-buttons">
          <Link 
            to={`/pedidos/editar/${pedido._id || pedido.id}`}
            className="btn btn-outline"
          >
            <Edit size={16} />
            Editar
          </Link>
          <button 
            className="btn btn-danger"
            onClick={handleDelete}
          >
            <Trash2 size={16} />
            Excluir
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="pedido-details">
          <div className="details-grid">
            <div className="detail-card">
              <div className="detail-header">
                <Building size={20} />
                <h3>Empresa</h3>
              </div>
              <div className="detail-content">
                <p>{pedido.empresa ? (pedido.empresa.nomeFantasia || pedido.empresa.razaoSocial || pedido.empresa.nome || 'Nome não informado') : 'Carregando...'}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-header">
                <User size={20} />
                <h3>Cliente</h3>
              </div>
              <div className="detail-content">
                <p>{pedido.cliente ? (pedido.cliente.nome || pedido.cliente.razaoSocial || 'Nome não informado') : 'Carregando...'}</p>
                {pedido.cliente && pedido.cliente.telefone && (
                  <p className="detail-secondary">Tel: {pedido.cliente.telefone}</p>
                )}
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-header">
                <Calendar size={20} />
                <h3>Data</h3>
              </div>
              <div className="detail-content">
                <p>{pedido.data ? formatDate(pedido.data) : 'Data não informada'}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-header">
                <Package size={20} />
                <h3>Status</h3>
              </div>
              <div className="detail-content">
                {pedido.status ? getStatusBadge(pedido.status) : <span className="status-badge status-default">Status não informado</span>}
              </div>
            </div>
          </div>

          {pedido.observacao && (
            <div className="detail-card full-width">
              <div className="detail-header">
                <h3>Observações</h3>
              </div>
              <div className="detail-content">
                <p>{pedido.observacao}</p>
              </div>
            </div>
          )}

          <div className="detail-card full-width">
            <div className="detail-header">
              <Package size={20} />
              <h3>Produtos</h3>
            </div>
            <div className="detail-content">
              <div className="produtos-table">
                <table>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Quantidade</th>
                      <th>Valor Unitário</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.produtos && pedido.produtos.map((item, index) => (
                      <tr key={index}>
                        <td>{getProdutoNome(item.produto)}</td>
                        <td>{item.quantidade}</td>
                        <td>{formatCurrency(item.valorUnitario || 0)}</td>
                        <td>{formatCurrency(item.valorTotal || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3"><strong>Total do Pedido:</strong></td>
                      <td><strong>{formatCurrency(pedido.valorTotal || 0)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidoView;