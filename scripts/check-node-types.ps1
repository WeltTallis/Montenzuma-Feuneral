$locations = @(
    "packages\shared-config\node_modules\@types\node",
    "packages\shared-logger\node_modules\@types\node",
    "packages\shared-services\node_modules\@types\node",
    "packages\shared-stamps\node_modules\@types\node",
    "packages\shared-utils\node_modules\@types\node",
    "services\api-gateway\node_modules\@types\node",
    "services\bodycheckout-service\node_modules\@types\node",
    "services\coffin-service\node_modules\@types\node",
    "services\deceased-service\node_modules\@types\node",
    "services\invoice-service\node_modules\@types\node",
    "services\tenant-service\node_modules\@types\node",
    "services\uploads-service\node_modules\@types\node"
)

foreach ($loc in $locations) {
    if (Test-Path $loc) {
        $buf = Join-Path $loc 'buffer.d.ts'
        $proc = Join-Path $loc 'process.d.ts'
        $crypto = Join-Path $loc 'crypto.d.ts'
        $bufSize = if (Test-Path $buf) { (Get-Item $buf).Length } else { 'MISSING' }
        $procSize = if (Test-Path $proc) { (Get-Item $proc).Length } else { 'MISSING' }
        $cryptoSize = if (Test-Path $crypto) { (Get-Item $crypto).Length } else { 'MISSING' }
        Write-Output "$loc | buffer=$bufSize | process=$procSize | crypto=$cryptoSize"
    }
}