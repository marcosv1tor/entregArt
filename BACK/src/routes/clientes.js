const express = require('express');
const { body, validationResult } = require('express-validator');
const Cliente = require('../models/Cliente');
const Empresa = require('../models/Empresa');
const auth = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(auth);

// Validações
const clienteValidation = [
  body('nome')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('telefone')
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
    .withMessage('Telefone deve estar no formato (XX) XXXXX-XXXX'),
  body('empresa')
    .isMongoId()
    .withMessage('ID da empresa inválido')
];

// Listar clientes das empresas do usuário
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, empresa } = req.query;
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
        { email: { $regex: search, $options: 'i' } },
        { telefone: { $regex: search, $options: 'i' } }
      ];
    }

    const clientes = await Cliente.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Cliente.countDocuments(query);

    res.json({
      clientes,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Buscar cliente por ID
router.get('/:id', async (req, res) => {
  try {
    // Buscar empresas do usuário
    const empresasDoUsuario = await Empresa.find({ usuario: req.user._id }).select('_id');
    const empresaIds = empresasDoUsuario.map(emp => emp._id);

    const cliente = await Cliente.findOne({ 
      _id: req.params.id,
      empresa: { $in: empresaIds }
    });
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    res.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Criar novo cliente
router.post('/', clienteValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const { nome, email, telefone, empresa } = req.body;

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

    // Verificar se email já existe na empresa
    const existingCliente = await Cliente.findOne({ email, empresa });
    if (existingCliente) {
      return res.status(400).json({ 
        message: 'Cliente já cadastrado com este email nesta empresa' 
      });
    }

    const cliente = new Cliente({
      nome,
      email,
      telefone,
      empresa
    });

    await cliente.save();

    res.status(201).json({
      message: 'Cliente criado com sucesso',
      cliente
    });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Cliente já cadastrado com este email nesta empresa' 
      });
    }
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Atualizar cliente
router.put('/:id', clienteValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const { nome, email, telefone, empresa } = req.body;
    const clienteId = req.params.id;

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

    // Buscar empresas do usuário para verificar acesso ao cliente
    const empresasDoUsuario = await Empresa.find({ usuario: req.user._id }).select('_id');
    const empresaIds = empresasDoUsuario.map(emp => emp._id);

    // Verificar se email já existe na empresa (se foi alterado)
    const existingCliente = await Cliente.findOne({ 
      email, 
      empresa,
      _id: { $ne: clienteId } 
    });
    if (existingCliente) {
      return res.status(400).json({ 
        message: 'Email já cadastrado por outro cliente nesta empresa' 
      });
    }

    const cliente = await Cliente.findOneAndUpdate(
      { 
        _id: clienteId, 
        empresa: { $in: empresaIds }
      },
      { nome, email, telefone, empresa },
      { new: true, runValidators: true }
    );

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    res.json({
      message: 'Cliente atualizado com sucesso',
      cliente
    });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Email já cadastrado por outro cliente nesta empresa' 
      });
    }
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Deletar cliente
router.delete('/:id', async (req, res) => {
  try {
    // Buscar empresas do usuário
    const empresasDoUsuario = await Empresa.find({ usuario: req.user._id }).select('_id');
    const empresaIds = empresasDoUsuario.map(emp => emp._id);

    const cliente = await Cliente.findOneAndDelete({ 
      _id: req.params.id,
      empresa: { $in: empresaIds }
    });

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    res.json({ message: 'Cliente deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
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