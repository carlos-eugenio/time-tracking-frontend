# Time Tracking Frontend

Frontend em Vue 3 (Vite) para controle de colaboradores, lançamentos de ponto, relatórios filtráveis e exportação de dados.

## Funcionalidades

- Login.
- CRUD de colaboradores.
- Ativação e inativação de colaboradores.
- CRUD de lançamentos de ponto.
- Relatório de pontos por período.
- Filtro opcional por colaborador.
- Ordenação do relatório por funcionário ou data.
- Exportação do relatório em CSV, XLSX e PDF.
- Tratamento de erros e loading.

## Stack

- Vue 3
- Vite
- Vue Router
- Pinia
- Axios
- Bootstrap 5
- Flaticon UIcons (ícones)
- Docker / Docker Compose

## Requisitos com Docker

- Git
- Docker
- Docker Compose v2

## Rodando com Docker

Clone o repositório:

```bash
git clone URL_DO_REPOSITORIO
cd frontend
```

Crie o arquivo de ambiente:

```bash
cp .env.example .env
```

Suba o container:

```bash
docker compose up --build
```

O frontend ficará disponível em:

```text
http://localhost:5173
```

Importante:

- O frontend consome a API então é necessário subir o backend antes, para conseguir autenticar e usar as telas.

## Requisitos para rodar local sem Docker

- Node.js 20+
- npm

## Rodando sem Docker

Clone o repositório:

```bash
git clone URL_DO_REPOSITORIO
cd frontend
```

Instale dependências:

```bash
npm install
```

Crie o arquivo de ambiente:

```bash
cp .env.example .env
```

Suba o dev server:

```bash
npm run dev
```

O frontend ficará disponível em:

```text
http://localhost:5173
```

## Variáveis de ambiente

Arquivo: `.env`

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## Backend

- API padrão (com Docker): `http://localhost:8080/api`
- API local (sem Docker, `php artisan serve`): `http://127.0.0.1:8000/api`

Se mudar o host/porta do backend, ajuste `VITE_API_BASE_URL`.

## Credenciais

Usuário criado pela seed do backend:

```text
Email: admin@email.com
Senha: adminTeste1234
```

## Comandos úteis

Ver containers:

```bash
docker compose ps
```

Ver logs:

```bash
docker compose logs -f frontend
```
