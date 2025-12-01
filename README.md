# Transport backend

Express + Prisma API for the transport app with PostgreSQL and Elasticsearch-backed backoffice search.

## Quick start

```bash
cd backend
cp .env.example .env
docker compose up -d           # start Postgres + Elasticsearch (single node, no auth)
npm install
npx prisma migrate dev --name init
npm run seed                   # creates admin + permissions + sample bus/driver/route/trip
npm run dev                    # starts http://localhost:${PORT:-4000}
```

Health check: `GET /health`

## Environment

- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: long random string.
- `ELASTICSEARCH_NODE`: ex. `http://localhost:9200` (required for search endpoints).
- `ELASTICSEARCH_USERNAME` / `ELASTICSEARCH_PASSWORD`: only if you enable xpack security.

## Main endpoints

- `POST /api/auth/register` – traveler self-signup (creates Traveler + User).
- `POST /api/auth/login` – returns JWT + profile permissions.
- `GET /api/routes` – public routes list. `GET /api/routes/:id`
- `GET /api/trips?origin=...&destination=...&date=YYYY-MM-DD` – public trip search. `GET /api/trips/:id`
- `POST /api/reservations` – traveler reserves seat (auth). Supports `travelerInfo` for counter bookings.
- `GET /api/reservations/me` – traveler history (auth).
- `POST /api/reservations/:id/cancel` – cancel and release seat (auth).
- `POST /api/reservations/:id/check-in` – driver marks boarded (permission `driver.operations`).
- `GET /api/drivers/:driverId/trips` – driver schedule (auth).

Backoffice (all require JWT + permissions):

- `/api/admin/buses` CRUD (`transport.buses.manage`)
- `/api/admin/drivers` CRUD (`transport.drivers.manage`)
- `/api/admin/routes` CRUD (`transport.routes.manage`)
- `/api/admin/trips` CRUD + status (`transport.trips.manage`)
- `/api/admin/trips/:tripId/occupancy` (`transport.reservations.manage`)

Search (Elasticsearch + Lucene query syntax):

- `GET /api/search?q=type:trip AND route:Antananarivo` – backoffice search (permission `search.manage` not required for GET but API is behind `/api/search` route auth).
- `POST /api/search/reindex` – bulk index Postgres data into Elasticsearch (`search.manage`).

### Seed admin & sample data

- `npm run seed` creates:
  - Permissions: `transport.*.manage`, `driver.operations`, `search.manage`
  - Profile `ADMIN` with all permissions
  - Admin user: `admin@transport.local` / `Admin123!`
  - Sample bus, driver, route, and one trip (tomorrow) for quick UI testing.

## Data model highlights (Prisma)

- Core: `User`, `Profile`, `Permission`, `Traveler`, `Driver`, `Bus`, `Route`, `Trip`, `Reservation`.
- Audit: `AuditLog`, `LoginLog`.
- Constraints: unique user email, unique seat per trip, traveler-user 1:1, trip availableSeats decremented on booking and restored on cancel.

## Notes

- Permission codes used in routes: `transport.*.manage`, `driver.operations`, `search.manage`. Create Profiles/Permissions accordingly (seed or Prisma scripts).
- Elasticsearch in `docker-compose.yml` runs without security for local dev; add auth + TLS in production.
- Adjust `env.PORT` to avoid clashing with Next.js (default 4000).
