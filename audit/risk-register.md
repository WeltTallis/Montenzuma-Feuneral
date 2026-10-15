# RestPoint Production Risk Register

**Assessment date:** 2026-10-14
**Evidence boundary:** Repository files only. Live reachability, secret validity, production ownership, and runtime impact have not been verified. No secrets or secret values are reproduced here.

## Severity guide

- **Critical:** Immediate, broadly exploitable system compromise is established.
- **High:** Likely serious compromise or outage if the configured deployment is used as written; live reachability or credential validity may still be unknown.
- **Medium:** Material security/reliability risk requiring planned remediation.
- **Low:** Limited impact or maintainability concern.

| ID | Severity | Finding / status | Confidence | Priority |
|---|---|---|---:|---:|
| R-01 | High | Version-controlled environment files contain non-placeholder assignments; `.gitignore` states committed files contain real credentials. Credential validity and exposure audience are unverified. | 9/10 | P0 |
| R-02 | High | Production Compose publishes database, cache, broker, gateway, and multiple backend ports on host interfaces by default. External firewall exposure is unverified. | 9/10 for configuration; 5/10 for Internet reachability | P0 |
| R-03 | High | Redis falls back to the static password `redis123` when `REDIS_PASSWORD` is unset and its host port is published by default. | 10/10 for configuration | P0 |
| R-04 | Medium | Gateway monitoring, log-query, health, and DNS-debug endpoints are registered without route-level authentication in the shown handlers. Gateway/frontend proxying can expose some of these paths; actual access controls outside the repo are unknown. | 8/10 | P1 |
| R-05 | Medium | Production Compose has no CPU/memory/resource reservation or `ulimits` directives, so this deployment file does not constrain resource consumption. Actual host/orchestrator limits are unknown. | 9/10 for file configuration | P1 |
| R-06 | Medium | Gateway stores metrics and request-log history only in process memory; restart loses the history. No repository-managed durable metrics/trace/alerting stack was found in reviewed configuration. | 9/10 for in-process design; 5/10 for deployed observability | P1 |
| R-07 | Medium | `uncaughtException` is logged but does not initiate shutdown. Continuing after an uncaught exception risks serving requests in an inconsistent process state. | 9/10 | P1 |
| R-08 | Medium | Gateway package `test` script is a placeholder, leaving routing, authorization, rate limits, streaming, and shutdown behavior without a gateway regression suite. | 10/10 | P1 |
| R-09 | Medium | `/health` always returns 200 as a process liveness check, even when routed downstream services are unavailable; no separate readiness endpoint is evident in the gateway handlers. | 9/10 | P2 |
| R-10 | Medium | Scanner-bridge `test` script invokes a missing mock-test file; the isolated test command fails with `MODULE_NOT_FOUND`. | 10/10 | P1 |
| R-11 | Medium (fixed) | Malformed tutorial/example Go files in the M-Pesa module prevented module compilation. They were corrected; the focused package compile check passes, but the whole module suite remains unverified. | 10/10 | P1 |
| R-12 | Unknown | DNS, TLS, certificates, cloud IAM/security groups, actual backups, restore tests, production pool pressure, and live service/host utilization cannot be verified from the available repository snapshot. | N/A | P1 discovery gate |

## Finding details

### R-01 — Tracked environment configuration

- **Affected component:** Repository configuration and all services consuming environment variables.
- **Evidence:** `git ls-files` listed 28 environment-like files, including 25 non-template files with non-placeholder assignments from a value-suppressed check. `.gitignore` lines 45–50 explicitly state that previously committed `.env`/`.env.production` files contain real credentials, but the tracked-file query still finds environment files in Git. No values were read into audit output.
- **Status:** Confirmed tracked configuration; active secret status, historical exposure, and repository visibility are not established.
- **Impact:** If any assignment is a current credential, repository readers or Git history readers may use it to access databases, services, tokens, or storage.
- **Safe reproduction:** `git ls-files '.env' '.env.*' '**/.env' '**/.env.*'` (inspect paths only; never `type`/`Get-Content` these files for review output).
- **Remediation:** Immediately identify affected credentials in an approved secret manager without copying them into issue/chat output; rotate/revoke them and audit access; remove local environment files from Git tracking while preserving local copies; commit placeholder templates; add secret scanning and prevent future commits. Purge Git history only through a coordinated repository-owner procedure after all consumers have rotated.
- **Verification:** Confirm tracked paths contain only approved templates; scan the full current tree and Git history with an approved secret scanner; validate new credentials from the secret manager; ensure CI rejects canary test credentials.
- **Rollback:** Do not restore exposed values. If rotation causes an outage, issue a new credential, update consumers, and roll forward; coordinate any history rewrite with every clone and release branch.

