const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome deve ter no máximo 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  telefone: {
    type: String,
    required: [true, 'Telefone é obrigatório'],
    trim: true,
    match: [/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX']
  },
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa',
    required: [true, 'Empresa é obrigatória']
  }
}, {
  timestamps: true
});

// Índices para melhor performance
clienteSchema.index({ email: 1, empresa: 1 }, { unique: true });
clienteSchema.index({ empresa: 1 });
clienteSchema.index({ nome: 'text', email: 'text' });

// Middleware para popular empresa automaticamente
clienteSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'empresa',
    select: 'nomeFantasia razaoSocial cnpj'
  });
  next();
});

module.exports = mongoose.model('Cliente', clienteSchema);