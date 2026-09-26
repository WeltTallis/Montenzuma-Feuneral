# Monitoring — Rest Point OS Infrastructure Monitor

## What this is

A single, self-contained infrastructure dashboard for the RestPoint platform.
It is served **inside the React app** at:

```
/tenant/:slug/monitoring
```

Component: `FrontendClient/client/src/monitoring/RestPointOsMonitor.jsx`
Styles: `FrontendClient/client/src/monitoring/monitor.css`

## What was removed

The previous monitoring stack has been deleted in full. It required 11 extra
containers and 4 Docker volumes to produce a page whose numbers were, in the
end, mostly hard-coded:

| Removed | What it was |
|---|---|
| `grafana/` | Dashboards + Prometheus datasource provisioning |
| `prometheus/` | Scrape config and `restpoint-alerts.yml` |
| `loki/` | Log store |
| `promtail/` | Log shipper |
| `blackbox-exporter/` | Blackbox HTTP prober |
| `load-testing/` | k6 scripts + Grafana k6 dashboards |
| `init-uptime-kuma.js` | Uptime-kuma monitor seeding |
| `docker-compose.yml` | The 11-service monitoring stack |
| `index.html` | The standalone page (now ported into the React app) |

Nothing in the root `docker-compose*.yml` or `nginx.conf` referenced any of it,
so removal is self-contained.

## Where the data comes from

Everything is measured live by the API gateway. There is **no** synthetic or
placeholder data on the screen.

**Endpoint:** `GET /monitoring` → `services/api-gateway/monitoring.js`

| Card | Real source |
|---|---|
| Services Online / System Service Status | Live HTTP probe of every entry in the gateway's `SERVICE_URLS`, with latency and the real failure code |
| API Requests | Request counter in gateway middleware (`res.on('finish')`) |
| Cache Hit Rate / Cache Performance | Redis `INFO stats` → `keyspace_hits` / `keyspace_misses` |
| BullMQ Workers | Queue depth read from the `bull:<queue>:*` keys — queue names are **discovered** by scanning, so new queues appear automatically |
| Jobs Failed | BullMQ `failed` set cardinality |
| Memory (RSS) | `process.memoryUsage()` + host `os` totals |
| Live Request Log | 200-entry ring buffer of recent requests (timestamp, method, path, service, status, ms) |
| Service Traffic Trends | 60-sample rolling series, sampled every 15s |
| Rate Limit Hits | Real 429 counter from the same middleware |
| Critical Alerts | **Derived** from the above — services down, 5xx, 429s, high latency, failed/backlogged jobs, Redis unreachable |

### Cards re-pointed rather than faked

The old page had a **Slow Query Tracker** and a **DB Fetches** tile. Nothing in
the platform exposes slow-query telemetry, so rather than invent numbers:

- *Slow Query Tracker* → **Service Latency** (measured by the real probes)
- *DB Fetches* → removed; the cache tile now shows **Total** lookups

## Resilience

A previous health-check implementation caused a full production outage
("fetch failed" for every service). This one is defensive by design:

- Probes use plain global `fetch` with `AbortSignal.timeout` (3s) and bounded
  concurrency (8), so a dead host cannot stall the endpoint.
- **Any** HTTP response — even a 404 or 502 from the app — counts as UP. Only a
  network-level failure (refused / timeout / DNS) counts as DOWN.
- Redis is `lazyConnect`, and on failure the module backs off for 30s and
  reports `available: false` with a reason. The dashboard renders `—` for those
  cards instead of the request failing.
- The series sampler is `unref()`'d and wrapped in try/catch, so it can never
  hold the process open or throw.
- `GET /monitoring` always answers HTTP 200; a degraded subsystem is reported
  *inside* the payload.

Tunables: `MONITOR_PROBE_TIMEOUT_MS` (default 3000).

## Access

The endpoint needs no auth token — it is infrastructure telemetry, not tenant
data, and the response contains service names and latency only. It is served
from the gateway **root** (`https://host/monitoring`), not under
`/api/v1/restpoint`, so the dashboard bypasses the axios instance.

