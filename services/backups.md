Restpoint Server: Complete Backup & Recovery Guide
This document describes the complete backup, verification, restore, and disaster-recovery procedure for the Restpoint backend server.

The procedure is designed for rebuilding the server from scratch and restoring:

MariaDB databases

User uploads and documents

Docker services

Cloudflare R2 backups

Backup automation

Backup monitoring

Nginx protection

Docker configuration

Backup log rotation

Table of Contents
Architecture Overview

Backup Architecture

Initial Server Preparation

Install AWS CLI

Configure Cloudflare R2 Credentials

Verify R2 Access

Create Backup Directories

Database Backup Script

Uploads Backup Script

Make Backup Scripts Executable

Test Database Backup Manually

Test Upload Backup Manually

Configure Cron Automation

Verify Automated Backups

Cloudflare R2 Verification

Local Backup Retention

Daily Backup Checks

Disaster Recovery Overview

Disaster Recovery: Rebuild Server

Disaster Recovery: Restore R2 Database Backup

Disaster Recovery: Restore Uploads

Disaster Recovery: Fresh MariaDB Recovery

Disaster Recovery: Verify Database

Disaster Recovery: Start Restpoint Services

Docker Configuration

Nginx Security

Backup Log Rotation

Cloudflare R2 Lifecycle Rules

Environment File Backup

Docker Snap Prevention

Prevent Automatic Docker Package Upgrades

Final Disaster-Recovery Checklist

1. Architecture Overview
   Server
   OS: Ubuntu 24.04

Application: Restpoint

Backend: Node.js / TypeScript

Containers: Docker / Docker Compose

Database: MariaDB 10.11

Cache: Redis

Message broker: RabbitMQ

Reverse proxy: Nginx

File storage: /opt/storage/uploads/

Backup locations
Local database backups
/opt/backups/db/hourly/

Local database backups are retained for approximately 7 days.

Cloud database backups
Cloudflare R2
Bucket: restpoint
Prefix: db-backups/

Cloud uploads backups
Cloudflare R2
Bucket: restpoint
Prefix: uploads-backups/

2. Backup Architecture
   Restpoint uses two independent backup mechanisms.

Database backups
The MariaDB server is dumped every hour.

The backup flow is:

MariaDB
|
v
mariadb-dump
|
v
gzip
|
v
/opt/backups/db/hourly/
|
v
Cloudflare R2
s3://restpoint/db-backups/

Each database backup is a compressed .sql.gz file.

Example:

restpoint_full_20260930_110002.sql.gz

Upload backups
The uploads directory is synchronized to Cloudflare R2 every night.

/opt/storage/uploads/
|
v
AWS CLI / S3 sync
|
v
Cloudflare R2
s3://restpoint/uploads-backups/

3. Initial Server Preparation
   After rebuilding the VPS, update Ubuntu:

apt update
apt upgrade -y

Install basic tools:

apt install -y \
 curl \
 unzip \
 git \
 ca-certificates \
 gnupg \
 lsb-release

Verify the OS:

cat /etc/os-release

Expected:

Ubuntu 24.04

4. Install AWS CLI
   Cloudflare R2 provides an S3-compatible API, so the AWS CLI can be used to upload and download backups.

Download AWS CLI:

cd /tmp

curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" \
 -o awscliv2.zip

Install unzip:

apt install -y unzip

Extract:

unzip -q awscliv2.zip

Install:

./aws/install

Verify:

aws --version

Expected output should contain something similar to:

aws-cli/2.x.x

5. Configure Cloudflare R2 Credentials
   Cloudflare R2 requires:

Account ID
Access Key ID
Secret Access Key
S3 API endpoint

The endpoint has this format:

https://ACCOUNT_ID.r2.cloudflarestorage.com

For this Restpoint deployment, the bucket is:

restpoint

IMPORTANT SECURITY RULE
Do NOT put real R2 credentials directly into:

.git
docker-compose.yml
GitHub
public documentation
shell history

Use environment variables or a protected credentials file.

If credentials are accidentally exposed, revoke them and create a new R2 API token.

6. Verify R2 Access
   Set the credentials for the current shell:

export AWS_ACCESS_KEY_ID="YOUR_R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="YOUR_R2_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="auto"

Set the endpoint:

