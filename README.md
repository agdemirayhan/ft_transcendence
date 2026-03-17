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


Check Auth system:
docker compose down -v
docker compose up --build

In new Terminal:
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"mhummel@42.fr","username":"mhummel","password":"123456"}'
npx prisma migrate dev --name init
npm run start:dev
```

## pgAdmin — Database Management

pgAdmin is available for visual database management.

**URL:** `http://localhost:5050`

**Login:**
- Email: `admin@admin.com`
- Password: `admin`

**Connecting to the database:**
1. Click **"Add New Server"**
2. Enter a name (e.g. `transcendence`)
3. Go to the **Connection** tab and fill in:
   - Host: `db`
   - Port: `5432`
   - Username: `postgres` (or `POSTGRES_USER` from `.env`)
   - Password: `POSTGRES_PASSWORD` from `.env`
4. Click **Save**

**Viewing table data:**

Navigate to:
`Servers → transcendence → Databases → transcendence → Schemas → public → Tables → users`

Right-click `users` → **View/Edit Data** → **All Rows**