$buildLog = "$env:TEMP\rp-docker-build-api.log"
$reproOut = "$env:TEMP\rp-prodtest\install.out"

Write-Host "=== DOCKER BUILD LOG ==="
if (Test-Path $buildLog) {
  Write-Host "exists (length=$( (Get-Item $buildLog).Length ) bytes)"
  Get-Content $buildLog -Tail 15
} else {
  Write-Host "not found at $buildLog"
}

Write-Host ""
Write-Host "=== NPM REPRO ==="
if (Test-Path $reproOut) {
  Write-Host "exists"
  Get-Content $reproOut -Tail 20
} else {
  Write-Host "not found (still running?)"
}

Write-Host ""
Write-Host "=== DOCKER BUILDER PS ==="
docker builder ps --format '{{.ID}} {{.Name}} {{.State}}' 2>$null | Select-Object -Last 5