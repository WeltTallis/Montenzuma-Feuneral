Restpoint Server: Complete Backup & Recovery Guide
This document contains the entire architecture, setup instructions, daily verification commands, and disaster recovery steps for the Restpoint backend server.

📋 Table of Contents
Architecture Overview
Setup Instructions (From Scratch)
Backup Scripts
Automation (Cron Jobs)
Daily Checks & Log Monitoring
🚨 Disaster Recovery Commands
Security & Maintenance
1. Architecture Overview
Server OS: Ubuntu 24.04 (VPS)
Backend Stack: Docker, Node.js/TypeScript, MariaDB, Redis, RabbitMQ
Reverse Proxy: Nginx (Host-level)
File Storage: /opt/storage/uploads/
Local Backups: /opt/backups/db/hourly/ (Retained for 7 days)
Cloud Backups: Cloudflare R2 Bucket named restpoint (S3 API compatible)
2. Setup Instructions (From Scratch)
If you ever need to rebuild this server, follow these exact steps to get the backup system working again.

Step A: Install AWS CLI
Ubuntu 24.04 does not have awscli in its default apt repository. Install it directly from Amazon:

# Download the installercurl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"# Install unzip if you don't have itsudo apt install unzip -y# Unzip and installunzip awscliv2.zipsudo ./aws/install# Verify installationaws --version
Step B: Generate Cloudflare R2 API Keys
Go to the Cloudflare Dashboard -> R2.
Click Manage R2 API Tokens (or "R2 API" in the sidebar).
Click Create API Token.
Name it "Server Backups" and give it Admin Read & Write permissions.
Copy the Access Key ID and Secret Access Key immediately. (Cloudflare hides the secret key forever after you close the window).
3. Backup Scripts
Create these two scripts in your /usr/local/bin/ directory.

Script 1: Database Backup
File: /usr/local/bin/restpoint-db-backup.sh


#!/bin/bash

set -euo pipefail

BACKUP_DIR="/opt/backups/db/hourly"
CONTAINER="restpoint_mariadb"
DB_USER="restpoint_user"
DB_PASSWORD="RestPointUser2024"

# Cloudflare R2 Credentials
export AWS_ACCESS_KEY_ID="a89ff5c1feca0fa3b81ddd2521f81897"
export AWS_SECRET_ACCESS_KEY="5a22e7b33c2448e3659e8c86b3e4042c310b3ff8d1e110a0fa19cf6c44555dac"
export AWS_DEFAULT_REGION="auto"

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

# Keep local hourly backups for 7 days
find "$BACKUP_DIR" \
  -type f \
  -name 'restpoint_full_*.sql.gz' \
  -mtime +7 \
  -delete

# Upload to Cloudflare R2
aws s3 cp "$BACKUP_FILE" s3://restpoint/db-backups/ --endpoint-url https://b2bcf1be8fecc3e94faabecf71798d33.r2.cloudflarestorage.com
echo "$(date '+%Y-%m-%d %H:%M:%S') Uploaded to Cloudflare R2 successfully."





Script 2: Uploads Directory Backup
File: /usr/local/bin/restpoint-uploads-backup.sh


#!/bin/bash

set -euo pipefail

# Cloudflare R2 Credentials
export AWS_ACCESS_KEY_ID="a89ff5c1feca0fa3b81ddd2521f81897"
export AWS_SECRET_ACCESS_KEY="5a22e7b33c2448e3659e8c86b3e4042c310b3ff8d1e110a0fa19cf6c44555dac"
export AWS_DEFAULT_REGION="auto"

UPLOAD_DIR="/opt/storage/uploads"

echo "$(date '+%Y-%m-%d %H:%M:%S') Starting uploads backup to Cloudflare R2..."

# Sync the uploads directory to R2 (only uploads new/changed files)
aws s3 sync "$UPLOAD_DIR" s3://restpoint/uploads-backups/ --endpoint-url https://b2bcf1be8fecc3e94faabecf71798d33.r2.cloudflarestorage.com

echo "$(date '+%Y-%m-%d %H:%M:%S') Uploads backup completed successfully."

Make Scripts Executable



sudo chmod 700 /usr/local/bin/restpoint-db-backup.sh
sudo chmod 700 /usr/local/bin/restpoint-uploads-backup.sh


4. Automation (Cron Jobs)
Open the crontab editor:

crontab -e

Paste these two lines at the bottom to run the backups automatically:


# Run database backup every hour at minute 0
0 * * * * /usr/local/bin/restpoint-db-backup.sh >> /var/log/restpoint-db-backup.log 2>&1

