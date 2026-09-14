$tmp = Join-Path $env:TEMP 'rp-prodtest'
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
New-Item -ItemType Directory -Path $tmp | Out-Null
$root = 'c:\Users\User\Downloads\restpoint'
Copy-Item -Path (Join-Path $root 'package.json') -Destination $tmp
Copy-Item -Path (Join-Path $root 'package-lock.json') -Destination $tmp
Copy-Item -Path (Join-Path $root 'tsconfig.base.json') -Destination $tmp
$ws = @('packages/shared-config','packages/shared-logger','packages/shared-utils','packages/shared-services','shared','services/api-gateway','services/auth-service')
foreach ($w in $ws) {
  $rel = $w -replace '/', '\'
  $d = Join-Path $tmp $rel
  New-Item -ItemType Directory -Path $d -Force | Out-Null
  Copy-Item -Path (Join-Path $root (Join-Path $rel 'package.json')) -Destination (Join-Path $d 'package.json')
}
Set-Location $tmp
$out = Join-Path $tmp 'install.out'
npm install --omit=dev --legacy-peer-deps --no-audit --no-fund *> $out 2>&1
Add-Content $out "INSTALL_EXIT=$LASTEXITCODE`nnpm install --omit=dev finished"
$report = @()
$report += "express root: $(Test-Path 'node_modules/express')"
$report += "express-rate-limit root: $(Test-Path 'node_modules/express-rate-limit')"
$report += "express-rate-limit root dist: $(Test-Path 'node_modules/express-rate-limit/dist/index.cjs')"
$report += "nested api-gw erl: $(Test-Path 'services/api-gateway/node_modules/express-rate-limit')"
$report += "nested api-gw erl dist: $(Test-Path 'services/api-gateway/node_modules/express-rate-limit/dist/index.cjs')"
$report += "nested auth express: $(Test-Path 'services/auth-service/node_modules/express')"
$report += "auth erl: $(Test-Path 'services/auth-service/node_modules/express-rate-limit')"
Add-Content $out $report