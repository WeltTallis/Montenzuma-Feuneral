# RestPoint Baseline Metrics

**Collection date:** 2026-10-14
**Source:** Repository configuration only. No production traffic, host, cloud account, database, cluster, or monitoring endpoint was queried. Consequently, this is a configuration baseline, not a runtime performance baseline.

## Runtime measurements

| Metric | Baseline | Status / required collection |
|---|---:|---|
| API request rate / throughput | Not available | Collect per-route and per-service request rate from an authorized production telemetry source. |
| API p50 / p95 / p99 latency | Not available | Collect gateway and downstream histograms with request correlation. |
| HTTP 4xx / 5xx / 429 rates | Not available | Collect by service/route without high-cardinality or personal-data labels. |
| Availability / error budget | Not available | Obtain agreed SLOs and incident history from service owner. |
| CPU / memory / process RSS | Not available | Collect container and host time series; gateway code can report process RSS/heap, but no live value was read. |
| Disk utilization / I/O / inode pressure | Not available | Inspect authorized hosts, volumes, and storage lifecycle policies. |
| Network throughput / connection counts | Not available | Collect host, proxy, and service-level connection metrics. |
| MariaDB connections / query latency / slow queries | Not available | MariaDB config enables Performance Schema and slow-query logging (`long_query_time = 1`); no live exporter or DB was queried. |
| Redis memory / hits / misses / eviction | Not available | Compose sets `maxmemory 1gb` and `allkeys-lru`; current usage and eviction rate are unknown. |
| RabbitMQ queue depth / consumer lag | Not available | Broker is configured; live queue and consumer metrics are unknown. |
| Backup completion / restore point / RPO / RTO | Not available | No verified backup job, artifact, restore, or owner-provided recovery objective was available. |
| DNS / TLS certificate validity | Not available | Repository proxy files do not prove active DNS or certificate state. |
| Container restarts / OOM kills | Not available | Runtime inventory was not queried. |

## Configuration baseline

| Measure | Observed value |
|---|---|
| Root Node.js engine range | `>=22.0.0 <25.0.0` |
| Production Compose database/cache/broker | MariaDB 10.11, Redis 7 Alpine, RabbitMQ 3 management Alpine |
| Gateway port | Container port 5000; host mapping is configurable and defaults to 5000 |
| Gateway request body parser limit | 50 MB for JSON and URL-encoded bodies; multipart streams bypass those parsers |
| Gateway monitoring sample history | 60 in-memory samples at 15-second intervals (approximately 15 minutes if the timer remains healthy) |
| Gateway request log ring | 200 in-memory entries |
| Monitoring probe timeout / concurrency | 3 seconds / at most 8 concurrent service probes |
| Production Compose resource declarations | No CPU, memory, PID, `ulimits`, or reservation declarations found |
| Host-published ports | Database, Redis, RabbitMQ, gateway, frontend, and multiple backend service mappings are present. Several mappings omit an explicit loopback bind; actual host firewall policy is unknown. |
| Tracked environment files | 28 environment-like tracked paths; 25 non-template files had non-placeholder assignments in a value-suppressed check. Values were not printed; validity is unverified. |

## Safe repository checks

| Check | Result |
|---|---|
| `git diff --check` | Passed for tracked changes. |
| Audit Markdown whitespace | Passed after correction. |
| `npm test --workspace=@montezuma/scanner-bridge` | Failed: `test/e2e-mock.mjs` is absent although the package script invokes it. |
| M-Pesa `go test ./...` (initial) | Failed to compile malformed tutorial/example Go files under `goPrac`; these were corrected. |
| M-Pesa `go test ./goPrac/...` (after correction) | Passed compile checks for both example packages; neither contains test files. |
| Billing fallback Go test with `GOPROXY=off` | Could not compile because required modules were not present in the local module cache. No dependency download was attempted. |
| Full JavaScript workspace tests | Not run: the analytics test script invokes tenant analytics/streaming code that may use a configured database. |
| Other Go module tests | Not completed within the local command window; no production systems were contacted. |
| Production Compose syntax / runtime validation | Not completed. Local Compose validation did not return and was stopped; no stack was started. |

## Required safe baseline collection

1. Confirm the intended production account, host/cluster context, and read-only access with the system owner.
2. Collect a minimum 7-day window plus incident windows for resource utilization, traffic, latency, errors, pool saturation, restarts, and queue depth.
3. Record source, timestamp, timezone, sampling interval, retention, and any known gaps.
4. Redact personal data, credentials, tokens, tenant identifiers, and customer payloads before placing results in this repository.
5. Test database and file restore only in an isolated environment; do not perform destructive tests on production.
