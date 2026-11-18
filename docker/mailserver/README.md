# RestPoint self-hosted mail

//pull image  
cd /opt/restpoint

sed -i 's#ghcr.io/docker-mailserver/docker-mailserver:v17.0.0#ghcr.io/docker-mailserver/docker-mailserver:17.0.0-r2#' docker-compose.prod.yml

grep -n 'docker-mailserver' docker-compose.prod.yml

docker compose --env-file .env.production -f docker-compose.prod.yml config --images | grep mailserver

docker compose --env-file .env.production -f docker-compose.prod.yml pull mailserver
docker compose --env-file .env.production -f docker-compose.prod.yml up -d mailserver




The production Compose file runs Docker Mailserver `17.0.0-r2` for
`restpoint.co.ke`.
The auth service submits mail to `mail.restpoint.co.ke:587` using STARTTLS;
Docker's network alias routes that hostname to the mail container internally.
The mailserver also exposes SMTP on port 25 for delivery and IMAPS on 993.

## Before starting the service

1. Use a static public IPv4 address. Create an `A` record for
   `mail.restpoint.co.ke` pointing to it. Do not publish an `AAAA` record
   unless IPv6 mail routing and firewall access are configured too.
2. Set the domain's `MX` record to `mail.restpoint.co.ke` (priority 10).
   In Cloudflare or a similar DNS proxy, keep the mail host DNS-only.
3. Configure reverse DNS/PTR with the VPS provider so the public IP resolves to
   `mail.restpoint.co.ke`.
4. Allow inbound TCP ports 25, 587, and 993 in both the VPS firewall and
   provider firewall. Confirm outbound TCP 25 is not blocked by the provider.
5. Issue a trusted certificate for `mail.restpoint.co.ke` and ensure its
   `fullchain.pem` and `privkey.pem` are under
   `/etc/letsencrypt/live/mail.restpoint.co.ke/` on the host. The Compose
   service mounts `/etc/letsencrypt` read-only and uses the `letsencrypt`
   certificate mode.

Publish a single SPF TXT record at the domain root. If this server is the only
sender, `v=spf1 mx -all` is a starting point; merge `mx` into the existing SPF
record if other providers also send mail. Do not publish multiple SPF records.

## Deploy and create the mailbox

From `/opt/restpoint`, start the mailserver after DNS and the certificate are
ready:

```sh
docker compose --env-file .env.production -f docker-compose.prod.yml up -d mailserver
```

Make sure `.env.production` contains `SMTP_HOST=mail.restpoint.co.ke`,
`SMTP_PORT=587`, `SMTP_SECURE=false`, and
`SMTP_FROM=noreply@restpoint.co.ke`. The Compose defaults apply only when
these settings are absent; existing values override them.

Generate a unique 256-bit mailbox password on the production host, store it in
the ignored `.env.production` file, create the mailbox, then recreate the auth
service so it loads the SMTP credentials. This prints no password:

```sh
cd /opt/restpoint
SMTP_USER='noreply@restpoint.co.ke'
SMTP_PASSWORD="$(openssl rand -hex 32)"
sed -i '/^SMTP_USER=/d; /^SMTP_PASSWORD=/d' .env.production
printf '\nSMTP_USER=%s\nSMTP_PASSWORD=%s\n' "$SMTP_USER" "$SMTP_PASSWORD" >> .env.production
chmod 600 .env.production
docker exec restpoint_mailserver setup email add "$SMTP_USER" "$SMTP_PASSWORD"
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --no-deps --force-recreate auth-service
unset SMTP_PASSWORD
```

Run the mailbox creation command only once. The SMTP login is the full mailbox
address. Keep `.env.production` private and do not paste it into chat or logs.
Verify without printing secrets:

```sh
docker exec restpoint_auth_service node -e 'console.log({host:process.env.SMTP_HOST,userSet:!!process.env.SMTP_USER,passwordSet:!!process.env.SMTP_PASSWORD})'
```

## Troubleshooting

Use the production Compose file when checking the mail service:

```sh
docker compose --env-file .env.production -f docker-compose.prod.yml ps mailserver auth-service
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=200 mailserver
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=200 auth-service
```

Confirm the certificate and mailbox exist:

```sh
sudo test -s /etc/letsencrypt/live/mail.restpoint.co.ke/fullchain.pem
sudo test -s /etc/letsencrypt/live/mail.restpoint.co.ke/privkey.pem
docker exec restpoint_mailserver setup email list
docker exec restpoint_auth_service node -e 'console.log({host:process.env.SMTP_HOST,port:process.env.SMTP_PORT,userSet:!!process.env.SMTP_USER,passwordSet:!!process.env.SMTP_PASSWORD})'
```

The auth service reads `SMTP_PASSWORD`, not `SMTP_PASS`. Keep the mail host
DNS-only in Cloudflare; the web proxy cannot proxy SMTP, IMAPS, or MX traffic.
After fixing a missing certificate or mailbox, recreate the services:

```sh
docker compose --env-file .env.production -f docker-compose.prod.yml up -d mailserver
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --no-deps --force-recreate auth-service
```

If password reset logs report `Hostname/IP does not match certificate's
altnames`, the certificate mounted for the mailserver is a web certificate.
It must contain `DNS:mail.restpoint.co.ke`:

```sh
sudo openssl x509 -in /etc/letsencrypt/live/mail.restpoint.co.ke/fullchain.pem \
  -noout -subject -issuer -dates -ext subjectAltName
```

Issue a certificate specifically for the mail hostname. A DNS challenge avoids
stopping the web stack:

```sh
sudo certbot certonly --manual --preferred-challenges dns \
  -d mail.restpoint.co.ke
```

Publish the TXT record Certbot requests in Cloudflare, wait for propagation,
and complete the prompt. Then reload mail and retest:

```sh
docker compose --env-file .env.production -f docker-compose.prod.yml \
  up -d --force-recreate mailserver
docker compose --env-file .env.production -f docker-compose.prod.yml \
  up -d --no-deps --force-recreate auth-service
```

Do not disable TLS certificate verification to work around this error; that
would allow a wrong or intercepted SMTP endpoint to receive reset codes.

## DKIM and DMARC

After the mailserver starts, generate a DKIM key:

```sh
docker exec restpoint_mailserver setup config dkim
docker exec restpoint_mailserver find /tmp/docker-mailserver -name mail.txt -print
```

Publish the TXT record from the generated `mail.txt` at the selector and
domain shown in that file. Add a DMARC TXT record at `_dmarc.restpoint.co.ke`;
start with `v=DMARC1; p=none` while validating SPF and DKIM, then tighten the
policy after reviewing reports.
