# Teste3

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.6.

## Development server

This project now possui um backend Node.js simples responsável por persistir os dados em `server/database.json`. Para desenvolver:

1. Em um terminal, inicie a API local:

   ```bash
   npm run server
   ```

   O serviço estará disponível em `http://localhost:3000/api`.

2. Em outro terminal, suba a aplicação Angular:

   ```bash
   ng serve
   ```

   Acesse `http://localhost:4200/` no navegador. As alterações nos arquivos front-end recarregam automaticamente a página.

> **Evite erros no console**: Se o frontend for aberto sem a API rodando, ele detecta automaticamente a indisponibilidade do servidor, entra em **modo offline** e utiliza os dados locais sem disparar erros de `ERR_CONNECTION_REFUSED`. Para trabalhar com dados persistidos mantenha `npm run server` ativo em paralelo ao `ng serve`.

### Credenciais padrão

Para testar o fluxo completo de autenticação foi incluído um usuário administrador:

| Perfil | E-mail | Senha |
| ------ | ------ | ----- |
| Admin | `admin@oficinapro.com` | `admin123` |

Também existe um usuário de atendimento (`atendimento@oficinapro.com` / `atendimento123`) que pode ser utilizado para cenários de demonstração.

Após o login, todos os módulos de clientes, veículos, estoque e ordens de serviço passam a permitir pesquisa instantânea, impressão do resumo de cada ordem e exclusão segura de registros diretamente pela interface.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