# Run uploads backup every night at 2:00 AM
0 2 * * * /usr/local/bin/restpoint-uploads-backup.sh >> /var/log/restpoint-uploads-backup.log 2>&1



5. Daily Checks & Log Monitoring
Check if Cron is running

systemctl is-active cron


Check Backup Logs
To see the most recent 20 lines of your backup logs (to confirm they are running without errors):

# Database logs
tail -20 /var/log/restpoint-db-backup.log

# Uploads logs
tail -20 /var/log/restpoint-uploads-backup.log



List Local Backup Files

ls -lh /opt/backups/db/hourly/


List Files in Cloudflare R2
If you need to verify your files made it to the cloud, use the AWS CLI:


export AWS_ACCESS_KEY_ID="a89ff5c1feca0fa3b81ddd2521f81897"
export AWS_SECRET_ACCESS_KEY="5a22e7b33c2448e3659e8c86b3e4042c310b3ff8d1e110a0fa19cf6c44555dac"
export AWS_DEFAULT_REGION="auto"

# List Database backups in R2
aws s3 ls s3://restpoint/db-backups/ --endpoint-url https://b2bcf1be8fecc3e94faabecf71798d33.r2.cloudflarestorage.com

# List Uploads in R2
aws s3 ls s3://restpoint/uploads-backups/ --endpoint-url https://b2bcf1be8fecc3e94faabecf71798d33.r2.cloudflarestorage.com --recursive | head -20




Manually Delete a Local Backup (If disk space is low)

rm -f /opt/backups/db/hourly/restpoint_full_20260909_112016.sql.gz



6. 🚨 Disaster Recovery Commands
If your server crashes, database gets corrupted, or you accidentally delete user files, follow these steps.

Scenario A: Restore Database from a LOCAL Backup
Use this if the server is fine, but you need to roll back the database to a few hours ago.

Find the backup file you want to restore


ls -lh /opt/backups/db/hourly/


Restore it (Replace FILENAME.sql.gz with the actual file, and ROOT_PASSWORD with your MariaDB root password  



gunzip -c /opt/backups/db/hourly/FILENAME.sql.gz | docker exec -i restpoint_mariadb mariadb -u root -pROOT_PASSWORD 

    

Scenario B: Restore Database from CLOUDFLARE R2
Use this if your server is completely rebuilt and you need to pull the latest database backup from the cloud.

 Set up your R2 credentials on the new server: 


 export AWS_ACCESS_KEY_ID="a89ff5c1feca0fa3b81ddd2521f81897"
export AWS_SECRET_ACCESS_KEY="5a22e7b33c2448e3659e8c86b3e4042c310b3ff8d1e110a0fa19cf6c44555dac"
export AWS_DEFAULT_REGION="auto"



aws s3 cp s3://restpoint/db-backups/FILENAME.sql.gz . --endpoint-url https://b2bcf1be8fecc3e94faabecf71798d33.r2.cloudflarestorage.com




Scenario C: Restore Uploads/Files from CLOUDFLARE R2
Use this if your server was rebuilt and you need to download all user documents, images, and invoices.

Set up your R2 credentials on the new server (same as above).
Create the uploads directory if it doesn't exist:


mkdir -p /opt/storage/uploads 


Download (sync) everything from R2 back to your server: 


aws s3 sync s3://restpoint/uploads-backups/ /opt/storage/uploads/ --endpoint-url https://b2bcf1be8fecc3e94faabecf71798d33.r2.cloudflarestorage.com




7. Security & Maintenance
Cloudflare R2 Lifecycle Rules
Because your database backs up every hour, your R2 bucket will grow infinitely.
Recommended: Go to your Cloudflare R2 bucket settings -> "Object Lifecycle Rules" and create a rule to Delete objects after 30 or 90 days for the db-backups/ prefix. This prevents you from paying for infinite storage.

Nginx Security (Block .env files)
Automated bots constantly scan the internet for exposed .env files. Ensure you have this block in your Nginx configuration (usually inside /etc/nginx/sites-available/your-site): 



location ~ /\. {
    deny all;
    return 404;
} 



(Run sudo nginx -t and sudo systemctl reload nginx after making Nginx changes).





LOGS   ROTATION  

sudo nano /etc/logrotate.d/restpoint-backups 


/var/log/restpoint-db-backup.log /var/log/restpoint-uploads-backup.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
}




encrypted   .envs   aws s3 cp .env.gpg s3://restpoint/server-configs/ --endpoint-url https://b2bcf1be8fecc3e94faabecf71798d33.r2.cloudflarestorage.com