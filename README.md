# Transport Coop – Full Stack Setup

Local setup for the cooperative transport app (Next.js frontend + Express/Prisma backend) with Docker for infra.

## Prerequisites
- Docker + Docker Compose
- Node.js 18+ and npm

## 1) Start infrastructure (Postgres + Elasticsearch)
From `backend/`:
```bash
cp .env.example .env
# Update DATABASE_URL to match docker compose (transport/transport)
# DATABASE_URL=postgresql://transport:transport@localhost:5432/transport

docker compose up -d   # starts Postgres on 5432 and Elasticsearch on 9200
```

## 2) Install & migrate backend
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run build   # optional, validates TS
```

### Seed data
Pick one:
- Minimal seed with admin + sample records:
  ```bash
  npm run seed
  # admin user: admin@transport.local / Admin123!
  ```
- RBAC profiles (limited scopes for each role):
  ```bash
  npx ts-node scripts/seedRbacProfiles.ts
  # resa@transport.local / Resa123!    (reservations + trips)
  # trajet@transport.local / Trajet123! (routes/trips/buses/drivers)
  # logistique@transport.local / Log123! (buses/drivers)
  ```
- Full Madagascar sample set (20 trips, 7 buses/drivers, routes, 16-seat fleet):
  ```bash
  npx ts-node scripts/seedMadagascar.ts
  ```

Start backend:
```bash
npm run dev   # http://localhost:4000
```

## 3) Configure & run frontend
```bash
cd Cooperative-app-front-end-main
cat > .env.local <<'EOF'
NEXT_PUBLIC_API_BASE=http://localhost:4000/api
EOF

npm install
npm run dev   # http://localhost:3000
```

## Helpful routes
- Front: `http://localhost:3000/cooperative_management`
  - Auth: `/auth`
  - Planning/History: `/history`
  - Travelers, Drivers, Vehicles, Reservations: their respective tabs
- API health: `GET http://localhost:4000/health` (if implemented)

## Admin permissions
The seed script creates the `ADMIN` profile with permissions:
- transport.buses.manage
- transport.drivers.manage
- transport.routes.manage
- transport.trips.manage
- transport.reservations.manage
- driver.operations
- search.manage

Use the admin credentials above to access backoffice screens.
