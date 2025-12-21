# Controle de Hábitos API

API REST para registro, login, gerenciamento e histórico de hábitos do usuário. Utiliza banco de dados em memória e autenticação via JWT. Documentação disponível via Swagger.

## Instalação

1. Clone o repositório ou copie os arquivos para seu ambiente.
2. Instale as dependências:
   ```powershell
   npm install express swagger-ui-express jsonwebtoken
   ```

## Executando a API

- Para iniciar o servidor:
  ```powershell
  node server.js
  ```
- Para importar o app em testes:
  ```javascript
  const app = require('./app');
  ```
# Controle de Hábitos API

API REST para registro, login, gerenciamento e histórico de hábitos do usuário. Utiliza banco de dados em memória e autenticação via JWT. Documentação disponível via Swagger.

## Instalação

1. Clone o repositório ou copie os arquivos para seu ambiente.
2. Instale as dependências:
   ```powershell
   npm install express swagger-ui-express jsonwebtoken
   ```

## Executando a API

- Para iniciar o servidor:
  ```powershell
  node server.js
  ```
- Para importar o app em testes:
  ```javascript
  const app = require('./app');
  ```

## Endpoints

- `POST /users/register` — Registro de usuário
- `POST /users/login` — Login e obtenção de token JWT
- `POST /habits` — Cadastro de hábito (requer token)
# Controle de Hábitos API

API REST para registro, login, gerenciamento e histórico de hábitos do usuário. Utiliza banco de dados em memória e autenticação via JWT. Documentação disponível via Swagger.

## Instalação

1. Clone o repositório ou copie os arquivos para seu ambiente.
2. Instale as dependências:
   ```powershell
   npm install express swagger-ui-express jsonwebtoken
   ```

## Executando a API

- Para iniciar o servidor:
  ```powershell
  node server.js
  ```
- Para importar o app em testes:
  ```javascript
  const app = require('./app');
  ```

## Endpoints

- `POST /users/register` — Registro de usuário
- `POST /users/login` — Login e obtenção de token JWT
- `POST /habits` — Cadastro de hábito (requer token)
- `DELETE /habits/:habitName` — Deletar hábito (requer token)
- `POST /habits/:habitName/complete` — Marcar hábito como concluído (requer token)
- `GET /habits/history` — Consultar histórico de hábitos concluídos (requer token)
- `GET /api-docs` — Documentação Swagger

## Regras de Negócio

- Login e senha obrigatórios para autenticação.
- Token JWT necessário para operações de hábitos.
- Não é permitido cadastrar hábitos duplicados.
- Só é possível consultar hábitos marcados como concluídos.
- É possível deletar hábitos cadastrados.

## Testes

Para testar a API, utilize ferramentas como Postman, Insomnia ou Supertest.

## Documentação

Acesse `/api-docs` para visualizar e testar os endpoints via Swagger UI.

**Performance Test (k6)**

- **Objetivo:** testar o fluxo principal — registrar um usuário, realizar login e cadastrar um hábito — usando k6.
- **Local dos arquivos:** `test/k6/cadastroHabito.test.js` e helpers em `test/k6/Helpers/utils.js`.
- **Variáveis de ambiente:**
  - `BASE_URL` — URL base da API (ex.: `http://localhost:3000`).

- **Executar o teste (exemplo):**
  ```powershell
  # rodar com 10 VUs por 15s conforme options no script
  k6 run -e BASE_URL=http://localhost:3000 test/k6/cadastroHabito.test.js
  ```

- **O que o teste faz:**
  - Gera um email aleatório e registra o usuário (`POST /users/register`).
  - Realiza login (`POST /users/login`) e extrai o `token` do corpo.
  - Cria um hábito com nome único (`POST /habits`) usando o `Bearer token`.

- **Checks e métricas:**
  - Cada request inclui `check` para validar status esperado (201 para registro/cadastro, 200 para login).
  - Thresholds no script exigem que o percentil 95% (`p(95)`) de `http_req_duration` e da métrica custom `post_habit_duration` seja menor que 2000 ms.
  - Há também um threshold para `checks` garantindo alta taxa de sucesso (`rate>0.95`).

- **Dicas:**
  - Se a sua API retornar `409` para recursos já existentes durante a execução do teste, adapte os checks em `test/k6/Helpers/utils.js` para aceitar `201 || 409` conforme seu cenário.
  - Em CI, garanta que `BASE_URL` aponte para a instância correta e que o ambiente esteja limpo entre execuções para evitar conflitos de nomes.

  - **Conceitos aplicados:**
    - ***Stages***: No código abaixo, foi aplicado o conceito de stages, para representar melhor um cenário real de ramp-up e ramp-down. Usuários virtuais comecam a ser introduzido nos 5 primeiros segundos, depois mantem por mais 5 segundos o total de 10 e então começam a dimunir o número de VUs nos últimos segundos.

