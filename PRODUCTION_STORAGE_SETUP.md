# Production Storage — /opt/storage + /opt/backups (Server Setup Guide)

This release makes **`/opt/storage` the single home for every tenant upload in
production** (signatures, logos, documents, hearse images, scanned documents,
invoice PDFs) and **`/opt/backups` the single home for every backup**.

## What changed

| Area | Before | Now |
|---|---|---|
| Uploads storage | Docker named volume `shared_uploads` (files hidden in `/var/lib/docker/volumes/...`) | **Host bind mount `/opt/storage`** — host path == container path |
| Florist uploads | Separate `florist_service_data` volume | Same `/opt/storage` bind mount |
| Hearse images | `./services/hearse-service/uploads` in the git checkout | `/opt/storage/uploads/hearses` |
| Leave documents | Container-local disk (lost on rebuild!) | `/opt/storage/uploads/leave-documents` |
| Scanner files | `scanner_uploads` volume | `/opt/storage/uploads/scanner` |
| Invoice PDFs | repo dir (lost on rebuild) | `/opt/storage/uploads/invoices` + `/opt/storage/invoices/...` |
| Signatures in invoice PDFs | looked up in repo paths → PDF had no signature | resolved from `/opt/storage/uploads/<tenant>/signatures` |
| Backups | `./backups` inside the repo | **`/opt/backups/db` + `/opt/backups/uploads`** (`make backup`, `make backup-uploads`, `make backup-all`, `scripts/backup-production.sh`) |

Signature UI fixes included: postmortem portal now renders the pathologist
signature as an `<img>` (it previously printed the URL as text), invoice
`signature_url` values are resolved against the gateway origin, and the bogus
nonexistent `/uploads/signature/signature.png` default is no longer written.

## Deploy on the server (root@vmi3542692)

```bash
# 1) get the updated code
cd /opt/restpoint
git pull            # (or your usual deploy method)

# 2) ONE-TIME: create dirs, migrate data out of the old docker volumes,
#    fix ownership for the containers (uid 1001)
bash scripts/setup-production-storage.sh

# 3) rebuild + restart everything
docker compose -f docker-compose.prod.yml up -d --build

# 4) reload the host nginx (it routes /uploads/ -> tenant-service:5002)
nginx -t && systemctl reload nginx
```

## Verify

```bash
# signatures physically on the host now:
ls -la /opt/storage/uploads/<tenant-slug>/signatures/

# served correctly through the public URL (HTTP 200 + image/png):
curl -I https://restpoint.co.ke/uploads/<tenant-slug>/signatures/<file>.png

# quick end-to-end test from inside the stack:
docker exec restpoint_tenant_service wget -qO- http://localhost:5000/uploads/<tenant-slug>/signatures/<file>.png | head -c 8; echo

# backups:
make backup-all          # → /opt/backups/db/*.sql.gz + /opt/backups/uploads/*.tar.gz
ls -la /opt/backups/db /opt/backups/uploads
```

## Nightly backups (cron)

```bash
chmod +x /opt/restpoint/scripts/backup-production.sh
(crontab -l 2>/dev/null; echo "30 2 * * * /opt/restpoint/scripts/backup-production.sh >> /opt/restpoint/logs/backup.log 2>&1") | crontab -
```

Keeps the last 14 database dumps and 14 upload archives in `/opt/backups`.

## Notes / gotchas

- **Line endings**: both `scripts/*.sh` files are LF. If you edit them on
  Windows and `bash` complains about `\r`, fix with:
  `sed -i 's/\r$//' scripts/*.sh` (same for `Makefile` if `make` ever chokes).
- **Permissions**: every container runs as `nodejs` (uid 1001). The setup
  script `chown`s `/opt/storage` to `1001:1001` — re-run it if you ever
  recreate the directory manually, otherwise uploads fail with `EACCES`.
- **Old signatures** are migrated automatically from the docker volume
  `restpoint_shared_uploads` (and the florist/scanner volumes, plus the old
  `services/*/uploads` folders) into `/opt/storage/uploads` by the setup
  script. Migration only runs when the destination is empty, so it is safe to
  re-run.
- `GLOBAL_UPLOADS_DIR=/opt/storage/uploads` is now set explicitly on every
  upload-handling service in `docker-compose.prod.yml`; the code default is the
  same path, so local dev behaviour is unchanged.
- If `/uploads/` images ever 404 again, check the host nginx has the
  `location /uploads/ { proxy_pass http://127.0.0.1:5002; }` block for both
  `restpoint.co.ke` and `portal.restpoint.co.ke` (see `nginx-host.conf`).