export R2_ENDPOINT="https://ACCOUNT_ID.r2.cloudflarestorage.com"

Test the bucket:

aws s3 ls s3://restpoint/ \
 --endpoint-url "$R2_ENDPOINT"

If credentials are correct, the command should return the bucket contents or prefixes.

List database backups:

aws s3 ls s3://restpoint/db-backups/ \
 --endpoint-url "$R2_ENDPOINT"

List upload backups:

aws s3 ls s3://restpoint/uploads-backups/ \
 --endpoint-url "$R2_ENDPOINT" \
 --recursive | head -20

7. Create Backup Directories
   Create all required directories:

mkdir -p /opt/backups/db/hourly
mkdir -p /opt/storage/uploads
mkdir -p /usr/local/bin

Verify:

ls -ld \
 /opt/backups/db/hourly \
 /opt/storage/uploads \
 /usr/local/bin

8. Database Backup Script
   Create:

nano /usr/local/bin/restpoint-db-backup.sh

Use the following script:

#!/bin/bash

set -euo pipefail

BACKUP_DIR="/opt/backups/db/hourly"
CONTAINER="restpoint_mariadb"

DB_USER="restpoint_user"
DB_PASSWORD="YOUR_RESTPOINT_DB_PASSWORD"

R2_BUCKET="restpoint"
R2_PREFIX="db-backups"
R2_ENDPOINT="https://ACCOUNT_ID.r2.cloudflarestorage.com"

TIMESTAMP="$(date +%Y%m%d\_%H%M%S)"

BACKUP*FILE="${BACKUP_DIR}/restpoint_full*${TIMESTAMP}.sql.gz"
TEMP_FILE="${BACKUP_FILE}.tmp"

mkdir -p "$BACKUP_DIR"

echo "$(date '+%Y-%m-%d %H:%M:%S') Starting database backup..."

if ! docker inspect "$CONTAINER" >/dev/null 2>&1; then
echo "ERROR: Docker container $CONTAINER does not exist" >&2
exit 1
fi

if ! docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null | grep -q true; then
echo "ERROR: Docker container $CONTAINER is not running" >&2
exit 1
fi

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

    echo "$(date '+%Y-%m-%d %H:%M:%S') Backup created: $BACKUP_FILE"

else

    echo "$(date '+%Y-%m-%d %H:%M:%S') BACKUP FAILED" >&2

    rm -f "$TEMP_FILE"

    exit 1

fi

echo "$(date '+%Y-%m-%d %H:%M:%S') Uploading backup to Cloudflare R2..."

aws s3 cp \
 "$BACKUP_FILE" \
    "s3://${R2_BUCKET}/${R2_PREFIX}/" \
    --endpoint-url "$R2_ENDPOINT"

echo "$(date '+%Y-%m-%d %H:%M:%S') Cloud backup uploaded successfully."

# Delete local database backups older than 7 days.

find "$BACKUP*DIR" \
 -type f \
 -name 'restpoint_full*\*.sql.gz' \
 -mtime +7 \
 -delete

echo "$(date '+%Y-%m-%d %H:%M:%S') Database backup completed."

IMPORTANT
Replace:

YOUR_RESTPOINT_DB_PASSWORD

and:

ACCOUNT_ID

with the correct values.

Do not put the R2 secret directly inside this script.

9. Uploads Backup Script
   Create:

nano /usr/local/bin/restpoint-uploads-backup.sh

Use:

#!/bin/bash

set -euo pipefail

UPLOAD_DIR="/opt/storage/uploads"

R2_BUCKET="restpoint"
R2_PREFIX="uploads-backups"
R2_ENDPOINT="https://ACCOUNT_ID.r2.cloudflarestorage.com"

echo "$(date '+%Y-%m-%d %H:%M:%S') Starting uploads backup..."

if [ ! -d "$UPLOAD_DIR" ]; then
echo "ERROR: Upload directory does not exist: $UPLOAD_DIR" >&2
exit 1
fi

aws s3 sync \
 "$UPLOAD_DIR/" \
    "s3://${R2_BUCKET}/${R2_PREFIX}/" \
    --endpoint-url "$R2_ENDPOINT"

echo "$(date '+%Y-%m-%d %H:%M:%S') Uploads backup completed successfully."

10. Make Backup Scripts Executable
    Run:

chmod 700 /usr/local/bin/restpoint-db-backup.sh
chmod 700 /usr/local/bin/restpoint-uploads-backup.sh

Verify:

ls -l /usr/local/bin/restpoint-\*-backup.sh

Expected:

-rwx------ ...

11. Test Database Backup Manually
    Before configuring cron, always test the backup manually.

Make sure MariaDB is running:

docker ps --filter name=restpoint_mariadb

Then run:

/usr/local/bin/restpoint-db-backup.sh

Check the local backup:

ls -lh /opt/backups/db/hourly/

Test the gzip file:

gzip -t /opt/backups/db/hourly/restpoint*full*\*.sql.gz

If there is no output, the gzip test succeeded.

Check R2:

aws s3 ls s3://restpoint/db-backups/ \
 --endpoint-url "$R2_ENDPOINT"

The newest backup should appear.

12. Test Upload Backup Manually
    Make sure the uploads directory exists:

mkdir -p /opt/storage/uploads

Run:

/usr/local/bin/restpoint-uploads-backup.sh

Verify R2:

aws s3 ls s3://restpoint/uploads-backups/ \
 --endpoint-url "$R2_ENDPOINT" \
 --recursive | head -20

13. Configure Cron Automation
    Open root's crontab:

crontab -e

Add:

# Restpoint database backup - every hour

0 \* \* \* \* /usr/local/bin/restpoint-db-backup.sh >> /var/log/restpoint-db-backup.log 2>&1

# Restpoint uploads backup - every night at 02:00

0 2 \* \* \* /usr/local/bin/restpoint-uploads-backup.sh >> /var/log/restpoint-uploads-backup.log 2>&1

Save and exit.

Verify:

crontab -l

14. Verify Automated Backups
    Check cron:

systemctl is-active cron

Expected:

active

Check cron service:

systemctl status cron --no-pager

After the scheduled job runs, inspect the logs:

tail -20 /var/log/restpoint-db-backup.log

Uploads:

tail -20 /var/log/restpoint-uploads-backup.log

15. Cloudflare R2 Verification
    List database backups:

aws s3 ls s3://restpoint/db-backups/ \
 --endpoint-url "$R2_ENDPOINT"

Example:

2026-09-30 10:00:09 1311045 restpoint_full_20260930_100002.sql.gz
2026-09-30 11:00:12 1312016 restpoint_full_20260930_110002.sql.gz

List uploads:

aws s3 ls s3://restpoint/uploads-backups/ \
 --endpoint-url "$R2_ENDPOINT" \
 --recursive | head -50

16. Local Backup Retention
    The database backup script automatically deletes local backups older than 7 days.

Manually inspect:

ls -lh /opt/backups/db/hourly/

To manually delete one known backup:

rm -f /opt/backups/db/hourly/FILENAME.sql.gz

Do not delete the only remaining copy of a backup unless the cloud copy has been verified.

17. Daily Backup Checks
    Run these checks regularly.

Check Docker
docker ps

Check MariaDB
docker ps --filter name=restpoint_mariadb

Expected status:

healthy

Check local backups
ls -lh /opt/backups/db/hourly/

Check database backup log
tail -20 /var/log/restpoint-db-backup.log

Check uploads backup log
tail -20 /var/log/restpoint-uploads-backup.log

Check R2 database backups
aws s3 ls s3://restpoint/db-backups/ \
 --endpoint-url "$R2_ENDPOINT"

Check R2 uploads
aws s3 ls s3://restpoint/uploads-backups/ \
 --endpoint-url "$R2_ENDPOINT" \
 --recursive | tail

18. Disaster Recovery Overview
    If the server is destroyed or the database is lost, recovery should happen in this order:

1. Rebuild Ubuntu
   |
   v
1. Install Docker
   |
   v
1. Clone Restpoint source
   |
   v
1. Install AWS CLI
   |
   v
1. Configure R2 credentials
   |
   v
1. Restore uploads from R2
   |
   v
1. Create clean MariaDB
   |
   v
1. Download database backup
   |
   v
1. Restore database
   |
   v
1. Verify databases/tables
   |
   v
1. Start Redis/RabbitMQ
   |
   v
1. Start Restpoint services
   |
   v
1. Verify application
   |
   v
1. Re-enable automated backups

