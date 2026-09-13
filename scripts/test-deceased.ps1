$ErrorActionPreference = 'SilentlyContinue'
docker rm -f dtest 2>$null
$ErrorActionPreference = 'Stop'
$proc = Start-Process -FilePath 'docker' -ArgumentList 'run','--rm','--name','dtest','-e','LOKI_ENABLED=false','restpoint-deceased-service:latest' -RedirectStandardOutput 'scripts\deceased-out.log' -RedirectStandardError 'scripts\deceased-err.log' -PassThru -Wait -NoNewWindow
Write-Host "EXIT CODE: $($proc.ExitCode)"
Write-Host '=== STDERR (app output) ==='
Get-Content scripts\deceased-err.log -Raw
Write-Host '=== STDOUT ==='
Get-Content scripts\deceased-out.log -Raw
