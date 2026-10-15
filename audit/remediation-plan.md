# RestPoint Remediation Plan

This plan is ordered for safe risk reduction. It does not assert that an unverified production environment has been changed.

## Phase 0 — Contain exposure and preserve service

1. **Credential incident response (R-01, P0).**
   - Repository owner inventories tracked environment files and identifies which entries are real credentials using an approved secret-management workflow; never paste values into tickets or chat.
   - Rotate/revoke any credential that has been committed or may be active, starting with database/root, JWT-signing, cache/broker, payment, storage, and callback credentials.
   - Remove environment files from Git tracking while preserving local copies for authorized operators; keep only sanitized example templates. Coordinate history cleanup separately.
   - Add a secret-scanning gate and verify current tree plus history.
   - **Rollback:** Rotate forward to a new credential. Never reactivate a value known to have been committed.
2. **Network containment (R-02, P0).**
   - Confirm host Nginx is the approved public entry point and capture effective Compose bindings/firewall rules from the owner-approved deployment.
   - In staging, remove host port publication for MariaDB, Redis, RabbitMQ, and internal domain services. Bind only approved gateway/frontend ports to loopback where host Nginx requires them.
   - Independently deny database/cache/broker/internal service ports at host and cloud firewalls.
   - **Rollback:** Restore only an explicitly required binding behind an approved firewall rule; validate external reachability remains denied.
3. **Remove Redis fallback (R-03, P0).**
   - Require a provisioned high-entropy secret and fail startup when absent. Rotate any use of the static fallback.
   - **Rollback:** Use a new secret version; never reinstate `redis123`.

## Phase 1 — Protect diagnostics and improve failure behavior

4. **Authorize gateway diagnostics (R-04, P1).** Gate metrics/logs/debug endpoints with existing operator identity/role checks; minimize public health data. Add anonymous/authorized regression tests.
5. **Terminate safely after fatal process errors (R-07, P1).** Drain within a bounded deadline and exit non-zero after an uncaught exception; validate restart policy in staging.
6. **Establish readiness semantics (R-09, P2).** Preserve liveness and introduce a separate, bounded readiness endpoint. Define behavior for optional dependencies before wiring it into traffic routing.
7. **Add gateway test coverage (R-08, P1).** Replace echo-only scripts with isolated tests for routing, identity propagation, upload/WebSocket behavior, rate limits, error paths, and shutdown.

## Phase 2 — Establish measurable operating limits

8. **Collect production baselines (R-10).** Obtain an owner-approved, read-only seven-day baseline and define SLOs, RPO/RTO, and capacity headroom.
9. **Set resource budgets (R-05, P1).** Only after measurement, add per-service CPU/memory/PID/file-descriptor limits and alerts to Compose/deployment configuration. Test overload and recovery in staging.
10. **Make observability durable (R-06, P1).** Export metrics and traces to the approved collector; centralize redacted structured logs; add actionable alerts and retention. Keep personal data and credentials out of telemetry.
11. **Verify database operations.** Measure pools/query latency, confirm migration order and lock strategy, document backup ownership/retention/encryption, and perform a restore drill in isolated staging.
12. **Verify network and TLS.** From authorized control planes, validate DNS, certificate chain/expiry/renewal, reverse-proxy routes, security groups, and external exposure. Record evidence without secret material.

## Phase 3 — Reversible Go API gateway migration

The gateway is currently Node.js/Express; a Go gateway does not exist in the repository. Do not replace or redirect production traffic until contract and deployment discovery is complete.

1. Inventory every gateway route, rewrite, timeout, header policy, streaming path, WebSocket endpoint, health endpoint, and auth/tenant rule.
2. Build a Go candidate behind the same internal interface and add contract tests against mocked downstream services. Preserve existing route behavior before optimizing.
3. Run parity tests, fuzz parsers/security-sensitive inputs, `go test ./...`, `go test -race ./...`, `go vet ./...`, and representative benchmarks.
4. Deploy the candidate alongside Node in an isolated/staging environment; compare response status/body/header behavior and latency. Never duplicate writes to production without an idempotency design.
5. Use a controlled canary/traffic split with dashboards, error/latency guardrails, an explicit operator, and an automated stop condition.
6. Keep the Node image and route target ready for immediate rollback. Promote only after agreed observation windows and security review.

## Validation and rollout controls

- The current audit did not deploy or modify production infrastructure.
- Compose syntax validation was attempted locally but did not return within the command timeout and was stopped; no deployment was started.
- No secret scan, dependency audit, live load test, DNS/TLS probe, external port scan, production database query, or restore test was run.
- All deployment work requires staging first, a named owner, change window, before/after evidence, health checks, and a tested rollback path.
- Do not apply arbitrary resource limits, rotate credentials without coordination, rewrite Git history, or switch gateway traffic until owners and deployment dependencies are confirmed.