1. Disaster Recovery: Rebuild Server
   After receiving a clean Ubuntu 24.04 VPS:

apt update
apt upgrade -y

Install required packages:

apt install -y \
 curl \
 unzip \
 git \
 ca-certificates \
 gnupg \
 lsb-release

Install Docker according to the project's Docker installation procedure.

Verify:

docker --version
docker compose version

20. Disaster Recovery: Clone Restpoint
    Clone the repository using the appropriate GitHub authentication method.

For HTTPS:

cd /opt
git clone https://github.com/OWNER/restpoint.git

Or using SSH:

cd /opt
git clone git@github.com:OWNER/restpoint.git

Enter the project:

cd /opt/restpoint

Verify:

ls -la

21. Disaster Recovery: Install AWS CLI
    cd /tmp

curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" \
 -o awscliv2.zip

apt install -y unzip

unzip -q awscliv2.zip

./aws/install

aws --version

22. Disaster Recovery: Configure R2 Credentials
    Set:

export AWS_ACCESS_KEY_ID="YOUR_NEW_R2_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="YOUR_NEW_R2_SECRET_KEY"
export AWS_DEFAULT_REGION="auto"

export R2_ENDPOINT="https://ACCOUNT_ID.r2.cloudflarestorage.com"

Test:

aws s3 ls s3://restpoint/db-backups/ \
 --endpoint-url "$R2_ENDPOINT"

23. Disaster Recovery: Restore Database Backup from R2
    Create the local backup directory:

mkdir -p /opt/backups/db/hourly

List available backups:

aws s3 ls s3://restpoint/db-backups/ \
 --endpoint-url "$R2_ENDPOINT"

Choose the backup to restore.

For example:

restpoint_full_20260930_110002.sql.gz

Download it:

aws s3 cp \
 s3://restpoint/db-backups/restpoint_full_20260930_110002.sql.gz \
 /opt/backups/db/hourly/ \
 --endpoint-url "$R2_ENDPOINT"

Verify:

ls -lh /opt/backups/db/hourly/

Test the gzip archive:

gzip -t /opt/backups/db/hourly/restpoint_full_20260930_110002.sql.gz

24. Disaster Recovery: Restore Uploads from R2
    Create the directory:

mkdir -p /opt/storage/uploads

Restore everything:

aws s3 sync \
 s3://restpoint/uploads-backups/ \
 /opt/storage/uploads/ \
 --endpoint-url "$R2_ENDPOINT"

This may take time depending on the number and size of files.

Check:

find /opt/storage/uploads -type f | head

Count files:

find /opt/storage/uploads -type f | wc -l

25. Disaster Recovery: Start Only MariaDB First
    Do NOT immediately start all Restpoint services.

First start only MariaDB:

cd /opt/restpoint

docker compose up -d mariadb

Wait:

sleep 20

Check:

docker ps --filter name=restpoint_mariadb

The status should eventually show:

healthy

Check logs:

docker logs restpoint_mariadb --tail 50

26. IMPORTANT: MariaDB Initialization Files
    During recovery, check:

ls -la /opt/restpoint/docker/mariadb/

If an initialization SQL file contains an incompatible GRANT statement and prevents MariaDB initialization, fix the initialization file before recreating the MariaDB volume.

For example:

docker logs restpoint_mariadb --tail 100

Look for errors such as:

ERROR 1064

or:

ERROR 1005

Do not restore a database into a MariaDB instance that failed initialization.

27. Fresh MariaDB Recovery
    If MariaDB contains partially restored or incorrect data, stop the Restpoint stack:

docker compose stop

Verify MariaDB stopped:

docker ps --filter name=restpoint_mariadb

Remove the MariaDB container:

docker rm -f restpoint_mariadb

Find the MariaDB volume:

docker volume ls | grep mariadb

If the intended recovery is a complete replacement of the new empty MariaDB database, remove only the newly created MariaDB data volume:

docker volume rm restpoint_mariadb_data

Then recreate MariaDB:

docker compose up -d mariadb

Wait:

sleep 20

Check:

docker ps --filter name=restpoint_mariadb

Expected:

healthy

28. Disaster Recovery: Restore the Full SQL Backup
    Once MariaDB is healthy:

