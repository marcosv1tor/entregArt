const mongoose = require('mongoose');

const produtoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome deve ter no máximo 100 caracteres']
  },
  valor: {
    type: Number,
    required: [true, 'Valor é obrigatório'],
    min: [0, 'Valor deve ser maior que zero'],
    set: function(val) {
      return Math.round(val * 100) / 100; // Arredonda para 2 casas decimais
    }
  },
  descricao: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição deve ter no máximo 500 caracteres']
  },
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa',
    required: [true, 'Empresa é obrigatória']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.valor = parseFloat(ret.valor.toFixed(2));
      return ret;
    }
  }
});

// Índices para melhor performance
produtoSchema.index({ empresa: 1 });
produtoSchema.index({ nome: 'text', descricao: 'text' });
produtoSchema.index({ valor: 1 });

// Middleware para popular empresa automaticamente
produtoSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'empresa',
    select: 'nomeFantasia razaoSocial'
  });
  next();
});

module.exports = mongoose.model('Produto', produtoSchema);