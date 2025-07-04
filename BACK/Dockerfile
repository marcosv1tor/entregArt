# Usar imagem oficial do Node.js
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /usr/src/app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Alterar propriedade dos arquivos
RUN chown -R nodejs:nodejs /usr/src/app
USER nodejs

# Expor porta
EXPOSE 5000

# Comando para iniciar a aplicação
CMD ["npm", "start"]