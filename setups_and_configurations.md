
//clone  firts   
git clone https://github.com/imbitheesther-art/restpoint.git



//on server   
sudo apt update
sudo apt upgrade -y


//install all depedencies  


1. ca-certificates
Provides trusted security certificates.

Allows your server to verify secure HTTPS connections.

Helps ensure downloads from Docker's official website are trusted.

2. curl
A command-line tool for downloading data from URLs.

Docker installation uses it to download Docker's GPG signing key.

sudo apt install ca-certificates curl gnupg -y



 3. Add Docker's official GPG key


sudo install -m 0755 -d /etc/apt/keyrings

sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
-o /etc/apt/keyrings/docker.asc 

sudo chmod a+r /etc/apt/keyrings/docker.asc


//Dcoker   Repository 
echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
$(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null




//install  docker  
sudo apt update

sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

//  Start  Docker   
sudo systemctl start docker
sudo systemctl enable docker


//  install make   and  nginix  
sudo apt update
sudo apt install make -y  


sudo apt install nginx -y 

sudo systemctl start nginx 

sudo systemctl enable nginx
sudo apt update

sudo apt install -y \
make \
nginx \
curl \
ca-certificates \
gnupg 

// Before building, update the checkout so it includes the build helper used by Makefile.
cd /opt/restpoint
git pull --ff-only
test -f scripts/list-build-services.sh

// If the test fails, this checkout is missing the required helper. Update to the commit
// that adds it, then retry:
make build



/./  host  nginix and  cert boats 



sudo apt update
sudo apt install -y nginx certbot
sudo mkdir -p /var/www/certbot/.well-known/acme-challenge  

sudo tee /etc/nginx/sites-available/restpoint >/dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name restpoint.co.ke www.restpoint.co.ke app.restpoint.co.ke portal.restpoint.co.ke paymontenzuma.restpoint.co.ke;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 404;
    }
}
EOF

sudo ln -sfn /etc/nginx/sites-available/restpoint /etc/nginx/sites-enabled/restpoint
sudo nginx -t && sudo systemctl enable --now nginx && sudo systemctl reload nginx

sudo certbot certonly --webroot \
  -w /var/www/certbot \
  --cert-name restpoint.co.ke \
  -d restpoint.co.ke \
  -d www.restpoint.co.ke \
  -d app.restpoint.co.ke \
  -d portal.restpoint.co.ke \
  -d paymontenzuma.restpoint.co.ke \
  --email YOUR_EMAIL \
  --agree-tos \
  --no-eff-email 


  cd /opt/restpoint
sudo cp nginx-host.conf /etc/nginx/sites-available/restpoint
sudo nginx -t && sudo systemctl reload nginx
sudo certbot renew --dry-run


sudo ufw allow 'Nginx Full' 

cd /opt/restpoint
docker compose -f docker-compose.prod.yml ps 



//  install and  setup  fail  2  ban 
sudo apt update
sudo apt install fail2ban -y


enable it 
sudo systemctl enable fail2ban
sudo systemctl start fail2ban


status  sudo systemctl status fail2ban


sudo nano /etc/fail2ban/jail.d/sshd.local 

[sshd]
enabled = true
backend = systemd
port = ssh

maxretry = 5
findtime = 10m
bantime = -1 

sudo fail2ban-client -t 

sudo systemctl restart fail2ban 

sudo fail2ban-client status sshd 

sudo fail2ban-client status sshd

sudo fail2ban-client get sshd bantime

//install  UFW  
sudo apt update
sudo apt install ufw -y


sudo ufw allow 22/tcp

sudo ufw allow 80/tcp
sudo ufw allow 443/tcp


sudo ufw deny 3306/tcp
sudo ufw deny 5432/tcp
sudo ufw deny 27017/tcp
sudo ufw deny 27018/tcp
sudo ufw deny 6379/tcp
sudo ufw deny 9200/tcp
sudo ufw deny 11211/tcp

sudo ufw default deny incoming
sudo ufw default allow outgoing


sudo ufw enable

sudo ufw status numbered

sudo ufw status verbose



///seting up ngnix   
turn cloudlared   host to  DNS  only  


dig   dig +short restpoint.co.ke A
dig +short www.restpoint.co.ke A


 certbot --nginx -d restpoint.co.ke -d www.restpoint.co.ke


 cat > /etc/nginx/sites-available/restpoint <<'EOF'
server {
    listen 80;
    server_name restpoint.co.ke www.restpoint.co.ke;

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name restpoint.co.ke www.restpoint.co.ke;

    ssl_certificate /etc/letsencrypt/live/restpoint.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/restpoint.co.ke/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8080;

        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF


 ln -sf /etc/nginx/sites-available/restpoint \
/etc/nginx/sites-enabled/restpoint

rm -f /etc/nginx/sites-enabled/default

nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
root@vmi3742487:/opt/restpoint# systemctl reload nginx
root@vmi3742487:/opt/restpoint#




docker exec -it restpoint_mariadb mariadb -uroot -p



CREATE DATABASE IF NOT EXISTS restpoint_operations;
CREATE USER IF NOT EXISTS 'restpoint_user'@'%' IDENTIFIED BY 'USE_THE_EXACT_DB_PASSWORD_FROM_.env.production';
GRANT ALL PRIVILEGES ON restpoint_operations.* TO 'restpoint_user'@'%';
SHOW GRANTS FOR 'restpoint_user'@'%';




//authorize all  of them now  
chown -R 1001:65533 /opt/storage

chmod -R 755 /opt/storage

chmod -R 775 /opt/storage/uploads

docker exec restpoint_tenant_service sh -c \
'id && ls -ld /opt/storage /opt/storage/uploads'


//  stop   all vp s  auto updates  
systemctl stop unattended-upgrades
systemctl disable unattended-upgrades


systemctl stop apt-daily.timer
systemctl stop apt-daily-upgrade.timer

systemctl disable apt-daily.timer
systemctl disable apt-daily-upgrade.timer

dpkg -l | grep -E 'docker|containerd'

apt-mark hold docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin


///   disable   serve r  reboots
grep -R "Automatic-Reboot" /etc/apt/apt.conf.d/
cat > /etc/apt/apt.conf.d/99restpoint-no-auto-reboot <<'EOF'
Unattended-Upgrade::Automatic-Reboot "false";
EOF

//disbale ubuntu upgardes   
systemctl disable --now unattended-upgrades
systemctl disable --now apt-daily.timer
systemctl disable --now apt-daily-upgrade.timer
apt-mark hold docker-ce-rootless-extras




