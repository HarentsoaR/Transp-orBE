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
npx prisma migrate dev --name reservation_seats_single_traveler   # seats table and traveler info
npx prisma migrate dev --name audit_tables                        # revinfo / a_historique / a_connexion
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
- Audit-only seed not needed; audit tables are empty by default and will be filled by activity.

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

## Permissions & RBAC
- Fine-grained permissions (view/create/update/delete):
  - transport.buses.(view|create|update|delete)
  - transport.drivers.(view|create|update|delete)
  - transport.routes.(view|create|update|delete)
  - transport.trips.(view|create|update|delete)
  - transport.reservations.manage
  - driver.operations
  - search.manage
- Seeded profiles/users:
  - ADMIN (all permissions) → admin@transport.local / Admin123! (via `npm run seed`)
  - RESPONSABLE_RESERVATION → resa@transport.local / Resa123! (reservations + trips.view + routes.view)
  - RESPONSABLE_TRAJET → trajet@transport.local / Trajet123! (trips/routes CRUD + buses/drivers view)
  - RESPONSABLE_LOGISTIQUE → logistique@transport.local / Log123! (buses/drivers CRUD)

## Audit & logs
- Audit tables: `revinfo`, `a_historique`, `a_connexion`
- Logged automatically:
  - Bus/Driver/Route/Trip: create/update/delete (+ status for trips)
  - Reservation: create/cancel/check-in
  - Auth login: `LoginLog` + `a_connexion` (user/email/ip/userAgent/success)
- To inspect: query `a_historique` (who did what, when, IP/UA) and `a_connexion` (logins).