If you need it locked down, put it behind the gateway's auth middleware or an
nginx location rule; nothing else has to change.


Complete monitoring solution for the RestPoint funeral home management system using modern open-source tools.

## Architecture

```
                    Grafana (port 3001)
                       ▲
                       |
                  Prometheus (port 9090)
                       |
     ┌─────────────────┼─────────────────┐
     │                 │                 │
Node Exporter      cAdvisor      Blackbox Exporter
     │                 │                 │
Server             Docker          External Checks
     │                 │                 │
     └──────────── Your Application ─────┘
              |
       React + Node.js + MySQL
```

## Components

### 1. **Prometheus** (port 9090)
- **Purpose**: Metrics collection and time-series storage
- **Scrapes**: All exporters and application metrics every 15 seconds
- **Retention**: 30 days of metrics history
- **Web UI**: http://localhost:9090

### 2. **Grafana** (port 3001)
- **Purpose**: Dashboards and visualization
- **Credentials**: admin / admin123
- **Web UI**: http://localhost:3001
- **Features**:
  - Pre-configured Prometheus and Loki datasources
  - Dashboard provisioning enabled
  - Plugin support for advanced visualizations

### 3. **Node Exporter** (port 9100)
- **Purpose**: Server hardware metrics
- **Monitors**:
  - CPU usage (per core and total)
  - Memory usage (RAM, swap)
  - Disk space and I/O
  - Network traffic
  - System load averages
  - Running processes

### 4. **cAdvisor** (port 8081)
- **Purpose**: Container metrics
- **Monitors**:
  - CPU, memory, network per container
  - Disk usage per container
  - Container restarts and throttling
  - Resource limits vs usage
- **Web UI**: http://localhost:8081

### 5. **Blackbox Exporter** (port 9115)
- **Purpose**: External service monitoring
- **Checks**:
  - HTTP/HTTPS endpoint availability
  - SSL certificate validity
  - Response times
  - DNS resolution
  - TCP port connectivity
- **Monitored endpoints**:
  - Main website (https://restpoint.co.ke)
  - API Gateway health
  - All microservice health endpoints
  - Database connectivity
  - Redis connectivity

### 6. **Uptime Kuma** (port 3002)
- **Purpose**: Service availability monitoring and alerts
- **Web UI**: http://localhost:3002
- **Features**:
  - Simple uptime monitoring
  - Multiple notification channels (email, Slack, Telegram, etc.)
  - Incident tracking
  - Response time monitoring

### 7. **Loki** (port 3100)
- **Purpose**: Log aggregation
- **Features**:
  - Cost-effective log storage
  - Integration with Grafana for log exploration
  - 30-day log retention

### 8. **Promtail** (port 9080)
- **Purpose**: Log collection agent
- **Collects**:
  - Docker container logs
  - Application logs
  - System logs
  - Nginx logs

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- At least 4GB of free RAM
- At least 20GB of free disk space

### Installation

1. **Navigate to the monitoring directory**:
   ```bash
   cd monitoring
   ```

2. **Start all monitoring services**:
   ```bash
   docker compose up -d
   ```

3. **Verify all services are running**:
   ```bash
   docker compose ps
   ```

4. **Access the monitoring tools**:
   - Grafana: http://localhost:3001 (admin / admin123)
   - Prometheus: http://localhost:9090
   - Uptime Kuma: http://localhost:3002
   - cAdvisor: http://localhost:8081

### Stopping the Stack

```bash
docker compose down
```

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f prometheus
docker compose logs -f grafana
```

## Configuration

### Prometheus Targets

Prometheus is configured to scrape the following targets:

**Server Metrics:**
- Node Exporter: http://host.docker.internal:9100/metrics

**Container Metrics:**
- cAdvisor: http://cadvisor:8080/metrics

**Application Metrics** (requires metrics endpoints on your services):
- API Gateway: http://host.docker.internal:5000/metrics
- Deceased Service: http://host.docker.internal:5001/metrics
- Auth Service: http://host.docker.internal:5002/metrics
- Frontend: http://host.docker.internal:3000/metrics

**Database Metrics** (requires exporters):
- MySQL: http://host.docker.internal:3306/metrics
- Redis: http://host.docker.internal:6379/metrics

**External Checks:**
- Blackbox Exporter probes all endpoints every 15-30 seconds

### Blackbox Exporter Monitored Endpoints

The Blackbox Exporter checks these endpoints:

**External:**
- https://restpoint.co.ke (every 30s)

**Internal:**
- http://localhost:80 (Nginx, every 15s)
- http://localhost:5000/health (API Gateway, every 15s)
- http://localhost:5001/health (Deceased Service, every 15s)
- http://localhost:5002/health (Auth Service, every 15s)
- http://localhost:3000 (Frontend, every 30s)
- localhost:3306 (MySQL, every 30s)
- localhost:6379 (Redis, every 30s)

### Adding Custom Metrics to Your Application

To expose metrics from your Node.js services, install the `prom-client` library:

```bash
npm install prom-client
```

Example implementation:

```javascript
const promClient = require('prom-client');

// Create a counter metric
const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Create a histogram for request duration
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Middleware to track requests
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    });
    httpRequestDuration.observe(
      { method: req.method, route: req.route?.path || req.path },
      duration
    );
  });

  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

