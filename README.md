# PlanuCenter

Aplicação Angular para gestão de ordens de serviço acompanhada de uma API Node.js + MySQL.

## Pré-requisitos

* Node.js 18+
* npm 9+
* Servidor MySQL 8 (ou compatível)

## Configurando o banco de dados MySQL

1. Crie um banco e todas as tabelas executando o script `server/sql/schema.sql` no seu servidor MySQL.
2. Popule dados iniciais (opcional) com `server/sql/seed.sql`.
3. Crie um arquivo `.env` dentro da pasta `server/` baseado no `.env.example`:

   ```bash
   cp server/.env.example server/.env
   ```

   Ajuste as credenciais conforme o ambiente.

## Rodando a API (Express + MySQL)

Instale as dependências e inicie o servidor:

```bash
cd server
npm install
npm run dev
```

A API ficará disponível em `http://localhost:3000` (configurável via `.env`). Endpoints principais:

* `GET /api/clients`
* `GET /api/vehicles`
* `GET /api/services`
* `GET /api/parts`
* `GET /api/orders`

Cada recurso também possui operações de criação, atualização e exclusão.

## Rodando o front-end Angular

Em outro terminal, na raiz do projeto:

```bash
npm install
npm start
```

A aplicação estará em `http://localhost:4200` consumindo os dados da API. Ajuste a URL base da API em `src/environments/environment.ts` caso necessário.

## Testes

O projeto mantém os comandos padrão do Angular CLI:

```bash
npm test
```

## Estrutura de pastas

```
.
├── server/              # API Express com integrações MySQL
│   ├── src/
│   └── sql/
├── src/                 # Aplicação Angular
└── README.md
```
