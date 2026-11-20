# Restpoint R2 backups

The scripts back up the complete `/opt/storage/uploads` tree, MariaDB, and the
`mpesa-postgres` and `insurance-postgres` databases to Cloudflare R2 through
its S3-compatible endpoint. Cloudflare Tunnel is not required for the R2 API.

Install AWS CLI v2 on the Docker host and load the variables from
`.env.example` through a protected secret store:

```sh
set -a; . /etc/restpoint/backup.env; set +a
ops/backup/backup-to-r2.sh
ops/backup/backup-restore-test.sh
```

Restore is explicitly gated and should target a maintenance window:

```sh
CONFIRM_RESTORE=YES BACKUP_STAMP=20261117T020000Z ops/backup/restore-from-r2.sh
CONFIRM_RESTORE=YES BACKUP_STAMP=20261117T020000Z RESTORE_UPLOADS=YES ops/backup/restore-from-r2.sh
```

Schedule the backup script with cron or systemd. The scripts keep the newest
three local snapshots and the newest three R2 snapshot folders. They do not
delete anything outside that backup prefix.

Restore from the local copy without downloading from R2:

```sh
CONFIRM_RESTORE=YES BACKUP_SOURCE=local BACKUP_DIR=/opt/backups/restpoint BACKUP_STAMP=20261117T020000Z ops/backup/restore-from-r2.sh
```

Useful hourly-backup commands:

```sh
sudo systemctl enable --now restpoint-backup.timer
systemctl list-timers restpoint-backup.timer
sudo systemctl start restpoint-backup.service
sudo journalctl -u restpoint-backup.service -n 100 --no-pager
ops/backup/backup-restore-test.sh
```

For systemd on the production host, install the unit files, create the
protected `/etc/restpoint/backup.env` from `.env.example`, then enable the
timer:

```sh
sudo install -m 0644 ops/backup/restpoint-backup.service /etc/systemd/system/
sudo install -m 0644 ops/backup/restpoint-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now restpoint-backup.timer
sudo systemctl start restpoint-backup.service
```