## Grafana Dashboards

### Importing Dashboards

1. **Access Grafana**: http://localhost:3001
2. **Login**: admin / admin123
3. **Navigate to**: Dashboards → Import
4. **Use these popular dashboard IDs**:
   - **Node Exporter Full**: ID `1860`
   - **cAdvisor**: ID `893`
   - **Prometheus Stats**: ID `2`
   - **Blackbox Exporter**: ID `7587`
   - **Docker & System Monitoring**: ID `179`
   - **Application Metrics**: ID `4701`

### Creating Custom Dashboards

1. Click **+** → **Dashboard**
2. Add panels with Prometheus queries:
   - CPU Usage: `100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`
   - Memory Usage: `(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100`
   - Disk Usage: `100 - ((node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100)`
   - Container CPU: `rate(container_cpu_usage_seconds_total[5m]) * 100`
   - HTTP Request Rate: `rate(http_requests_total[5m])`

## Alerting

### Setting Up Alerts in Grafana

1. **Navigate to**: Alerting → Alert rules
2. **Create alert rule**:
   - **Name**: High CPU Usage
   - **Query**: `100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`
   - **Condition**: > 90 for 5 minutes
   - **Notification channel**: Email, Slack, Telegram, etc.

### Example Alerts to Create

**Critical Alerts:**
- CPU usage > 90% for 5 minutes
- Memory usage > 90% for 5 minutes
- Disk usage > 90%
- Service down (Blackbox Exporter)
- Response time > 2 seconds
- Error rate > 5%

**Warning Alerts:**
- CPU usage > 75% for 10 minutes
- Memory usage > 80% for 10 minutes
- Disk usage > 80%
- Response time > 1 second

## Uptime Kuma Setup

1. **Access Uptime Kuma**: http://localhost:3002
2. **Create admin account** (first time only)
3. **Add monitors**:
   - **HTTP(s)**: Monitor website availability
   - **Port**: Monitor TCP ports
   - **Ping**: Monitor server response time
   - **DNS**: Monitor DNS resolution

4. **Configure notifications**:
   - Email (SMTP)
   - Slack webhook
   - Telegram bot
   - Discord webhook
   - SMS (Twilio)

## Loki Log Queries

### Example LogQL Queries

**View all application errors:**
```logql
{service="restpoint"} |= "error"
```

**View logs from specific container:**
```logql
{container_name="restpoint-api-gateway"}
```

**Count errors per service:**
```logql
sum by (service) (count_over_time({service=~".+"} |= "error" [1h]))
```

**Search for specific error:**
```logql
{service="deceased-service"} |= "ECONNREFUSED"
```

## Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Check what's using the port
netstat -tulpn | grep :9090

