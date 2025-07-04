# EntregArt - Hub de vendas Backend

Backend da aplicação de gestão de comércio EntregArt - Hub de vendas desenvolvido em Node.js com Express e MongoDB.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **Docker** - Containerização

## 📋 Pré-requisitos

- Node.js 18+ 
- MongoDB 6.0+
- Docker e Docker Compose (opcional)

## 🔧 Instalação

### Método 1: Instalação Local

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd EntregArt/BACK
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/entregart
JWT_SECRET=ENTREGART
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3001
```

4. **Inicie o MongoDB**
```bash
# No Windows
net start MongoDB

# No Linux/Mac
sudo systemctl start mongod
```

5. **Execute a aplicação**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

### Método 2: Docker

1. **Execute com Docker Compose**
```bash
docker-compose up -d
```

2. **Verifique os containers**
```bash
docker-compose ps
```

3. **Visualize os logs**
```bash
docker-compose logs -f app
```

## 📚 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verificar token
- `POST /api/auth/logout` - Logout

### Usuários
- `GET /api/users` - Listar usuários
- `GET /api/users/:id` - Buscar usuário
- `PUT /api/users/profile` - Atualizar perfil
- `PUT /api/users/password` - Alterar senha
- `DELETE /api/users/profile` - Deletar conta

### Empresas
- `GET /api/empresas` - Listar empresas
- `GET /api/empresas/:id` - Buscar empresa
- `POST /api/empresas` - Criar empresa
- `PUT /api/empresas/:id` - Atualizar empresa
- `DELETE /api/empresas/:id` - Deletar empresa

### Clientes
- `GET /api/clientes` - Listar clientes
- `GET /api/clientes/:id` - Buscar cliente
- `POST /api/clientes` - Criar cliente
- `PUT /api/clientes/:id` - Atualizar cliente
- `DELETE /api/clientes/:id` - Deletar cliente

### Produtos
- `GET /api/produtos` - Listar produtos
- `GET /api/produtos/:id` - Buscar produto
- `GET /api/produtos/empresa/:empresaId` - Produtos por empresa
- `POST /api/produtos` - Criar produto
- `PUT /api/produtos/:id` - Atualizar produto
- `DELETE /api/produtos/:id` - Deletar produto

### Pedidos
- `GET /api/pedidos` - Listar pedidos
- `GET /api/pedidos/:id` - Buscar pedido
- `GET /api/pedidos/relatorio/vendas` - Relatório de vendas
- `POST /api/pedidos` - Criar pedido
- `PUT /api/pedidos/:id` - Atualizar pedido
- `PATCH /api/pedidos/:id/status` - Atualizar status
- `DELETE /api/pedidos/:id` - Deletar pedido

## 🔐 Autenticação

Todas as rotas (exceto registro e login) requerem autenticação JWT.

**Header necessário:**
```
Authorization: Bearer <token>
```

**Chave JWT:** `ENTREGART` (configurada via variável de ambiente)

## 📊 Estrutura do Banco

### Usuário
```javascript
{
  nome: String,
  email: String (único),
  senha: String (hash)
}
```

### Empresa
```javascript
{
  nomeFantasia: String,
  razaoSocial: String,
  cnpj: String (único),
  usuario: ObjectId (ref: User)
}
```

### Cliente
```javascript
{
  nome: String,
  email: String,
  telefone: String,
  empresa: ObjectId (ref: Empresa)
}
```

### Produto
```javascript
{
  nome: String,
  valor: Number,
  descricao: String,
  empresa: ObjectId (ref: Empresa)
}
```

### Pedido
```javascript
{
  numero: String (único),
  cliente: ObjectId (ref: Cliente),
  empresa: ObjectId (ref: Empresa),
  observacao: String,
  data: Date,
  produtos: [{
    produto: ObjectId (ref: Produto),
    quantidade: Number,
    valorUnitario: Number,
    valorTotal: Number
  }],
  valorTotal: Number,
  status: String (enum)
}
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com coverage
npm run test:coverage
```

## 📝 Scripts Disponíveis

- `npm start` - Inicia em produção
- `npm run dev` - Inicia em desenvolvimento
- `npm test` - Executa testes
- `npm run lint` - Verifica código

## 🐳 Docker

### Comandos Úteis

```bash
# Construir imagem
docker build -t entregart-backend .

# Executar container
docker run -p 3000:3000 entregart-backend

# Parar containers
docker-compose down

# Remover volumes
docker-compose down -v

# Logs em tempo real
docker-compose logs -f
```

### Acessos

- **API:** http://localhost:3000
- **MongoDB Express:** http://localhost:8081
  - Usuário: `admin`
  - Senha: `admin123`

## 🔧 Configuração de Desenvolvimento

### Variáveis de Ambiente

```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de dados
MONGODB_URI=mongodb://localhost:27017/entregart

# JWT
JWT_SECRET=ENTREGART
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3001
```

### Estrutura de Pastas

```
src/
├── controllers/     # Lógica de negócio
├── models/         # Modelos do MongoDB
├── routes/         # Rotas da API
├── middleware/     # Middlewares
├── config/         # Configurações
└── server.js       # Arquivo principal
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com MongoDB**
   - Verifique se o MongoDB está rodando
   - Confirme a string de conexão no `.env`

2. **Erro de autenticação JWT**
   - Verifique se o token está sendo enviado no header
   - Confirme se a chave JWT está correta

3. **Erro de CORS**
   - Verifique a configuração de CORS_ORIGIN
   - Confirme se o frontend está na URL correta

### Logs

```bash
# Ver logs da aplicação
docker-compose logs app

# Ver logs do MongoDB
docker-compose logs mongo

# Ver todos os logs
docker-compose logs
```

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte, entre em contato através do email: suporte@entregart.com

---

**EntregArt - Hub de vendas** - Sistema de Gestão de Comércio 🚀