### R-02 — Host-published infrastructure and service ports

- **Affected component:** `docker-compose.prod.yml`, production firewall/reverse proxy.
- **Evidence:** MariaDB `${MARIADB_EXTERNAL_PORT:-3306}:3306` (line 24), Redis `${REDIS_EXTERNAL_PORT:-6379}:6379` (line 72), RabbitMQ client/management ports (lines 92–93), gateway host mapping (line 114), and multiple backend host mappings such as auth/tenant/deceased (lines 170, 208, 261). Frontend publishes `8080:80` (line 973). These mappings do not specify a loopback host IP. Docker host binding/firewall semantics mean the file alone cannot establish Internet reachability.
- **Status:** Confirmed host publication configuration; external reachability depends on host firewall, cloud security groups, and deployment overrides, none of which were inspected.
- **Impact:** If reachable outside the private host network, database/cache/broker administration and direct backend ports bypass the intended public edge and gateway policies.
- **Safe reproduction:** Inspect the Compose port declarations and deployment's effective port bindings without printing environment values; verify actual bindings only on an authorized staging host.
- **Remediation:** Remove `ports` from internal services and data stores. Keep service-to-service traffic on the private Compose network. Publish only approved edge services and bind them to loopback when host Nginx is the public edge. Restrict cloud/network firewall rules independently.
- **Verification:** In staging, inspect effective container bindings and confirm only approved edge listeners exist; test reachability from an authorized external test host and verify internal service-to-service calls still work.
- **Rollback:** Restore only the exact required port binding behind an explicit firewall rule; do not restore all service ports or bind sensitive services to wildcard host interfaces.

### R-03 — Insecure Redis fallback

- **Affected component:** `docker-compose.prod.yml` Redis command and service environment.
- **Evidence:** The Redis server, healthcheck, gateway connection URL, and multiple services use `${REDIS_PASSWORD:-redis123}` (for example lines 70, 78, and 144). Redis also has a default host-published port at line 72.
- **Status:** Confirmed fail-open configuration when `REDIS_PASSWORD` is absent. Whether the fallback is active in production is unknown.
- **Impact:** A predictable password can allow unauthorized cache/queue access and may enable data disclosure or service disruption if the port is reachable.
- **Remediation:** Remove the default and require a strong generated secret supplied by approved secret management. Rotate any value that may have used the fallback. Remove host publication.
- **Verification:** Compose must fail closed when the secret is missing; staging integration tests confirm all clients authenticate with the provisioned value and no host port is published.
- **Rollback:** Roll back the application/config version while retaining a newly rotated secret; never restore the static fallback.

### R-04 — Unauthenticated gateway diagnostics

- **Affected component:** `services/api-gateway/server.js`, host/frontend proxy paths.
- **Evidence:** Direct handlers are registered for `/monitoring` (line 1088), `/monitoring/logs` (1115), `/health` (1137), and `/debug/dns-cache` (1168). The shown handlers have no route-level auth middleware. The root Nginx configuration forwards `/monitoring`; frontend Nginx also forwards that exact path. Gateway host port is published in production Compose. The external route is therefore available through at least some configured paths unless an upstream access policy blocks it.
- **Status:** Confirmed handler-level lack of authentication; Internet reachability and any external identity-aware proxy policy are unverified.
- **Impact:** Service names/targets, health, DNS state, process details, and potentially operational logs may be exposed to unauthorized callers.
- **Safe reproduction:** On an authorized staging deployment only, request each diagnostic path without credentials and verify the configured access policy. Do not query production.
- **Remediation:** Require an authenticated operator role for logs and detailed diagnostics; minimize `/health` output to non-sensitive liveness; disable or protect DNS debug in production; enforce the same policy at the gateway and edge.
- **Verification:** Tests assert anonymous requests receive 401/403, authorized operators receive only permitted fields, and edge routes cannot bypass gateway authorization.
- **Rollback:** Revert the access-policy change only behind an explicit temporary network allowlist and time-bounded incident approval.

