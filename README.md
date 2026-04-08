# EntregArt - Hub de vendas

**Sistema completo de gestão de comércio** desenvolvido com tecnologias modernas para facilitar a administração de vendas, produtos, clientes e pedidos.

## Sobre o Projeto

O EntregArt é uma plataforma web completa que oferece:

- **Gestão de Produtos**: Cadastro, edição e controle de estoque
- **Gestão de Clientes**: Controle completo da base de clientes
- **Gestão de Pedidos**: Acompanhamento de vendas e entregas
- **Gestão de Empresas**: Administração multi-empresa
- **Dashboard Analítico**: Relatórios e métricas de vendas
- **Sistema de Autenticação**: Login seguro com JWT

## Arquitetura do Projeto

O projeto está dividido em duas partes principais:

### BACK/ - Backend API
- **Tecnologia**: Node.js + Express.js
- **Banco de Dados**: MongoDB
- **Autenticação**: JWT (JSON Web Tokens)
- **Documentação**: [README do Backend](./BACK/README.md)

### FRONT/ - Frontend Web
- **Tecnologia**: React.js
- **Estilização**: CSS3 + Design Responsivo
- **Gerenciamento de Estado**: Context API
- **Documentação**: [README do Frontend](./FRONT/README.md)

## Como Executar

### Pré-requisitos
- Node.js (v14 ou superior)
- MongoDB
- npm ou yarn

### Backend
```bash
cd BACK
npm install
npm run dev
```

### Frontend
```bash
cd FRONT
npm install
npm start
```

### Docker (Desenvolvimento)
```bash
cd BACK
docker-compose -f docker-compose.dev.yml up
```

## Acesso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB Express**: http://localhost:8081

## Funcionalidades

### Dashboard
- Visão geral das vendas
- Métricas de produtos
- Gráficos de desempenho

### Gestão
- **Produtos**: CRUD completo com controle de estoque
- **Clientes**: Cadastro e histórico de compras
- **Pedidos**: Criação, edição e acompanhamento
- **Empresas**: Gestão multi-tenant

### Segurança
- Autenticação JWT
- Proteção de rotas
- Validação de dados
- Hash de senhas

## Tecnologias Utilizadas

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- CORS

### Frontend
- React.js
- React Router
- Context API
- CSS3
- Fetch API

### DevOps
- Docker
- Docker Compose
- MongoDB Express

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Equipe

**EntregArt Team** - Desenvolvimento e manutenção

---

**EntregArt - Hub de vendas**: Transformando a gestão comercial com tecnologia moderna e interface intuitiva.
