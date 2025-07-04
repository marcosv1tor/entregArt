import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import pedidoService from '../../services/pedidoService';
import clienteService from '../../services/clienteService';
import produtoService from '../../services/produtoService';
import empresaService from '../../services/empresaService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './PedidoForm.css';

const PedidoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [pedido, setPedido] = useState(null);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      cliente: '',
      empresa: '',
      data: new Date().toISOString().split('T')[0],
      status: 'pendente',
      observacao: '',
      itens: [{ produto: '', quantidade: 1 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'itens'
  });

  const watchedItens = watch('itens');

  const statusOptions = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'confirmado', label: 'Confirmado' },
    { value: 'em_preparacao', label: 'Em Preparação' },
    { value: 'enviado', label: 'Enviado' },
    { value: 'entregue', label: 'Entregue' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar clientes, produtos e empresas
      const [clientesResponse, produtosResponse, empresasResponse] = await Promise.all([
        clienteService.getAll(),
        produtoService.getAll(),
        empresaService.getAll()
      ]);
      
      // Debug: verificar estrutura dos dados
      console.log('clientesResponse:', clientesResponse);
      console.log('produtosResponse:', produtosResponse);
      
      // Como o interceptor já retorna response.data, verificamos se há uma propriedade data
      const clientesData = clientesResponse?.clientes || clientesResponse?.data || clientesResponse;
      const produtosData = produtosResponse?.produtos || produtosResponse?.data || produtosResponse;
      const empresasData = empresasResponse?.empresas || empresasResponse?.data || empresasResponse;
      
      console.log('clientesData:', clientesData);
      console.log('produtosData:', produtosData);
      console.log('empresasData:', empresasData);
      
      setClientes(Array.isArray(clientesData) ? clientesData : []);
      setProdutos(Array.isArray(produtosData) ? produtosData : []);
      setEmpresas(Array.isArray(empresasData) ? empresasData : []);
      
      // Se estiver editando, buscar o pedido
      if (isEditing) {
        const pedidoResponse = await pedidoService.getById(id);
        // Como o interceptor já retorna response.data, não precisamos acessar .data novamente
        const pedidoData = pedidoResponse;
        console.log('Dados do pedido para edição:', pedidoData);
        setPedido(pedidoData);
        
        // Preencher o formulário com os dados do pedido
        if (pedidoData) {
          // Preencher campos básicos
          setValue('cliente', pedidoData.cliente?._id || pedidoData.cliente || '');
          setValue('empresa', pedidoData.empresa?._id || pedidoData.empresa || '');
          setValue('data', pedidoData.data ? new Date(pedidoData.data).toISOString().split('T')[0] : '');
          setValue('status', pedidoData.status || 'pendente');
          setValue('observacao', pedidoData.observacao || '');
          
          // Preencher itens (convertendo de 'produtos' para 'itens')
          if (pedidoData.produtos && Array.isArray(pedidoData.produtos) && pedidoData.produtos.length > 0) {
            const itensFormatados = pedidoData.produtos.map(item => ({
              produto: item.produto?._id || item.produto || '',
              quantidade: item.quantidade || 1
            }));
            console.log('Itens formatados:', itensFormatados);
            setValue('itens', itensFormatados);
          } else {
            // Se não há produtos, manter pelo menos um item vazio
            setValue('itens', [{ produto: '', quantidade: 1 }]);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setClientes([]);
      setProdutos([]);
      setEmpresas([]);
      // Remover alert duplicado - o interceptor já mostra o toast
      if (error.response?.status !== 401) {
        console.error('Erro detalhado:', error.response?.data || error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      
      // Validar se empresa foi selecionada
      if (!data.empresa) {
        alert('Por favor, selecione uma empresa.');
        return;
      }
      
      const pedidoData = {
        cliente: data.cliente,
        empresa: data.empresa,
        data: data.data,
        status: data.status,
        observacao: data.observacao,
        produtos: data.itens
          .filter(item => item.produto && item.quantidade > 0)
          .reduce((acc, item) => {
            const produto = getProdutoInfo(item.produto);
            const existingIndex = acc.findIndex(p => p.produto === item.produto);
            
            if (existingIndex >= 0) {
              // Se o produto já existe, soma a quantidade
              acc[existingIndex].quantidade += parseInt(item.quantidade);
              acc[existingIndex].valorTotal = acc[existingIndex].quantidade * acc[existingIndex].valorUnitario;
            } else {
              // Se é um produto novo, adiciona ao array
              acc.push({
                produto: item.produto,
                quantidade: parseInt(item.quantidade),
                valorUnitario: produto ? produto.valor : 0,
                valorTotal: produto ? produto.valor * parseInt(item.quantidade) : 0
              });
            }
            
            return acc;
          }, [])
      };

      console.log('Dados sendo enviados para atualização:', pedidoData);
      console.log('Status sendo enviado:', data.status);

      if (isEditing) {
        const response = await pedidoService.update(id, pedidoData);
        console.log('Resposta da atualização:', response);
        alert('Pedido atualizado com sucesso!');
      } else {
        await pedidoService.create(pedidoData);
        alert('Pedido criado com sucesso!');
      }

      navigate('/pedidos');
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      
      // Extrair mensagem de erro específica do backend
      let errorMessage = 'Erro ao salvar pedido. Tente novamente.';
      
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors && error.response.data.errors.length > 0) {
          errorMessage = error.response.data.errors.map(err => err.msg || err.message).join(', ');
        }
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const addItem = () => {
    append({ produto: '', quantidade: 1 });
  };

  const removeItem = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const getProdutoInfo = (produtoId) => {
    return produtos.find(p => (p._id || p.id) === produtoId);
  };

  const calculateItemTotal = (item) => {
    const produto = getProdutoInfo(item.produto);
    if (produto && item.quantidade) {
      return produto.valor * item.quantidade;
    }
    return 0;
  };

  const calculateTotal = () => {
    return watchedItens.reduce((total, item) => {
      return total + calculateItemTotal(item);
    }, 0);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return <LoadingSpinner message={isEditing ? 'Carregando pedido...' : 'Carregando dados...'} />;
  }

  return (
    <div className="pedido-form-page">
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
              {isEditing ? 'Editar Pedido' : 'Novo Pedido'}
            </h1>
            <p className="page-subtitle">
              {isEditing ? 'Modifique as informações do pedido' : 'Preencha as informações do novo pedido'}
            </p>
          </div>
        </div>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit(onSubmit)} className="pedido-form">
          <div className="form-section">
            <h3 className="section-title">Informações Gerais</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Empresa *</label>
                <select
                  className={`form-input ${errors.empresa ? 'error' : ''}`}
                  {...register('empresa', { required: 'Empresa é obrigatória' })}
                >
                  <option value="">Selecione uma empresa</option>
                  {Array.isArray(empresas) && empresas.map((empresa) => (
                    <option key={empresa._id || empresa.id} value={empresa._id || empresa.id}>
                      {empresa.nomeFantasia || empresa.razaoSocial}
                    </option>
                  ))}
                </select>
                {errors.empresa && <span className="error-message">{errors.empresa.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Cliente *</label>
                <select
                  className={`form-input ${errors.cliente ? 'error' : ''}`}
                  {...register('cliente', { required: 'Cliente é obrigatório' })}
                >
                  <option value="">Selecione um cliente</option>
                  {Array.isArray(clientes) && clientes.map((cliente) => (
                    <option key={cliente._id || cliente.id} value={cliente._id || cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
                {errors.cliente && <span className="error-message">{errors.cliente.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Data *</label>
                <input
                  type="date"
                  className={`form-input ${errors.data ? 'error' : ''}`}
                  {...register('data', { required: 'Data é obrigatória' })}
                />
                {errors.data && <span className="error-message">{errors.data.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Status *</label>
                <select
                  className={`form-input ${errors.status ? 'error' : ''}`}
                  {...register('status', { required: 'Status é obrigatório' })}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.status && <span className="error-message">{errors.status.message}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Observações</label>
              <textarea
                className="form-input"
                rows="3"
                placeholder="Observações sobre o pedido..."
                {...register('observacao')}
              />
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">Itens do Pedido</h3>
              <button
                type="button"
                className="btn btn-outline"
                onClick={addItem}
              >
                <Plus size={16} />
                Adicionar Item
              </button>
            </div>

            <div className="itens-list">
              {fields.map((field, index) => {
                const item = watchedItens[index] || {};
                const produto = getProdutoInfo(item.produto);
                const itemTotal = calculateItemTotal(item);

                return (
                  <div key={field.id} className="item-row">
                    <div className="item-fields">
                      <div className="form-group">
                        <label className="form-label">Produto *</label>
                        <select
                          className={`form-input ${errors.itens?.[index]?.produto ? 'error' : ''}`}
                          {...register(`itens.${index}.produto`, { required: 'Produto é obrigatório' })}
                        >
                          <option value="">Selecione um produto</option>
                          {Array.isArray(produtos) && produtos.map((produto) => (
                            <option key={produto._id || produto.id} value={produto._id || produto.id}>
                              {produto.nome} - {formatCurrency(produto.valor)}
                            </option>
                          ))}
                        </select>
                        {errors.itens?.[index]?.produto && (
                          <span className="error-message">{errors.itens[index].produto.message}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Quantidade *</label>
                        <input
                          type="number"
                          min="1"
                          className={`form-input ${errors.itens?.[index]?.quantidade ? 'error' : ''}`}
                          {...register(`itens.${index}.quantidade`, { 
                            required: 'Quantidade é obrigatória',
                            min: { value: 1, message: 'Quantidade deve ser maior que zero' }
                          })}
                        />
                        {errors.itens?.[index]?.quantidade && (
                          <span className="error-message">{errors.itens[index].quantidade.message}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Valor Unitário</label>
                        <input
                          type="text"
                          className="form-input"
                          value={produto ? formatCurrency(produto.valor) : 'R$ 0,00'}
                          readOnly
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Total</label>
                        <input
                          type="text"
                          className="form-input item-total"
                          value={formatCurrency(itemTotal)}
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="item-actions">
                      <button
                        type="button"
                        className="btn-icon btn-icon-danger"
                        onClick={() => removeItem(index)}
                        disabled={fields.length === 1}
                        title="Remover item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="total-section">
              <div className="total-row">
                <span className="total-label">Total do Pedido:</span>
                <span className="total-value">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/pedidos')}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Salvando...' : (isEditing ? 'Atualizar Pedido' : 'Criar Pedido')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PedidoForm;