const express = require('express');
const { body, validationResult } = require('express-validator');
const Pedido = require('../models/Pedido');
const Cliente = require('../models/Cliente');
const Produto = require('../models/Produto');
const Empresa = require('../models/Empresa');
const auth = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(auth);

// Validações
const pedidoValidation = [
  body('cliente')
    .isMongoId()
    .withMessage('ID do cliente inválido'),
  body('empresa')
    .isMongoId()
    .withMessage('ID da empresa inválido'),
  body('observacao')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Observação deve ter no máximo 500 caracteres'),
  body('data')
    .optional()
    .isISO8601()
    .withMessage('Data inválida'),
  body('produtos')
    .isArray({ min: 1 })
    .withMessage('Deve haver pelo menos um produto'),
  body('produtos.*.produto')
    .isMongoId()
    .withMessage('ID do produto inválido'),
  body('produtos.*.quantidade')
    .isInt({ min: 1 })
    .withMessage('Quantidade deve ser maior que zero')
];

// Listar pedidos das empresas do usuário
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, empresa, status, dataInicio, dataFim } = req.query;
    const skip = (page - 1) * limit;

    // Buscar empresas do usuário
    const empresasDoUsuario = await Empresa.find({ usuario: req.user._id }).select('_id');
    const empresaIds = empresasDoUsuario.map(emp => emp._id);

    let query = { empresa: { $in: empresaIds } };
    
    // Filtrar por empresa específica se fornecida
    if (empresa) {
      if (!empresaIds.some(id => id.toString() === empresa)) {
        return res.status(403).json({ message: 'Acesso negado a esta empresa' });
      }
      query.empresa = empresa;
    }

    // Filtrar por status
    if (status) {
      query.status = status;
    }

    // Filtrar por período
    if (dataInicio || dataFim) {
      query.data = {};
      if (dataInicio) query.data.$gte = new Date(dataInicio);
      if (dataFim) query.data.$lte = new Date(dataFim);
    }

    // Filtrar por busca (número do pedido ou nome do cliente)
    if (search) {
      const clientes = await Cliente.find({
        nome: { $regex: search, $options: 'i' },
        empresa: { $in: empresaIds }
      }).select('_id');
      const clienteIds = clientes.map(c => c._id);

      query.$or = [
        { numero: { $regex: search, $options: 'i' } },
        { cliente: { $in: clienteIds } }
      ];
    }

    const pedidos = await Pedido.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Pedido.countDocuments(query);

    res.json({
      pedidos,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Buscar pedido por ID
router.get('/:id', async (req, res) => {
  try {
    // Buscar empresas do usuário
    const empresasDoUsuario = await Empresa.find({ usuario: req.user._id }).select('_id');
    const empresaIds = empresasDoUsuario.map(emp => emp._id);

    const pedido = await Pedido.findOne({ 
      _id: req.params.id,
      empresa: { $in: empresaIds }
    });
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    res.json(pedido);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Criar novo pedido
router.post('/', pedidoValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const { cliente, empresa, observacao, data, produtos } = req.body;

    // Verificar se a empresa pertence ao usuário
    const empresaDoUsuario = await Empresa.findOne({ 
      _id: empresa, 
      usuario: req.user._id 
    });
    if (!empresaDoUsuario) {
      return res.status(403).json({ 
        message: 'Acesso negado a esta empresa' 
      });
    }

    // Verificar se o cliente pertence à empresa
    const clienteDaEmpresa = await Cliente.findOne({ 
      _id: cliente, 
      empresa: empresa 
    });
    if (!clienteDaEmpresa) {
      return res.status(400).json({ 
        message: 'Cliente não pertence a esta empresa' 
      });
    }

    // Verificar e buscar produtos
    const produtoIds = produtos.map(p => p.produto);
    const produtosDaEmpresa = await Produto.find({ 
      _id: { $in: produtoIds }, 
      empresa: empresa 
    });

    if (produtosDaEmpresa.length !== produtoIds.length) {
      return res.status(400).json({ 
        message: 'Um ou mais produtos não pertencem a esta empresa' 
      });
    }

    // Preparar produtos com valores
    const produtosPedido = produtos.map(item => {
      const produto = produtosDaEmpresa.find(p => p._id.toString() === item.produto);
      return {
        produto: item.produto,
        quantidade: item.quantidade,
        valorUnitario: produto.valor,
        valorTotal: item.quantidade * produto.valor
      };
    });

    // Gerar número do pedido
    const numero = await Pedido.generatePedidoNumber();

    const pedido = new Pedido({
      numero,
      cliente,
      empresa,
      observacao,
      data: data ? new Date(data) : new Date(),
      produtos: produtosPedido
    });

    await pedido.save();

    res.status(201).json({
      message: 'Pedido criado com sucesso',
      pedido
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Atualizar pedido
router.put('/:id', pedidoValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const { cliente, empresa, observacao, data, produtos } = req.body;
    const pedidoId = req.params.id;

    // Buscar empresas do usuário
    const empresasDoUsuario = await Empresa.find({ usuario: req.user._id }).select('_id');
    const empresaIds = empresasDoUsuario.map(emp => emp._id);

    // Verificar se a empresa pertence ao usuário
    const empresaDoUsuario = await Empresa.findOne({ 
      _id: empresa, 
      usuario: req.user._id 
    });
    if (!empresaDoUsuario) {
      return res.status(403).json({ 
        message: 'Acesso negado a esta empresa' 
      });
    }

    // Verificar se o cliente pertence à empresa
    const clienteDaEmpresa = await Cliente.findOne({ 
      _id: cliente, 
      empresa: empresa 
    });
    if (!clienteDaEmpresa) {
      return res.status(400).json({ 
        message: 'Cliente não pertence a esta empresa' 
      });
    }

    // Verificar e buscar produtos
    const produtoIds = produtos.map(p => p.produto);
    const produtosDaEmpresa = await Produto.find({ 
      _id: { $in: produtoIds }, 
      empresa: empresa 
    });

    if (produtosDaEmpresa.length !== produtoIds.length) {
      return res.status(400).json({ 
        message: 'Um ou mais produtos não pertencem a esta empresa' 
      });
    }

    // Preparar produtos com valores
    const produtosPedido = produtos.map(item => {
      const produto = produtosDaEmpresa.find(p => p._id.toString() === item.produto);
      return {
        produto: item.produto,
        quantidade: item.quantidade,
        valorUnitario: produto.valor,
        valorTotal: item.quantidade * produto.valor
      };
    });

    const pedido = await Pedido.findOneAndUpdate(
      { 
        _id: pedidoId, 
        empresa: { $in: empresaIds }
      },
      { 
        cliente,
        empresa,
        observacao,
        data: data ? new Date(data) : undefined,
        status: req.body.status,
        produtos: produtosPedido
      },
      { new: true, runValidators: true }
    );

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    res.json({
      message: 'Pedido atualizado com sucesso',
      pedido
    });
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Atualizar status do pedido
router.patch('/:id/status', [
  body('status')
    .isIn(['pendente', 'confirmado', 'em_preparacao', 'enviado', 'entregue', 'cancelado'])
    .withMessage('Status inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const { status } = req.body;
    const pedidoId = req.params.id;

    // Buscar empresas do usuário
    const empresasDoUsuario = await Empresa.find({ usuario: req.user._id }).select('_id');
    const empresaIds = empresasDoUsuario.map(emp => emp._id);

    const pedido = await Pedido.findOneAndUpdate(
      { 
        _id: pedidoId, 
        empresa: { $in: empresaIds }
      },
      { status },
      { new: true, runValidators: true }
    );

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    res.json({
      message: 'Status do pedido atualizado com sucesso',
      pedido
    });
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Deletar pedido
router.delete('/:id', async (req, res) => {
  try {
    // Buscar empresas do usuário
    const empresasDoUsuario = await Empresa.find({ usuario: req.user._id }).select('_id');
    const empresaIds = empresasDoUsuario.map(emp => emp._id);

    const pedido = await Pedido.findOneAndDelete({ 
      _id: req.params.id,
      empresa: { $in: empresaIds }
    });

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    res.json({ message: 'Pedido deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Relatório de pedidos
router.get('/relatorio/vendas', async (req, res) => {
  try {
    const { empresa, dataInicio, dataFim } = req.query;

    // Buscar empresas do usuário
    const empresasDoUsuario = await Empresa.find({ usuario: req.user._id }).select('_id');
    const empresaIds = empresasDoUsuario.map(emp => emp._id);

    let query = { empresa: { $in: empresaIds } };
    
    if (empresa) {
      if (!empresaIds.some(id => id.toString() === empresa)) {
        return res.status(403).json({ message: 'Acesso negado a esta empresa' });
      }
      query.empresa = empresa;
    }

    if (dataInicio || dataFim) {
      query.data = {};
      if (dataInicio) query.data.$gte = new Date(dataInicio);
      if (dataFim) query.data.$lte = new Date(dataFim);
    }

    const relatorio = await Pedido.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalPedidos: { $sum: 1 },
          valorTotal: { $sum: '$valorTotal' },
          valorMedio: { $avg: '$valorTotal' },
          statusCount: {
            $push: '$status'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalPedidos: 1,
          valorTotal: { $round: ['$valorTotal', 2] },
          valorMedio: { $round: ['$valorMedio', 2] },
          statusCount: 1
        }
      }
    ]);

    const statusCount = {};
    if (relatorio.length > 0) {
      relatorio[0].statusCount.forEach(status => {
        statusCount[status] = (statusCount[status] || 0) + 1;
      });
      relatorio[0].statusCount = statusCount;
    }

    res.json(relatorio[0] || {
      totalPedidos: 0,
      valorTotal: 0,
      valorMedio: 0,
      statusCount: {}
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

module.exports = router;