gunzip -c \
 /opt/backups/db/hourly/restpoint_full_20260930_110002.sql.gz \
 | docker exec -i restpoint_mariadb \
 mariadb -u root -pYOUR_ROOT_PASSWORD

Replace:

YOUR_ROOT_PASSWORD

with the actual MariaDB root password.

For the Restpoint configuration described in this deployment:

RestPointRoot2024

should only be used if that is still the current configured password.

29. IMPORTANT: Do Not Restore into a Partially Restored Database
    A full backup contains multiple databases.

If a previous restore failed halfway through, do not simply run the same restore again on top of the partially populated database.

Instead:

STOP
|
v
Stop application services
|
v
Create clean MariaDB data volume
|
v
Start MariaDB
|
v
Verify healthy
|
v
Restore complete .sql.gz

This avoids problems caused by:

Existing tables

Existing foreign keys

Existing databases

Duplicate records

Partially restored schemas

Foreign-key constraint errors

30. Verify Database Restoration
    After the restore completes, check:

docker exec restpoint_mariadb \
 mariadb -u root -pYOUR_ROOT_PASSWORD \
 -e "SHOW DATABASES;"

The restored databases should appear.

For example:

information_schema
lee-feuneral-home
montenzuma-monalisa-feuneral-home
montenzuma-monalisa-feuneral-home-machakos
montenzuma-monalisa-feuneral-home-thika
mysql
performance_schema
restpoint_coffin
restpoint_main
restpoint_operations
support_db
sys
tenant_tracking

The exact list depends on the backup selected.

31. Verify Main Database Tables
    Run:

docker exec restpoint_mariadb \
 mariadb -u root -pYOUR_ROOT_PASSWORD \
 -e "SHOW TABLES FROM restpoint_main;"

Count tables:

docker exec restpoint_mariadb \
 mariadb -u root -pYOUR_ROOT_PASSWORD \
 -e "
SELECT COUNT(\*) AS tables_count
FROM information_schema.tables
WHERE table_schema='restpoint_main';
"

32. Verify Tenant Tracking
    Run:

docker exec restpoint_mariadb \
 mariadb -u root -pYOUR_ROOT_PASSWORD \
 -e "SHOW TABLES FROM tenant_tracking;"

For example:

branches
provisioning_status
tenants

Check tenants:

docker exec restpoint_mariadb \
 mariadb -u root -pYOUR_ROOT_PASSWORD \
 -e "SELECT \* FROM tenant_tracking.tenants;"

33. Verify Individual Tenant Databases
    List all databases:

docker exec restpoint_mariadb \
 mariadb -u root -pYOUR_ROOT_PASSWORD \
 -e "SHOW DATABASES;"

Then inspect an individual tenant:

docker exec restpoint_mariadb \
 mariadb -u root -pYOUR_ROOT_PASSWORD \
 -e "SHOW TABLES FROM \`lee-feuneral-home\`;"

Repeat for the other tenant databases as required.

34. Disaster Recovery: Start Redis and RabbitMQ
    Once MariaDB is restored and verified:

docker compose up -d redis rabbitmq

Check:

docker ps

Wait until both are healthy.

35. Disaster Recovery: Start Restpoint Services
    Only after the database has been verified:

docker compose up -d

Check:

docker ps -a

Look for:

Up

and:

healthy

Investigate anything showing:

Restarting

or:

Exited

36. Check Services That Are Restarting
    For example:

docker logs restpoint_store_service --tail 100

Or:

docker logs restpoint_hearse_service --tail 100

Or:

docker logs restpoint_documents_service --tail 100

Do not assume a restarting service is a database problem. Check its actual logs.

37. Verify Upload Files
    Check:

find /opt/storage/uploads -type f | head -20

Count:

find /opt/storage/uploads -type f | wc -l

Check disk usage:

du -sh /opt/storage/uploads

38. Verify Docker Volumes
    List:

docker volume ls

Inspect MariaDB:

docker inspect restpoint_mariadb \
 --format '{{range .Mounts}}{{println .Type .Name .Source .Destination}}{{end}}'

The MariaDB data directory should point to the Docker volume:

/var/lib/mysql

39. Docker Configuration
    Check which Docker executable is being used:

which -a docker

Check Docker:

docker --version

Check Compose:

docker compose version

Check Docker root:

docker info | grep -E 'Docker Root|Server Version'

