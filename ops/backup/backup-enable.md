sudo systemctl enable --now restpoint-backup.timer
sudo systemctl start restpoint-backup.service



Start hourly backups:

sudo systemctl daemon-reload
sudo systemctl enable --now restpoint-backup.timer
sudo systemctl start restpoint-backup.service



Check status:


systemctl list-timers restpoint-backup.timer
sudo journalctl -u restpoint-backup.service -n 100 --no-pager

Test the latest R2 backup:
ops/backup/backup-restore-test.sh



Restore from R2:

CONFIRM_RESTORE=YES \
BACKUP_STAMP=20261117T020000Z \
ops/backup/restore-from-r2.sh



Restore uploads too:

CONFIRM_RESTORE=YES \
RESTORE_UPLOADS=YES \
BACKUP_STAMP=20261117T020000Z \
ops/backup/restore-from-r2.sh


Restore from local backup:


CONFIRM_RESTORE=YES \
BACKUP_SOURCE=local \
BACKUP_DIR=/opt/backups/restpoint \
BACKUP_STAMP=20261117T020000Z \
ops/backup/restore-from-r2.sh