```javascript
stages:[
  { duration: '5s', target: 5 },
  { duration: '5s', target: 10 },
  { duration: '5s', target: 0 },
],
```

    - ***Thresholds***: No código abaixo, foi aplicado o conceito de Thresholds, onde defino que o percentil de 95 deve ser menor que 2 segundos para o teste passaar com sucesso, e o prompt adicionou o checks, para garantir que os checks devem passar da taxa de 95% de sucesso.

```javascript
thresholds: {
  // overall HTTP request 95th percentile must be < 2000ms
  'http_req_duration': ['p(95)<2000'],
  // custom trend for POST /habits
  'post_habit_duration': ['p(95)<2000'],
  // ensure the checks pass at an acceptable rate (optional)
  'checks': ['rate>0.95'],
}
```

    - ***Trend***: No código abaixo, foi aplicado o conceito de trend, durante a chamada de cadastro de hábito, solicito que cadas VU adicione sua duration para no final eu ter um resultado customizado dessa request em especifico.

    - primeiro é criado o postHabitTrend que desejo
```javascript
        const postHabitTrend = new Trend('post_habit_duration');
```
      - Depois dentro do metodo relacionado , é solicitado que cada user adicione sua duration nessa lista postHabitTrend
```javascript
        group('Create Habit', () => {
      const habitName = randomHabitName();
      const res = (() => {
        const start = Date.now();
        const r = createHabit(baseUrl, token, habitName);
        const duration = r && r.timings && r.timings.duration ? r.timings.duration : 0;
        postHabitTrend.add(duration);
        return r;
      })();

```

- **Groups:**
  - O teste usa `group()` para estruturar e deixar claro o fluxo: existe um grupo principal `Register -> Login -> Create Habit` e grupos internos `Register`, `Login` e `Create Habit`.
  - `Groups` tornam a saída do k6 mais legível, permitem agrupar checks/requests relacionados e facilitam a análise de timings por bloco de negócio.
  - No código abaixo, é possivel ver o Group principal e tambem um gropu interno: 

  ```javascript
    group('Register -> Login -> Create Habit', () => {
    const email = randomEmail();
    const password = 'Pass123!';

    group('Register', () => {
      // register must return 201 (created)
      register(baseUrl, email, password);
    });
```



```

- **Checks:**
  - Asserções `check()` são aplicadas nas helpers (`register`, `login`, `createHabit`) para validar status e a presença do `token` (ex.: `201` para registro, `200` para login, `201` para criação de hábito).
  - Esses `checks` executam por VU/iteração e aparecem no sumário do k6; o script também define um threshold para `checks` (`rate>0.95`) para garantir alta taxa de sucesso funcional durante o teste de carga.
  - segue abaixo o trecho de código onde os checks sao aplicados, um para o register, outro para o login e outro para o cadastro de habito: 
  ```javascript
  check(res, {
    'register: status is 201': (r) => r.status === 201,
  });

  check(res, {
    'login: status is 200': (r) => r.status === 200,
    'login: has token': (r) => {
      try {
        return !!r.json('token');
      } catch (e) {
        return false;
      }
    },
  });

  check(res, {
    'create habit: status is 201': (r) => r.status === 201,
  });

```

- **Reaproveitamento de código (Helpers):**
  - Funções reutilizáveis estão em `test/k6/Helpers/utils.js`: `getBaseUrl()`, `randomEmail()`, `randomHabitName()`, `register()`, `login()` e `createHabit()`.
  - Essas helpers encapsulam chamadas HTTP, checks e criação de payloads, e são usadas por `test/k6/cadastroHabito.test.js` nos grupos Register/Login/Create Habit. Isso reduz duplicação, facilita manutenção e permite reaproveitar logicamente essas funções em outros testes de performance.
  - No código abaixo temos o exemplo de randomEmail(), onde é criada a funcçao que gera email aleatório.
```javascript
  export function randomEmail() {
    return `user_${Math.random().toString(36).slice(2,10)}@example.com`;
  }
```
  - E essa função é usada pelo `test/k6/cadastroHabito.test.js`, durante o registro de usuario.
```javascript
    group('Register -> Login -> Create Habit', () => {
    const email = randomEmail();
    const password = 'Pass123!';

    group('Register', () => {
      // register must return 201 (created)
      register(baseUrl, email, password);
    });
```