### R-05 — No resource guardrails in production Compose

- **Affected component:** All services in `docker-compose.prod.yml`.
- **Evidence:** A targeted search found zero `mem_limit`, `cpus`, `deploy.resources`, `ulimits`, read-only filesystem, or capability-drop declarations in that file.
- **Status:** Confirmed for this Compose file; host/container runtime limits may exist outside the repository.
- **Impact:** A leak, unbounded concurrency, or workload spike may exhaust host memory/CPU/file descriptors and impact unrelated services.
- **Remediation:** Collect real peak and steady-state measurements first; define per-service CPU, memory, PID, and file descriptor budgets and alerts. Add limits that preserve observed headroom rather than selecting arbitrary values.
- **Verification:** Load-test staging against measured peak traffic and confirm health, latency, restart behavior, and OOM signals remain within agreed SLOs.
- **Rollback:** Revert only the new limits if a measured workload is starved; retain host-level monitoring and restore limits after right-sizing.

### R-06 — Non-durable monitoring history

- **Affected component:** `services/api-gateway/monitoring.js` and monitoring dashboard.
- **Evidence:** Counters, a 200-entry `logRing`, and a 60-entry `series` are module-level in-memory data structures. No persistent store is used for those histories. Redis/Loki availability is optional in the code, and no corresponding collector/alerting deployment was found in the reviewed repository paths.
- **Status:** In-memory behavior confirmed; production external monitoring is unknown.
- **Impact:** Restarts erase short-term history; incidents may not have retained metrics/traces or actionable alert notifications.
- **Remediation:** Export bounded-cardinality metrics to a durable collector; centralize structured logs with PII redaction and retention; add request correlation/tracing and SLO alerts. Avoid storing deceased/kin details or secrets in labels/log fields.
- **Verification:** Staging restart test confirms historical metrics/logs remain available externally; alerts fire on a controlled synthetic failure and resolve correctly.
- **Rollback:** Keep dashboard fallback and dual-publish telemetry during migration; revert exporter routing without removing local health reporting.

### R-07 — Process continues after an uncaught exception

- **Affected component:** `services/api-gateway/server.js` process-level error handler.
- **Evidence:** Lines 1253 onward log `uncaughtException` but do not exit or initiate shutdown; SIGTERM/SIGINT handlers close the HTTP server.
- **Status:** Confirmed control flow; no production occurrence was inspected.
- **Impact:** The process can continue after an unrecoverable exception with state that may no longer be safe to serve.
- **Remediation:** On uncaught exceptions, stop accepting traffic, log a redacted fatal event, drain/close within a bounded timeout, then exit non-zero for the orchestrator to restart. Keep `unhandledRejection` policy deliberate and tested.
- **Verification:** A process-level test injects a controlled uncaught exception and asserts the server stops and exits non-zero within the deadline; verify Compose restarts it in staging.
- **Rollback:** Revert the handler change only if it prevents clean shutdown, while retaining process supervision and a bounded restart policy.

### R-08 — Gateway test placeholder

- **Affected component:** `services/api-gateway/package.json`, gateway routes and middleware.
- **Evidence:** The gateway `test` script echoes “No tests yet”; lint is also an echo-only placeholder. CI invokes `npm test`, but this package script does not assert gateway behavior.
- **Impact:** Changes to auth, tenant routing, rate limiting, streaming uploads, WebSockets, or shutdown may regress without detection.
- **Remediation:** Add isolated unit/integration tests for route mapping, auth/tenant header derivation, denial of spoofed identity headers, rate-limit storage fallback, body limits, proxy timeout, WebSocket handling, diagnostics authorization, and shutdown. Use mocked downstream services.
- **Verification:** CI runs deterministic gateway tests with no production credentials or network dependencies.
- **Rollback:** Keep the previous gateway image/version deployable; do not bypass a failing security regression test to ship a rollout.

