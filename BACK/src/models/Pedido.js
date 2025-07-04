const mongoose = require('mongoose');

const pedidoProdutoSchema = new mongoose.Schema({
  produto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produto',
    required: [true, 'Produto é obrigatório']
  },
  quantidade: {
    type: Number,
    required: [true, 'Quantidade é obrigatória'],
    min: [1, 'Quantidade deve ser maior que zero']
  },
  valorUnitario: {
    type: Number,
    required: [true, 'Valor unitário é obrigatório'],
    min: [0, 'Valor unitário deve ser maior que zero']
  },
  valorTotal: {
    type: Number,
    required: [true, 'Valor total é obrigatório'],
    min: [0, 'Valor total deve ser maior que zero']
  }
}, { _id: false });

const pedidoSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: [true, 'Número do pedido é obrigatório'],
    unique: true,
    trim: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: [true, 'Cliente é obrigatório']
  },
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa',
    required: [true, 'Empresa é obrigatória']
  },
  observacao: {
    type: String,
    trim: true,
    maxlength: [500, 'Observação deve ter no máximo 500 caracteres']
  },
  data: {
    type: Date,
    required: [true, 'Data é obrigatória'],
    default: Date.now
  },
  produtos: [pedidoProdutoSchema],
  valorTotal: {
    type: Number,
    required: [true, 'Valor total é obrigatório'],
    min: [0, 'Valor total deve ser maior que zero'],
    default: 0
  },
  status: {
    type: String,
    enum: ['pendente', 'confirmado', 'em_preparacao', 'enviado', 'entregue', 'cancelado'],
    default: 'pendente'
  }
}, {
  timestamps: true
});

// Índices para melhor performance
pedidoSchema.index({ numero: 1 });
pedidoSchema.index({ cliente: 1 });
pedidoSchema.index({ empresa: 1 });
pedidoSchema.index({ data: -1 });
pedidoSchema.index({ status: 1 });

// Middleware para calcular valor total antes de salvar
pedidoSchema.pre('save', function(next) {
  if (this.produtos && this.produtos.length > 0) {
    this.valorTotal = this.produtos.reduce((total, item) => {
      item.valorTotal = item.quantidade * item.valorUnitario;
      return total + item.valorTotal;
    }, 0);
  }
  next();
});

// Middleware para popular referências automaticamente
pedidoSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'cliente',
    select: 'nome email telefone'
  }).populate({
    path: 'empresa',
    select: 'nomeFantasia razaoSocial'
  }).populate({
    path: 'produtos.produto',
    select: 'nome valor descricao'
  });
  next();
});

// Método para gerar número do pedido automaticamente
pedidoSchema.statics.generatePedidoNumber = async function() {
  const count = await this.countDocuments();
  const year = new Date().getFullYear();
  return `PED${year}${String(count + 1).padStart(6, '0')}`;
};

module.exports = mongoose.model('Pedido', pedidoSchema);