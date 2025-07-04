const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(auth);

// Validações
const updateUserValidation = [
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido')
];

// Listar todos os usuários
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { nome: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('-senha')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Buscar usuário por ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-senha');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Atualizar perfil do usuário logado
router.put('/profile', updateUserValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const { nome, email } = req.body;
    const userId = req.user._id;

    // Verificar se email já existe (se foi alterado)
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Email já está em uso por outro usuário' 
        });
      }
    }

    const updateData = {};
    if (nome) updateData.nome = nome;
    if (email) updateData.email = email;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-senha');

    res.json({
      message: 'Perfil atualizado com sucesso',
      user
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Atualizar senha do usuário logado
router.put('/password', [
  body('senhaAtual')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
  body('novaSenha')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter no mínimo 6 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const { senhaAtual, novaSenha } = req.body;
    const userId = req.user._id;

    // Buscar usuário com senha
    const user = await User.findById(userId).select('+senha');
    
    // Verificar senha atual
    const isPasswordValid = await user.comparePassword(senhaAtual);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        message: 'Senha atual incorreta' 
      });
    }

    // Atualizar senha
    user.senha = novaSenha;
    await user.save();

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Deletar conta do usuário logado
router.delete('/profile', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Conta deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar conta:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

module.exports = router;