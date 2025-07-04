const mongoose = require('mongoose');

const empresaSchema = new mongoose.Schema({
  nomeFantasia: {
    type: String,
    required: [true, 'Nome fantasia é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome fantasia deve ter no máximo 100 caracteres']
  },
  razaoSocial: {
    type: String,
    required: [true, 'Razão social é obrigatória'],
    trim: true,
    maxlength: [150, 'Razão social deve ter no máximo 150 caracteres']
  },
  cnpj: {
    type: String,
    required: [true, 'CNPJ é obrigatório'],
    unique: true,
    trim: true,
    match: [/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX']
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário é obrigatório']
  }
}, {
  timestamps: true
});

// Índices para melhor performance
empresaSchema.index({ cnpj: 1 });
empresaSchema.index({ usuario: 1 });
empresaSchema.index({ nomeFantasia: 'text', razaoSocial: 'text' });

// Middleware para popular usuário automaticamente
empresaSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'usuario',
    select: 'nome email'
  });
  next();
});

module.exports = mongoose.model('Empresa', empresaSchema);