40. Prevent Docker Snap Conflicts
    If Docker was installed through the official Docker packages, verify that Snap Docker is not also installed.

Check:

snap list | grep -i docker

If an unwanted Snap Docker installation exists:

systemctl disable snap.docker.dockerd.service
systemctl mask snap.docker.dockerd.service
snap remove --purge docker

Then verify:

which -a docker

Check:

systemctl status docker --no-pager

41. Docker Compose Project Name
    The Compose project should have an explicit name.

At the top level of docker-compose.yml:

name: restpoint

Example:

name: restpoint

services:
mariadb:
...

Do not put:

restart: unless-stopped

at the top level.

restart belongs inside an individual service definition.

Example:

services:
mariadb:
restart: unless-stopped

42. Nginx Security
    Protect hidden files such as .env.

Inside the appropriate Nginx server configuration:

location ~ /\. {
deny all;
return 404;
}

Test configuration:

nginx -t

If successful:

systemctl reload nginx

43. Backup Log Rotation
    Create:

nano /etc/logrotate.d/restpoint-backups

Use:

/var/log/restpoint-db-backup.log
/var/log/restpoint-uploads-backup.log {
weekly
rotate 4
compress
missingok
notifempty
}

Test:

logrotate -d /etc/logrotate.d/restpoint-backups

44. Environment File Backup
    If encrypted environment files are used, they can be stored in R2.

Example:

aws s3 cp \
 .env.gpg \
 s3://restpoint/server-configs/.env.gpg \
 --endpoint-url "$R2_ENDPOINT"

Never upload an unencrypted production .env file unless the security model explicitly permits it.

Never commit .env files containing secrets to Git.

45. Cloudflare R2 Lifecycle Rules
    Database backups are created hourly.

Without lifecycle management, the number of backups can grow indefinitely.

Configure a Cloudflare R2 lifecycle rule for:

db-backups/

A typical retention policy might be:

Delete database backups after 30 days

or:

Delete database backups after 90 days

Choose the retention period appropriate for the application's recovery requirements.

Before enabling deletion, verify that the retention period is sufficient.

46. R2 Backup Integrity Check
    A backup is not considered trustworthy merely because it exists in R2.

Periodically download a backup:

aws s3 cp \
 s3://restpoint/db-backups/FILENAME.sql.gz \
 /tmp/test-backup.sql.gz \
 --endpoint-url "$R2_ENDPOINT"

Test:

gzip -t /tmp/test-backup.sql.gz

If successful, remove the temporary file:

rm -f /tmp/test-backup.sql.gz

For stronger verification, periodically perform a complete restore test on a separate recovery environment.

47. Test Recovery Procedure
    A backup system should periodically be tested.

A complete test should verify:

R2 database backup
|
v
Download
|
v
Fresh MariaDB
|
v
SQL restore
|
v
Database verification
|
v
Application startup

Do not wait until a real disaster to discover that a backup cannot be restored.

48. Common Recovery Errors
    Error: container is not running
    Example:

Error response from daemon:
container ... is not running

Check:

docker ps -a --filter name=restpoint_mariadb

Start:

docker start restpoint_mariadb

Then verify:

docker ps --filter name=restpoint_mariadb

Error: foreign-key constraint
Example:

ERROR 1005 (HY000):
Can't create table ... errno: 150
Foreign key constraint is incorrectly formed

Do not immediately retry the same restore.

This can happen when the database already contains partially restored or incompatible schema objects.

For a complete recovery replacement:

Stop application
|
v
Stop MariaDB
|
v
Remove the new MariaDB data volume
|
v
Create clean MariaDB
|
v
Wait for healthy
|
v
Restore complete backup

Error: R2 credential length
Example:

Credential access key has length 15, should be 32

This usually means placeholder credentials such as:

YOUR_ACCESS_KEY

were used.

Set the actual R2 Access Key ID:

export AWS_ACCESS_KEY_ID="REAL_ACCESS_KEY"

and Secret:

export AWS_SECRET_ACCESS_KEY="REAL_SECRET_KEY"

Then retry:

aws s3 ls s3://restpoint/db-backups/ \
 --endpoint-url "$R2_ENDPOINT"

49. Final Disaster-Recovery Checklist
    Server
    apt update
    apt upgrade -y

