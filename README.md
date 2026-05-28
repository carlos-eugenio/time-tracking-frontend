# Frontend (Vue 3 + Vite)

Frontend do sistema de lançamento de horas.

## Requisitos

- Node.js 20+ (para rodar local)
- Docker (opcional)

## Variáveis de ambiente

- Copie `.env.example` para `.env` e ajuste o `VITE_API_BASE_URL` se necessário.
- Default pensado para o backend via Docker em `http://localhost:8080/api`.

## Rodando local

```bash
npm install
npm run dev
```

## Rodando com Docker

```bash
docker compose up --build
```

