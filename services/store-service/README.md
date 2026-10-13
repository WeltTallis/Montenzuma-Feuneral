# Mini Store Service

A small, self-contained inventory + sales-picking service for the restpoint platform (one service per domain, following the same conventions as `florist-service`, `coffin-service`, etc.).

It powers the **Mini Store UI** (`mini-store.html` at the repo root) and exposes a REST API it serves.

## What it does

| Area | Endpoint | Purpose |
|------|----------|---------|
| Health | `GET /health` | liveness probe |
| Items | `GET /api/store/items` | list (supports `?search=` & `?category=`) |
| Items | `GET /api/store/items/categories` | distinct categories |
| Items | `GET /api/store/items/:id` | read one |
| Items | `POST /api/store/items` | create (body: `name,category?,unit?,stock?,minStock?`) |
| Items | `PUT /api/store/items/:id` | update |
| Items | `DELETE /api/store/items/:id` | delete |
| Movement | `POST /api/store/items/:id/pick` | pick/sell from store (body: `quantity,staff,reason,notes?`) |
| Movement | `POST /api/store/items/:id/restock` | add stock (body: `quantity,supplier?,staff?`) |
| Movement | `POST /api/store/items/:id/adjust` | set stock (body: `newStock,reason?,staff?`) |
| History | `GET /api/store/transactions` | list with filters + pagination |
| Stats | `GET /api/store/stats` | dashboard aggregates |

All mutation responses follow the platform convention:
```json
{ "success": true, "message": "...", "data": { ... } }
```
Errors: `{ "success": false, "message": "..." }` with an appropriate HTTP status.

## Run it

```bash
# from repo root
npm run dev --workspace=store-service

# or build + start (typescript compiled to dist/)
npm run build --workspace=store-service
npm start --workspace=store-service
```

The service listens on `STORE_SERVICE_PORT` (default **7071**).

### Database

It connects using the shared `.env` vars (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, ...). On startup it runs its knex migrations (`migrations/`) to create:

- `store_items`  — `id, name, category, unit, stock, min_stock, created_at, updated_at`
- `store_transactions` — `id, item_id, item_name, action (used|restocked|adjusted), quantity, unit, staff, reason, remaining, created_at`

The service requires MariaDB and runs its migrations before listening. It exits on database connection or migration failure; it never returns demo inventory. `/health` checks database availability. Transaction attribution comes from the verified signed-in account, and the database no longer supplies a generic "Store Clerk" identity.

### UI

The production React UI talks to the authenticated API and does not keep inventory or transactions in browser storage. `mini-store.html` is a legacy standalone demo and is not served by this API service.

## Port

Add to `.env`:
```dotenv
STORE_SERVICE_PORT=7071
STORE_SERVICE_EXTERNAL_PORT=7071
```