Docker
docker --version
docker compose version

Source
cd /opt/restpoint
git status

R2
aws s3 ls s3://restpoint/db-backups/ \
 --endpoint-url "$R2_ENDPOINT"

Uploads
mkdir -p /opt/storage/uploads

aws s3 sync \
 s3://restpoint/uploads-backups/ \
 /opt/storage/uploads/ \
 --endpoint-url "$R2_ENDPOINT"

Database
docker compose up -d mariadb

Wait:

sleep 20

Verify:

docker ps --filter name=restpoint_mariadb

Restore
gunzip -c \
 /opt/backups/db/hourly/FILENAME.sql.gz \
 | docker exec -i restpoint_mariadb \
 mariadb -u root -pYOUR_ROOT_PASSWORD

Verify
docker exec restpoint_mariadb \
 mariadb -u root -pYOUR_ROOT_PASSWORD \
 -e "SHOW DATABASES;"

Redis/RabbitMQ
docker compose up -d redis rabbitmq

Application
docker compose up -d

Services
docker ps -a

Upload files
find /opt/storage/uploads -type f | wc -l

Backups
/usr/local/bin/restpoint-db-backup.sh

R2
aws s3 ls s3://restpoint/db-backups/ \
 --endpoint-url "$R2_ENDPOINT"

50. Emergency Recovery Quick Reference
    If the server is completely lost, the short version is:

# 1. Install Docker and AWS CLI

# 2. Clone application

cd /opt
git clone YOUR_RESTPOINT_REPOSITORY
cd /opt/restpoint

# 3. Configure R2

export AWS_ACCESS_KEY_ID="YOUR_R2_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="YOUR_R2_SECRET"
export AWS_DEFAULT_REGION="auto"
export R2_ENDPOINT="https://ACCOUNT_ID.r2.cloudflarestorage.com"

# 4. Download latest database backup

mkdir -p /opt/backups/db/hourly

aws s3 ls s3://restpoint/db-backups/ \
 --endpoint-url "$R2_ENDPOINT"

aws s3 cp \
 s3://restpoint/db-backups/FILENAME.sql.gz \
 /opt/backups/db/hourly/ \
 --endpoint-url "$R2_ENDPOINT"

# 5. Restore uploads

mkdir -p /opt/storage/uploads

aws s3 sync \
 s3://restpoint/uploads-backups/ \
 /opt/storage/uploads/ \
 --endpoint-url "$R2_ENDPOINT"

# 6. Start only MariaDB

docker compose up -d mariadb

# 7. Wait for healthy

sleep 20

docker ps --filter name=restpoint_mariadb

# 8. Restore database

gunzip -c \
 /opt/backups/db/hourly/FILENAME.sql.gz \
 | docker exec -i restpoint_mariadb \
 mariadb -u root -pYOUR_ROOT_PASSWORD

# 9. Verify databases

docker exec restpoint_mariadb \
 mariadb -u root -pYOUR_ROOT_PASSWORD \
 -e "SHOW DATABASES;"

# 10. Start infrastructure

docker compose up -d redis rabbitmq

# 11. Start application

docker compose up -d

# 12. Verify

docker ps -a

51. Backup Philosophy
    Restpoint should maintain multiple copies of important data:

Production MariaDB
|
+---- Local hourly backup
|
+---- Cloudflare R2 backup

And:

/opt/storage/uploads/
|
+---- Cloudflare R2 uploads-backups/

The important principle is:

A backup is only considered successful when it can be downloaded, decompressed, and restored successfully.

Therefore, periodically test both:

Database restoration

Upload restoration

This ensures that the Restpoint server can be rebuilt even after complete loss of the VPS.

52. Security Notes
    Never store production secrets in Git.

Never publish:

AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
DATABASE_PASSWORD
DB_ROOT_PASSWORD
.env

If credentials are exposed:

Revoke the exposed credential.

Create a new R2 credential.

Update the server.

Test R2 access.

Update any backup automation.

Remove the old credential.

Keep the recovery documentation free of real secrets.

Use placeholders such as:

YOUR_R2_ACCESS_KEY
YOUR_R2_SECRET_KEY
YOUR_ROOT_PASSWORD
ACCOUNT_ID

This document should therefore be safe to keep in the Restpoint repository.
