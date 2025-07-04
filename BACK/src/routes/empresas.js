const express = require('express');
const { body, validationResult } = require('express-validator');
const Empresa = require('../models/Empresa');
const auth = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(auth);

// Validações
const empresaValidation = [
  body('nomeFantasia')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome fantasia deve ter entre 2 e 100 caracteres'),
  body('razaoSocial')
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Razão social deve ter entre 2 e 150 caracteres'),
  body('cnpj')
    .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
    .withMessage('CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX')
];

// Listar empresas do usuário
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    let query = { usuario: req.user._id };
    if (search) {
      query.$or = [
        { nomeFantasia: { $regex: search, $options: 'i' } },
        { razaoSocial: { $regex: search, $options: 'i' } },
        { cnpj: { $regex: search, $options: 'i' } }
      ];
    }

    const empresas = await Empresa.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Empresa.countDocuments(query);

    res.json({
      empresas,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Buscar empresa por ID
router.get('/:id', async (req, res) => {
  try {
    const empresa = await Empresa.findOne({ 
      _id: req.params.id, 
      usuario: req.user._id 
    });
    
    if (!empresa) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    res.json(empresa);
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Criar nova empresa
router.post('/', empresaValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const { nomeFantasia, razaoSocial, cnpj } = req.body;

    // Verificar se CNPJ já existe
    const existingEmpresa = await Empresa.findOne({ cnpj });
    if (existingEmpresa) {
      return res.status(400).json({ 
        message: 'CNPJ já cadastrado' 
      });
    }

    const empresa = new Empresa({
      nomeFantasia,
      razaoSocial,
      cnpj,
      usuario: req.user._id
    });

    await empresa.save();

    res.status(201).json({
      message: 'Empresa criada com sucesso',
      empresa
    });
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'CNPJ já cadastrado' });
    }
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Atualizar empresa
router.put('/:id', empresaValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const { nomeFantasia, razaoSocial, cnpj } = req.body;
    const empresaId = req.params.id;

    // Verificar se CNPJ já existe (se foi alterado)
    const existingEmpresa = await Empresa.findOne({ 
      cnpj, 
      _id: { $ne: empresaId } 
    });
    if (existingEmpresa) {
      return res.status(400).json({ 
        message: 'CNPJ já cadastrado por outra empresa' 
      });
    }

    const empresa = await Empresa.findOneAndUpdate(
      { _id: empresaId, usuario: req.user._id },
      { nomeFantasia, razaoSocial, cnpj },
      { new: true, runValidators: true }
    );

    if (!empresa) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    res.json({
      message: 'Empresa atualizada com sucesso',
      empresa
    });
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'CNPJ já cadastrado' });
    }
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Deletar empresa
router.delete('/:id', async (req, res) => {
  try {
    const empresa = await Empresa.findOneAndDelete({ 
      _id: req.params.id, 
      usuario: req.user._id 
    });

    if (!empresa) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    res.json({ message: 'Empresa deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar empresa:', error);
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