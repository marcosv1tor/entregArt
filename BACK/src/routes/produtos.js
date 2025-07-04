const express = require('express');
const { body, validationResult } = require('express-validator');
const Produto = require('../models/Produto');
const Empresa = require('../models/Empresa');
const auth = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(auth);

// Validações
const produtoValidation = [
  body('nome')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('valor')
    .isFloat({ min: 0.01 })
    .withMessage('Valor deve ser maior que zero'),
  body('descricao')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres'),
  body('empresa')
    .isMongoId()
    .withMessage('ID da empresa inválido')
];

// Listar produtos das empresas do usuário
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, empresa, minValor, maxValor } = req.query;
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

    // Filtrar por busca
    if (search) {
      query.$or = [
        { nome: { $regex: search, $options: 'i' } },
        { descricao: { $regex: search, $options: 'i' } }
      ];
    }

    // Filtrar por faixa de valor
    if (minValor || maxValor) {
      query.valor = {};
      if (minValor) query.valor.$gte = parseFloat(minValor);
      if (maxValor) query.valor.$lte = parseFloat(maxValor);
    }

    const produtos = await Produto.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Produto.countDocuments(query);

    res.json({
      produtos,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Buscar produto por ID
router.get('/:id', async (req, res) => {
  try {
    // Buscar empresas do usuário
    const empresasDoUsuario = await Empresa.find({ usuario: req.user._id }).select('_id');
    const empresaIds = empresasDoUsuario.map(emp => emp._id);

    const produto = await Produto.findOne({ 
      _id: req.params.id,
      empresa: { $in: empresaIds }
    });
    
    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.json(produto);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Criar novo produto
router.post('/', produtoValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const { nome, valor, descricao, empresa } = req.body;

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

    const produto = new Produto({
      nome,
      valor: parseFloat(valor),
      descricao,
      empresa
    });

    await produto.save();

    res.status(201).json({
      message: 'Produto criado com sucesso',
      produto
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Atualizar produto
router.put('/:id', produtoValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const { nome, valor, descricao, empresa } = req.body;
    const produtoId = req.params.id;

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

    // Buscar empresas do usuário para verificar acesso ao produto
    const empresasDoUsuario = await Empresa.find({ usuario: req.user._id }).select('_id');
    const empresaIds = empresasDoUsuario.map(emp => emp._id);

    const produto = await Produto.findOneAndUpdate(
      { 
        _id: produtoId, 
        empresa: { $in: empresaIds }
      },
      { 
        nome, 
        valor: parseFloat(valor), 
        descricao, 
        empresa 
      },
      { new: true, runValidators: true }
    );

    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.json({
      message: 'Produto atualizado com sucesso',
      produto
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Deletar produto
router.delete('/:id', async (req, res) => {
  try {
    // Buscar empresas do usuário
    const empresasDoUsuario = await Empresa.find({ usuario: req.user._id }).select('_id');
    const empresaIds = empresasDoUsuario.map(emp => emp._id);

    const produto = await Produto.findOneAndDelete({ 
      _id: req.params.id,
      empresa: { $in: empresaIds }
    });

    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Buscar produtos por empresa (para uso em pedidos)
router.get('/empresa/:empresaId', async (req, res) => {
  try {
    const { empresaId } = req.params;
    
    // Verificar se a empresa pertence ao usuário
    const empresaDoUsuario = await Empresa.findOne({ 
      _id: empresaId, 
      usuario: req.user._id 
    });
    if (!empresaDoUsuario) {
      return res.status(403).json({ 
        message: 'Acesso negado a esta empresa' 
      });
    }

    const produtos = await Produto.find({ empresa: empresaId })
      .select('nome valor descricao')
      .sort({ nome: 1 });

    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos da empresa:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

module.exports = router;