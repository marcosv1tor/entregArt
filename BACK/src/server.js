const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const empresaRoutes = require('./routes/empresas');
const clienteRoutes = require('./routes/clientes');
const produtoRoutes = require('./routes/produtos');
const pedidoRoutes = require('./routes/pedidos');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexão com MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/entregart', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Conectado ao MongoDB');
})
.catch((error) => {
  console.error('❌ Erro ao conectar ao MongoDB:', error);
  process.exit(1);
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/pedidos', pedidoRoutes);

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'EntregArt - Hub de vendas API está funcionando!', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado!'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});

module.exports = app;