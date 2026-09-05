# Uploads Fix — Production Runbook

This release makes every tenant's uploads live in its OWN folder under the ONE
shared host directory and removes every path that silently lost files.

## New layout (after this release)

```
/opt/storage/uploads/<tenant-slug>/
  ├── signatures/   ← signing-pad signatures (deceased, body-release)
  ├── documents/    ← deceased/operational documents
  ├── images/       ← general images   (coffins uploads: images/coffins/<id>/)
  ├── pdf/          ← generated/uploaded PDFs
  ├── exports/      ← spreadsheet/report exports
  ├── flowers/      ← flower-arrangement images (florist)
  ├── logos/  deceased/  receipts/  reports/  contracts/
  ├── employees/  chemicals/  invoices/
/opt/storage/uploads/FlowerSamples/<slug>/   (legacy URLs still served)
/opt/storage/uploads/tenants/<slug>/logos/   (logo URLs still served)
```

Everything is served to browsers at `https://restpoint.co.ke/uploads/...`
(nginx → tenant-service static mount → the same `/opt/storage/uploads`).

## What was broken and is now fixed

| Area | Before | Now |
|---|---|---|
| Global uploader (`centralizedUploadService`) | POSTed coffin images to a non-existent `uploads-service` on `localhost:5012` → always failed | Writes directly to `/opt/storage/uploads/<slug>/<category>/...` |
| documents-service | Ignored `GLOBAL_UPLOADS_DIR`, wrote into container-local `.../uploads` (lost on rebuild); routes not reachable through the gateway; frontend called `localhost:8112` | Honors env var, per-tenant layout, mounted at `/documents` for the gateway, frontend goes through gateway |
| Florist flower images | Silently fell back to container-local / temp dirs → record created but image 404s | Writes to `<uploads>/<slug>/flowers/`, THROWS in production if storage isn't writable |
| Signatures | Folder used raw slug; if `/opt/storage` was unwritable the save was silently skipped ("signature will not be stored") | Slug sanitized per-tenant; ownership fixed by bootstrap script so saves succeed |
| Existing tenants | Folders only created at registration time | `setup-tenant-upload-folders.sh` bootstraps every tenant + branch |

## Deploy on the server (root@vmi3542692)

```bash
# 1) Pull the fixed code
cd /opt/restpoint
git pull

# 2) Create/migrate per-tenant folders for EVERY existing tenant + branch,
#    migrate legacy flower images, fix ownership (uid 1001 = container user)
bash scripts/setup-tenant-upload-folders.sh

# 3) Rebuild + restart the services that handle uploads
docker compose -f docker-compose.prod.yml up -d --build \
  tenant-service floral_settings 2>/dev/null || true
docker compose -f docker-compose.prod.yml up -d --build \
  florist-service coffin-service documents-service tenant-service frontend

# 4) Reload host nginx (it routes /uploads/ -> tenant-service:5002)
nginx -t && systemctl reload nginx
```

## Verify

```bash
# Folders exist per tenant
ls /opt/storage/uploads/<tenant-slug>/flowers
ls /opt/storage/uploads/<tenant-slug>/signatures

# Signature served through the public URL
curl -I https://restpoint.co.ke/uploads/<tenant-slug>/signatures/<file>.png

# Documents through the gateway
curl -I -H "x-tenant-slug: <tenant-slug>" \
  https://restpoint.co.ke/api/v1/restpoint/documents/<deceasedId>
```

## Troubleshooting

- **bash: syntax error near unexpected token `(`** — you are manually typing
  folder names / commands with special characters. Always use the script
  (`bash scripts/setup-tenant-upload-folders.sh`) or quote paths:
  `ls "/opt/storage/uploads/<tenant folder with spaces>/"`.
- **Upload returns 500** — the container cannot write into `/opt/storage/uploads`
  (wrong ownership). Re-run `bash scripts/setup-production-storage.sh` then
  `bash scripts/setup-tenant-upload-folders.sh`.
- **Images 404 after upload** — confirm the file exists on the host under
  `/opt/storage/uploads/<slug>/...` and that the DB stores the `/uploads/...`
  root-relative URL (never `http://...` internal URLs).