$ErrorActionPreference = 'Continue'
$f = Join-Path $PSScriptRoot 'dtest-result.txt'
try {
  docker rm -f dtest 2>$null | Out-Null
  $cid = docker run -d --name dtest -e LOKI_ENABLED=false restpoint-deceased-service:latest 2>&1
  Start-Sleep -Seconds 15
  $running = docker ps --filter name=dtest --format '{{.Names}}' 2>&1
  $logs = docker logs dtest 2>&1
  docker rm -f dtest 2>$null | Out-Null
  if ($running -match 'dtest') {
    "HEALTHY: container stayed running 15s after start. Logs:" | Out-File $f -Encoding utf8
    $logs | Out-File $f -Append -Encoding utf8
  } else {
    "CRASHED: container exited within 15s. Logs:" | Out-File $f -Encoding utf8
    $logs | Out-File $f -Append -Encoding utf8
  }
} catch {
  "ERROR: $($_.Exception.Message)" | Out-File $f -Encoding utf8
}
