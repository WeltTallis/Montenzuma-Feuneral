# Sequential, memory-safe builds of the critical-path services.
$ErrorActionPreference = 'Continue'
$wd = 'c:\Users\User\Downloads\restpoint'
Set-Location $wd

function Wait-BuildIdle {
    # Wait until no BuildKit build is marked Running.
    while ($true) {
        $lines = docker buildx history ls 2>$null
        $running = @($lines | Where-Object { $_ -match '\sRunning\s' })
        if ($running.Count -eq 0) { break }
        Start-Sleep -Seconds 15
    }
}

$services = @(
    'auth-service',
    'tenant-service',
    'frontend'
)

foreach ($svc in $services) {
    Wait-BuildIdle
    "=== $(Get-Date -Format 'HH:mm:ss') building $svc ===" | Add-Content "$wd\bc-seq.log"
    docker compose -f docker-compose.yml build $svc 2>&1 | Add-Content "$wd\bc-seq.log"
    "=== $(Get-Date -Format 'HH:mm:ss') $svc exit=$LASTEXITCODE ===" | Add-Content "$wd\bc-seq.log"
}

"ALL-DONE $(Get-Date -Format 'HH:mm:ss')" | Add-Content "$wd\bc-seq.log"
