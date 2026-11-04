# Phase 3 security: gateway and deceased service

## Dependency maintenance

The root workspace installs `audit-ci` as a development dependency. Run
`npm run audit:dependencies` locally; it gates high and critical advisories in
the deceased-service and API-gateway workspaces. GitHub Actions runs the same
gate for dependency changes and weekly. The existing Dependabot workflow opens
weekly npm update pull requests. Review moderate advisories and run the
test/build suite before merging updates; do not silence advisories with an
allowlist without documenting the risk and expiry.

## Gateway-to-deceased mTLS

Both Compose files require mutual TLS for the gateway-to-deceased connection.
The deceased service refuses to start in production unless mTLS is enabled and
its CA, server certificate, and private key are readable. The gateway similarly
refuses to start without its client credentials, a trusted CA, and an HTTPS
deceased-service URL. Certificate verification is enabled; TLS 1.2 is the
minimum.

1. On a trusted administrative machine with OpenSSL, run
   `.\scripts\generate-deceased-mtls-certs.ps1`.
2. Transfer `secrets/deceased-mtls/deceased/` and
   `secrets/deceased-mtls/gateway/` to the deployment host using a secure
   channel. Never transfer or mount `secrets/deceased-mtls/ca/ca.key`; keep it
   offline and back it up securely.
3. Ensure each container's runtime user (UID 1001) can read its own `tls.key`,
   but other users cannot. Keep the two certificate directories separate and
   mounted read-only.
4. Deploy with the Compose files. The deceased service is no longer published
   on a host port; it is reachable on the private backend network and requires
   a CA-signed client certificate. Rotate leaf certificates before their
   397-day expiry; rotate the CA through a planned overlap deployment.

The service remains attached to a separate egress network for its outbound
integrations. Only the gateway and the deceased service's required database,
Redis, SMS, and Socket.IO dependencies join the internal backend network.

## Environment-injected secrets

Existing `.env.production` injection remains supported. Keep that file out of
version control, restrict its host permissions, rotate credentials if exposed,
and do not add secret values to Compose literals or logs. mTLS private keys
are mounted as read-only files rather than passed through environment
variables.

## Error responses

Deceased-service errors return a generic message and a request ID. Detailed
causes are kept in service logs and associated with that ID; internal error
messages, certificate paths, and upstream addresses are not returned to API
clients.
