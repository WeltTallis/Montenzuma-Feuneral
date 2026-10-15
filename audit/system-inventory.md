# RestPoint System Inventory

**Assessment date:** 2026-10-14
**Assessment boundary:** Read-only repository inspection of `C:\Users\User\Downloads\restpoint`. No production host, cluster, cloud account, DNS provider, or live service was contacted. Findings describe checked-in code/configuration, not necessarily the running deployment.

## Executive inventory

| Area | Repository evidence | Inventory result / confidence |
|---|---|---|
| Repository shape | Root `package.json`, `services/`, `packages/`, `FrontendClient/` | Multi-workspace monorepo. |
| Main backend stack | Root `package.json`; `services/*/package.json` | Node.js/Express/TypeScript and JavaScript services; root runtime constraint is Node `>=22 <25`. |
| Other languages | `services/*/go.mod`; `services/billing-service/requirements.txt` | Go modules exist for insurance, M-Pesa, SMS, and a billing fallback. Python is present in billing. These are not evidence of a Go API gateway. |
| Frontend | `FrontendClient/client/package.json`, `FrontendClient/Dockerfile` | React/Vite SPA served by an Nginx container. A separate Metis reference project is also present. |
| API gateway | `services/api-gateway/server.js`, `services/api-gateway/package.json` | Express/Node gateway on port 5000 with service proxying, rate limiting, JWT-related dependencies, health/monitoring routes, and graceful signal handlers. Gateway is not implemented in Go. |
| Backend services | `services/` and `docker-compose.prod.yml` | Multiple domain services, including auth, tenant, deceased, florist, documents, invoice, billing, payments, SMS, socket, and operations services. Compose gives them a shared bridge network. |
| Edge / reverse proxy | `nginx-host.conf`, `nginx/restpoint-api.conf`, `FrontendClient/Dockerfile` | Host-side Nginx and frontend-container Nginx configurations exist. Their actual installation and public firewall path were not checked. Repository comments describe Cloudflare in front of host Nginx; that topology is unverified. |
| Containers / orchestration | Root Compose files and service Dockerfiles | `docker-compose.yml`, `docker-compose.prod.yml`, `docker-compose.registry.yml`, and a separate Socket.IO Compose file exist. No Kubernetes/Helm deployment files were found in the reviewed repository paths. Installed `kubectl` was not used because its current context/authorization is unknown. |
| Database | `docker-compose.prod.yml`, `docker/mariadb/custom-mysqld.cnf`, `init-db.sql`, service migrations | MariaDB 10.11 is configured. Tenant-per-database behavior is described by gateway/shared database code and comments. Production topology, pool sizes in operation, backup status, and restoreability are unverified. |
| Cache / broker | `docker-compose.prod.yml` | Redis 7 and RabbitMQ 3 with management plugin are configured. Redis persistence is enabled in the Compose command; broker/cache runtime durability and recovery were not tested. |
| Object/file storage | `docker-compose.prod.yml`, service configs | Shared host storage under `/opt/storage` is mounted into services and read-only into the frontend. No object-storage deployment configuration was verified. |
| Authentication / tenant identity | `services/api-gateway/tenantIdentity.js`, gateway proxy code, auth service | JWT and tenant-identity enforcement are implemented in the application. This inspection did not exhaustively verify every service route or authorization policy. |
| Secrets / configuration | Tracked `.env*` paths and `.gitignore` | 28 environment-like files are tracked; a value-suppressed local check found 25 non-template tracked files with non-placeholder assignments. No values were emitted. `.gitignore` itself says previously committed files contain real credentials. Whether each value is currently valid or production-scoped is unknown. |
| Monitoring / logs | `services/api-gateway/monitoring.js`, gateway routes, `monitoring/README.md` | Gateway includes process-local metrics, short in-memory history, service probes, and log-query fallback. No checked-in Prometheus/Grafana/OTel deployment configuration was found in the reviewed paths. Actual external monitoring, alert delivery, and log retention are unverified. |
| CI / code scanning | `.github/workflows/node.js.yml`, `.github/workflows/codeql.yml` | Node CI and CodeQL workflows are present. CodeQL covers JavaScript/TypeScript, Go, Python, and Actions. Gateway's `test` script prints “No tests yet”; this audit did not infer successful CI runs. |
| Automated tests | Gateway and scanner-bridge package manifests; Go test-file search and isolated test commands | Gateway has no meaningful test command. The scanner-bridge test script points to a missing file. Malformed M-Pesa Go examples were repaired/split into separate packages and their focused compile checks passed; other Go suite runs were not completed. Overall coverage and current CI status are unknown. |
| DNS / TLS / certificates | Nginx config and comments | Repository contains proxy settings but does not establish live DNS records, certificate issuance/expiry, TLS termination, Cloudflare settings, or host firewall rules. |
| Scheduled jobs / queues | Service source and Compose configuration | RabbitMQ and Redis are configured; no live queue depth, consumer health, or cron/scheduler state was collected. |
| Runtime / resource sizing | Compose configuration | No Compose CPU/memory limits, reservations, or `ulimits` were found in the production Compose file. Actual orchestrator/host limits and utilization are unavailable. |

## Safe inspection notes

- Environment-file contents, credentials, personal data, and log files were not printed.
- The value-suppressed environment-file check only counted non-empty/non-placeholder assignments; it did not validate whether values are secrets or active.
- Docker and Kubernetes command-line tools are installed, but no daemon, container inventory, cluster context, or production endpoint was queried.
- The repository worktree already contains unrelated dashboard/profile modifications. Those were left unchanged.
- The full JavaScript workspace test command was not run because the analytics test script invokes controller/streaming code for the `system_shared` tenant and could reach a configured database. The scanner-bridge mock test was run separately and failed because its target file is missing.
- Offline Go test attempts found uncached dependencies in the billing fallback; remaining broad module runs exceeded the local command window and were stopped. The focused M-Pesa example package compile check passed after repair, but contains no test files.
