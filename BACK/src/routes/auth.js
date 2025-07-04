const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Validações
const registerValidation = [
  body('nome')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('senha')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter no mínimo 6 caracteres')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('senha')
    .notEmpty()
    .withMessage('Senha é obrigatória')
];

// Registro de usuário
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const { nome, email, senha } = req.body;

    // Verificar se usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Usuário já existe com este email' 
      });
    }

    // Criar novo usuário
    const user = new User({ nome, email, senha });
    await user.save();

    // Gerar token
    const token = user.generateAuthToken();

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Login de usuário
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const { email, senha } = req.body;

    // Buscar usuário
    const user = await User.findOne({ email }).select('+senha');
    if (!user) {
      return res.status(401).json({ 
        message: 'Credenciais inválidas' 
      });
    }

    // Verificar senha
    const isPasswordValid = await user.comparePassword(senha);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Credenciais inválidas' 
      });
    }

    // Gerar token
    const token = user.generateAuthToken();

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Verificar token
router.get('/verify', auth, async (req, res) => {
  try {
    res.json({
      message: 'Token válido',
      user: {
        id: req.user._id,
        nome: req.user.nome,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('Erro na verificação:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Logout (invalidar token no frontend)
router.post('/logout', auth, async (req, res) => {
  try {
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

module.exports = router;