# RestPoint Architecture (Repository-Derived)

**Status:** This describes the intended topology implied by checked-in code and deployment files. It is not a verified production topology.

## Logical topology

```text
Browser / clients
       |
       | Public DNS, CDN, TLS termination, and firewall: not verified
       v
Host Nginx / frontend Nginx
       |-- SPA assets
       |-- /api/* and Socket.IO
       |-- /monitoring
       v
Node.js Express API gateway (port 5000)
       |-- auth / tenant identity and service routing
       |-- domain microservices on Compose bridge network
       |-- monitoring probes and in-process metrics
       |
       +--> MariaDB 10.11
       +--> Redis 7
       +--> RabbitMQ 3
       +--> shared host uploads at /opt/storage
       |
       +--> external integrations (payment, tax, SMS, scanner, and insurance;
            configured in service code, not probed during this audit)
```

## Components and observed boundaries

1. **Frontend:** `FrontendClient/client` is a React/Vite application. The frontend Dockerfile serves static assets through Nginx and proxies selected paths to the gateway. Production Compose maps the frontend container to host port 8080.
2. **Gateway:** `services/api-gateway/server.js` is the Express entry point. It configures CORS, Helmet, request parsing, rate limiting, metrics collection, service proxy routes, diagnostics, and shutdown signal handlers. Production Compose maps gateway port 5000 to a configurable host port.
3. **Domain services:** Compose runs service containers on `restpoint_network`. Several services also publish their container ports to host ports in the production file; this bypasses the intended gateway-only service boundary if host/firewall policy permits access.
4. **Persistence and messaging:** MariaDB, Redis, and RabbitMQ are separate containers attached to the application bridge. Production Compose publishes host ports for all three. Persistent volumes are declared for MariaDB and Redis; RabbitMQ also has a data volume.
5. **Files:** Compose mounts host storage into backend services. The frontend receives a read-only uploads mount. Host path existence, access controls, backup, encryption, and recovery were not verified.
6. **Monitoring:** `services/api-gateway/monitoring.js` keeps counters, a 60-sample time series, and a 200-entry request ring in process memory. Its routes expose service and gateway information. Persistent metrics, distributed traces, alerting, and retention are not demonstrated by the repository configuration reviewed.

## Authentication and tenant isolation

The gateway contains JWT-derived tenant identity handling (`services/api-gateway/tenantIdentity.js`) and comments documenting a previous cross-tenant header-trust issue. Service authorization and object-level access controls remain a separate responsibility. A full route-by-route authorization audit has not yet been performed.

## API gateway migration boundary

There is no Go gateway in the repository. Go exists in selected service modules only. A Go replacement therefore needs to preserve:

- Existing route and path rewrite behavior for every service.
- JWT verification, tenant/branch identity propagation, and header trust boundaries.
- CORS, rate limiting, request/body limits, streaming/multipart uploads, and WebSocket upgrades.
- Error/timeout behavior, request IDs, logs/metrics, health and monitoring contracts.
- Existing deployment ports, environment variable names, and Compose service discovery.

A parallel candidate and reversible traffic switch are required. Production cutover is out of scope until the current deployment and traffic rollback path are verified.
