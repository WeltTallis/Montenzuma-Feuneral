nano /usr/local/bin/restpoint-db-backup.sh



#!/bin/bash

set -euo pipefail

BACKUP_DIR="/opt/backups/db/hourly"
CONTAINER="restpoint_mariadb"
DB_USER="restpoint_user"
DB_PASSWORD="RestPointUser2024"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/restpoint_full_${TIMESTAMP}.sql.gz"
TEMP_FILE="${BACKUP_FILE}.tmp"

mkdir -p "$BACKUP_DIR"

echo "$(date '+%Y-%m-%d %H:%M:%S') Starting full database backup..."

docker exec -i "$CONTAINER" mariadb-dump \
  -u "$DB_USER" \
  -p"$DB_PASSWORD" \
  --all-databases \
  --single-transaction \
  --routines \
  --events \
  --triggers \
  --hex-blob \
  | gzip > "$TEMP_FILE"

if gzip -t "$TEMP_FILE" && [ -s "$TEMP_FILE" ]; then
    mv "$TEMP_FILE" "$BACKUP_FILE"
    echo "$(date '+%Y-%m-%d %H:%M:%S') Backup successful: $BACKUP_FILE"
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') BACKUP FAILED" >&2
    rm -f "$TEMP_FILE"
    exit 1
fi

# Keep hourly backups for 7 days
find "$BACKUP_DIR" \
  -type f \
  -name 'restpoint_full_*.sql.gz' \
  -mtime +7 \
  -delete

chmod 700 /usr/local/bin/restpoint-db-backup.sh
/usr/local/bin/restpoint-db-backup.sh
ls -lh /opt/backups/db/hourly/
zgrep '^-- Current Database:' /opt/backups/db/hourly/restpoint_full_20260909_120000.sql.gz
crontab -e




hoose 1-4 [1]:

Enter:

1



0 * * * * /usr/local/bin/restpoint-db-backup.sh >> /var/log/restpoint-db-backup.log 2>&1


crontab -l
  


  cron job running status  ===   systemctl is-active cron

verify    ls -lh /opt/backups/db/hourly/
backups   logs   =   tail -20 /var/log/restpoint-db-backup.log


remove backups  =  rm -f /opt/backups/db/hourly/restpoint_full_20260909_112016.sql.gz



It will restore the database structures and data that were present when the backup was taken.
Backup  restore


gunzip -c /opt/backups/db/hourly/restpoint_full_20260909_113110.sql.gz \
  | docker exec -i restpoint_mariadb mariadb -u root -p



?? mak eit executable ===  sudo chmod 700 /usr/local/bin/restpoint-db-backup.sh
