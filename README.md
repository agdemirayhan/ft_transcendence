# ft_transcendence - Phase 1 Base

This setup includes:
- NestJS backend (`/backend`)
- PostgreSQL (`db` service in Docker Compose)
- Prisma ORM (`/backend/prisma/schema.prisma`)
- Docker Compose orchestration

## 1) Prepare env

```bash
cp .env.example .env
```

## 2) Start services

```bash
docker compose up --build
```

Backend runs on `http://localhost:3000`.

Health check:

```bash
curl http://localhost:3000/health
```

## 3) Local backend (optional)

If you want to run backend without Docker:

```bash
cd backend
npm install
export DATABASE_URL="postgresql://transcendence:transcendence@localhost:5432/transcendence?schema=public"
npx prisma migrate dev --name init
npm run start:dev
```
