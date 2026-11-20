# Phase 3 security: gateway and deceased service

## Dependency maintenance

The root workspace installs `audit-ci` as a development dependency. Run
`npm run audit:dependencies` locally; it gates high and critical advisories in
the deceased-service and API-gateway workspaces. GitHub Actions runs the same
gate for dependency changes and weekly. The existing Dependabot workflow opens
weekly npm update pull requests. Review moderate advisories and run the
test/build suite before merging updates; do not silence advisories with an
allowlist without documenting the risk and expiry.

## Gateway-to-deceased connection

The gateway connects to the deceased service over HTTP on a dedicated,
internal-only Docker network shared with its required database, Redis, SMS,
and Socket.IO dependencies. The deceased service is not published on a host
port. This removes the need to provision or mount service certificates.
Traffic on this private container network is not encrypted, so do not attach
untrusted containers or external workloads to the network. External traffic
should continue to terminate TLS at the public edge.

The service remains attached to a separate egress network for its outbound
integrations. Only the gateway and the deceased service's required database,
Redis, SMS, and Socket.IO dependencies join the internal backend network.

## Environment-injected secrets

Existing `.env.production` injection remains supported. Keep that file out of
version control, restrict its host permissions, rotate credentials if exposed,
and do not add secret values to Compose literals or logs.

## Error responses

Deceased-service errors return a generic message and a request ID. Detailed
causes are kept in service logs and associated with that ID; internal error
messages, certificate paths, and upstream addresses are not returned to API
clients.
