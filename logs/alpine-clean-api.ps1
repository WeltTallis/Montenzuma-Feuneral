# CLEAN alpine npm install mirroring the prod-deps stage for api-gateway ONLY
# (no auth-service manifest), starting from empty node_modules.
$work = Join-Path $env:TEMP 'rp-alpine-api'
if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item -ItemType Directory -Path $work | Out-Null
$root = 'c:\Users\User\Downloads\restpoint'

function cpman([string]$rel) {
  $src = Join-Path $root "$rel\package.json"
  $dst = Join-Path $work "$rel\package.json"
  $dstDir = Split-Path $dst
  if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
  Copy-Item -Path $src -Destination $dst
}

Copy-Item -Path (Join-Path $root 'package.json') -Destination $work
Copy-Item -Path (Join-Path $root 'package-lock.json') -Destination $work
Copy-Item -Path (Join-Path $root 'tsconfig.base.json') -Destination $work
Copy-Item -Path (Join-Path $root 'C:\Users\User\AppData\Local\Temp\rp-prodtest\check.js') -Destination (Join-Path $work 'check.js')

foreach ($w in @('packages/shared-config','packages/shared-logger','packages/shared-utils','packages/shared-services','shared','services/api-gateway')) { cpman $w }

$report = Join-Path $work 'report.txt'
'=== CLEAN alpine install (api-gateway only, --omit=dev) ===' | Set-Content $report
"PWD: $work" | Add-Content $report
# Ensure the container sees a CLEAN workspace (no pre-existing node_modules)
docker run --rm -v "$($work.Replace('\','/')):/work" -w /work node:24-alpine sh -c 'rm -rf node_modules packages/*/node_modules shared/node_modules services/*/node_modules; npm install --omit=dev --legacy-peer-deps --no-audit --no-fund > /work/install.log 2>&1; node /work/check.js' *>> $report
"EXIT=$LASTEXITCODE" | Add-Content $report
'--- npm summary ---' | Add-Content $report
Select-String -Path (Join-Path $work 'install.log') -Pattern 'added|omitted|removed|npm ERR|npm warn' -CaseSensitive:$false | Select-Object -Last 6 | ForEach-Object { $_.Line } | Add-Content $report