# Stop the conflicting service or change the port in docker-compose.yml
```

**2. Metrics Not Appearing**
```bash
# Check if target is reachable
curl http://localhost:9100/metrics

# Check Prometheus targets
# Visit http://localhost:9090/targets
```

**3. High Disk Usage**
```bash
# Check Loki and Prometheus data volumes
docker volume ls
docker volume inspect monitoring_prometheus-data
docker volume inspect monitoring_loki-data

# Adjust retention in config files
```

**4. Container Not Starting**
```bash
# Check logs
docker compose logs <service-name>

# Restart specific service
docker compose restart <service-name>
```

## Production Deployment

### Security Considerations

1. **Change default passwords**:
   - Grafana admin password
   - Database passwords
   - API keys

2. **Enable authentication**:
   - Grafana: Enable auth proxy or OAuth
   - Prometheus: Enable basic auth or reverse proxy
   - Loki: Enable authentication

3. **Use HTTPS**:
   - Configure SSL certificates
   - Use reverse proxy (Nginx/Traefik)

4. **Network security**:
   - Use Docker networks
   - Expose only necessary ports
   - Configure firewall rules

### Scaling

**For high-traffic production:**
- Use external storage for Prometheus (not local volumes)
- Deploy Prometheus in HA mode
- Use Thanos or Cortex for long-term storage
- Increase retention period based on compliance needs
- Add more Loki distributors for high log volume

### Backup

**Backup critical data:**
```bash
# Backup Grafana dashboards
docker cp restpoint-grafana:/var/lib/grafana/dashboards ./backup/grafana-dashboards

# Backup Prometheus data
docker run --rm -v monitoring_prometheus-data:/data -v $(pwd)/backup:/backup alpine tar cvf /backup/prometheus-backup.tar /data

# Backup Loki data
docker run --rm -v monitoring_loki-data:/data -v $(pwd)/backup:/backup alpine tar cvf /backup/loki-backup.tar /data
```

## Maintenance

### Regular Tasks

**Weekly:**
- Review alert history
- Check disk usage
- Verify all targets are up

**Monthly:**
- Update Docker images
- Review and optimize queries
- Clean up old dashboards
- Review retention policies

**Quarterly:**
- Audit security settings
- Review alert thresholds
- Capacity planning

## Useful Commands

```bash
# Start monitoring stack
docker compose up -d

# Stop monitoring stack
docker compose down

# Restart specific service
docker compose restart prometheus

# View logs
docker compose logs -f <service-name>

# Check status
docker compose ps

# Update images
docker compose pull
docker compose up -d

# Access Prometheus CLI
docker exec -it restpoint-prometheus promtool

# Query Prometheus
curl 'http://localhost:9090/api/v1/query?query=up'

# Check Blackbox Exporter
curl 'http://localhost:9115/probe?target=google.com&module=http_2xx'
```

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Node Exporter](https://github.com/prometheus/node_exporter)
- [cAdvisor](https://github.com/google/cadvisor)
- [Blackbox Exporter](https://github.com/prometheus/blackbox_exporter)
- [Loki](https://grafana.com/docs/loki/latest/)
- [Uptime Kuma](https://github.com/louislam/uptime-kuma)

## Support

For issues with the monitoring stack, check:
1. Docker logs: `docker compose logs <service>`
2. Prometheus targets: http://localhost:9090/targets
3. Grafana logs: `docker logs restpoint-grafana`

## Load Testing

For comprehensive load testing with k6, InfluxDB, and Grafana, see [LOAD_TESTING.md](LOAD_TESTING.md).

The load testing setup includes:
- **K6** - Load and performance testing tool
- **InfluxDB** - Time-series database for test results
- **Grafana Dashboard** - Real-time test visualization
- **Application Metrics** - Track requests, errors, response times, database queries, and resource usage

### Quick Load Test

```bash
cd monitoring/load-testing
docker compose up -d
docker compose exec k6 run /scripts/load-test.js
```

Access load test results at: http://localhost:3003 (admin / admin123)

## License

This monitoring setup is part of the RestPoint funeral home management system.