import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Plus
} from 'lucide-react';
import empresaService from '../../services/empresaService';
import clienteService from '../../services/clienteService';
import produtoService from '../../services/produtoService';
import pedidoService from '../../services/pedidoService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    empresas: 0,
    clientes: 0,
    produtos: 0,
    pedidos: 0,
    vendas: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas
      const [empresasRes, clientesRes, produtosRes, pedidosRes] = await Promise.all([
        empresaService.getAll({ limit: 1 }),
        clienteService.getAll({ limit: 1 }),
        produtoService.getAll({ limit: 1 }),
        pedidoService.getAll({ limit: 5, sort: '-data' })
      ]);

      console.log('Dashboard - Respostas das APIs:', {
        empresas: empresasRes,
        clientes: clientesRes,
        produtos: produtosRes,
        pedidos: pedidosRes
      });

      // Calcular total de vendas dos pedidos recentes
      const totalVendas = pedidosRes.data?.pedidos?.reduce((total, pedido) => {
        return total + (pedido.valorTotal || 0);
      }, 0) || 0;

      setStats({
        empresas: empresasRes.pagination?.total || 0,
        clientes: clientesRes.pagination?.total || 0,
        produtos: produtosRes.pagination?.total || 0,
        pedidos: pedidosRes.pagination?.total || 0,
        vendas: totalVendas
      });

      setRecentOrders(pedidosRes.pedidos || []);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pendente': { label: 'Pendente', class: 'badge-warning' },
      'confirmado': { label: 'Confirmado', class: 'badge-info' },
      'em_preparacao': { label: 'Em Preparação', class: 'badge-primary' },
      'enviado': { label: 'Enviado', class: 'badge-secondary' },
      'entregue': { label: 'Entregue', class: 'badge-success' },
      'cancelado': { label: 'Cancelado', class: 'badge-danger' }
    };
    
    const statusInfo = statusMap[status] || { label: status, class: 'badge-secondary' };
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  if (loading) {
    return <LoadingSpinner message="Carregando dashboard..." />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">Visão geral do seu negócio</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="stats-grid">
        <div className="stat-card dashboard-card">
          <div className="stat-icon">
            <Building2 size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.empresas}</h3>
            <p className="stat-label">Empresas</p>
          </div>
          <Link to="/empresas" className="stat-link">
            <Plus size={16} />
          </Link>
        </div>

        <div className="stat-card dashboard-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.clientes}</h3>
            <p className="stat-label">Clientes</p>
          </div>
          <Link to="/clientes" className="stat-link">
            <Plus size={16} />
          </Link>
        </div>

        <div className="stat-card dashboard-card">
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.produtos}</h3>
            <p className="stat-label">Produtos</p>
          </div>
          <Link to="/produtos" className="stat-link">
            <Plus size={16} />
          </Link>
        </div>

        <div className="stat-card dashboard-card">
          <div className="stat-icon">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.pedidos}</h3>
            <p className="stat-label">Pedidos</p>
          </div>
          <Link to="/pedidos" className="stat-link">
            <Plus size={16} />
          </Link>
        </div>

        <div className="stat-card stat-card-highlight dashboard-card">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{formatCurrency(stats.vendas)}</h3>
            <p className="stat-label">Vendas Recentes</p>
          </div>
          <div className="stat-trend">
            <TrendingUp size={16} />
          </div>
        </div>
      </div>

      {/* Pedidos recentes */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Pedidos Recentes</h2>
          <Link to="/pedidos" className="btn btn-outline btn-sm">
            Ver todos
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="recent-orders table-container">
            <div className="table-header">
              <h3 className="table-title">Últimos Pedidos</h3>
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Data</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((pedido) => (
                    <tr key={pedido._id}>
                      <td className="font-medium">#{pedido.numero}</td>
                      <td>{pedido.cliente?.nome}</td>
                      <td>{formatDate(pedido.data)}</td>
                      <td className="font-medium">{formatCurrency(pedido.valorTotal)}</td>
                      <td>{getStatusBadge(pedido.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <ShoppingCart size={48} />
            <h3>Nenhum pedido encontrado</h3>
            <p>Comece criando seu primeiro pedido</p>
            <Link to="/pedidos/novo" className="btn btn-primary">
              <Plus size={20} />
              Novo Pedido
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;