### R-09 — Liveness/readiness ambiguity

- **Affected component:** Gateway `/health` and Compose healthcheck.
- **Evidence:** The gateway handler documents that it is a static self-report and always returns 200 without probing backend services; Compose uses that route for the gateway healthcheck.
- **Impact:** Deployment health can indicate a live gateway while critical dependencies are unavailable. This is acceptable for liveness but insufficient as a readiness signal if traffic routing relies on it.
- **Remediation:** Keep liveness cheap and separate; add a bounded readiness check or explicit dependency state for orchestrators/load balancers, with clear startup and degraded-mode semantics.
- **Verification:** Staging tests distinguish process liveness from dependency readiness and ensure a single unavailable optional service does not cause an unnecessary restart loop.
- **Rollback:** Retain the existing liveness endpoint; revert readiness routing separately if it causes false negatives.

### R-10 — Scanner-bridge test target is missing

- **Affected component:** `services/scanner-bridge/package.json`, CI test workflow.
- **Evidence:** The `test` script runs `node test/e2e-mock.mjs`, but the scanner-bridge workspace contains no `test/` directory or `e2e-mock.mjs`. Running `npm test --workspace=@montezuma/scanner-bridge` fails with `MODULE_NOT_FOUND`. The root CI workflow runs `npm test`, so the configured test target cannot pass as written.
- **Status:** Confirmed test failure.
- **Impact:** CI can fail before release; there is no mock regression coverage for the scanner bridge.
- **Safe reproduction:** `npm test --workspace=@montezuma/scanner-bridge` (does not contact a scanner or production service).
- **Remediation:** Restore the intended mock test or implement tests against an isolated mock bridge using the current source API; avoid replacing it with a no-op that reports success without assertions.
- **Verification:** The workspace test command passes in isolation and in root CI, with no physical scanner, production credentials, or network dependency.
- **Rollback:** Keep the test isolated; revert only a faulty test implementation, not the CI command's failure visibility.

### R-11 — M-Pesa module included malformed tutorial/example code (fixed)

- **Affected component:** `services/mpesa-service/goPrac`.
- **Evidence:** Initial `go test ./...` reported an illegal rune literal in `goPrac/main.go`; after correcting that file, it found a second malformed file, `variables_main.go`. The examples were repaired and separated into runnable packages.
- **Status:** Fixed in the current worktree. The full M-Pesa module test run was not completed, so other package/build issues may remain.
- **Impact:** The malformed files caused Go package setup/compilation to fail for the module's recursive test command.
- **Remediation:** Keep the package syntax-valid and add real tests where the demo is intended to be maintained; review whether tutorial examples belong in the production module.
- **Verification:** `gofmt -d` reports no changes and `go test ./goPrac/...` passes for both packages (`[no test files]`); complete `go test ./...` after module dependencies are available in an approved environment.
- **Rollback:** Revert only if the examples are intentionally excluded from the production module; in that case move them outside the Go module rather than restoring invalid Go syntax.

### R-12 — Production baseline not collected

- **Affected component:** Host/cloud, DNS/TLS, database, network and external integrations.
- **Evidence:** No authorized production endpoint/account/context was provided or queried in this assessment.
- **Impact:** External reachability, certificate expiry, actual resource headroom, pool exhaustion, backups, recovery objectives, and real SLOs remain unknown.
- **Remediation:** Run an owner-approved read-only collection from the authorized production/staging control plane, redact identifiers/values, and update the baseline before applying resource or routing changes.
- **Verification:** Attach timestamped, source-attributed measurements and test a restore in isolated staging.
- **Rollback:** No changes were made for this finding; do not use production load or destructive restore tests.
