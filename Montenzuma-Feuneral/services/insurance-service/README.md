# Insurance service (Go + PostgreSQL)

The service listens on port `5050` and creates its PostgreSQL tables at startup. Configure either `DATABASE_URL` or `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD`.

Insurance contribution STK pushes call the M-Pesa service on port `4040`. Redis caches policy and claim reads; configure `REDIS_ADDR` and `REDIS_PASSWORD`. Production M-Pesa callbacks use `https://restpoint.co.ke/api/v1/restpoint/mpesa/stkcallback`, routed by the API gateway. M-Pesa forwards payment results to `/insurance/payments/callback`. Set the same private value in M-Pesa `INSURANCE_CALLBACK_SECRET` and insurance `MPESA_CALLBACK_SECRET`.

Production Compose requires `MPESA_DB_PASSWORD`, `INSURANCE_PG_PASSWORD`, and `INSURANCE_CALLBACK_SECRET`. M-Pesa credentials (`MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_SHORTCODE`) are read from the root `.env.production` file. The API gateway also exposes M-Pesa routes under `/api/v1/restpoint/mpesa`.

Claim submission accepts JSON or `multipart/form-data`. Optional file fields are `deathCertificate`, `claimantId`, and `burialPermit` (legacy field aliases are accepted). PDF, JPEG, and PNG files up to 10 MB each are written under `GLOBAL_UPLOADS_DIR/insurance/<tenant>/claims/<claim-id>`; the returned `/uploads/...` paths are saved in PostgreSQL. Compose mounts the shared `/opt/storage` volume so the documents service and frontend can serve them.

The M-Pesa service currently supports STK collections. Claim review/status tracking is supported by insurance; claim payouts require a separately configured M-Pesa B2C/disbursement integration and are not sent through customer STK push.

This service initializes an empty PostgreSQL schema. Existing records in the old MariaDB insurance database are not copied automatically; export/import them before switching production traffic if they must be retained.
