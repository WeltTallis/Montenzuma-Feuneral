function TestTree([string]$label, [string]$work) {
  Set-Location $work
  "= $label ="
  npm ls express express-rate-limit express-async-handler rate-limit-redis --omit=dev --legacy-peer-deps --package-lock-only --all 2>&1 | Select-String -Pattern 'express', 'rate', 'npm ERR', 'empty' | Select-Object -Last 25
  ""
}

$root = 'c:\Users\User\Downloads\restpoint'
$w1 = 'C:\Users\User\AppData\Local\Temp\rp-alpine-api'   # api-gateway ONLY (already has manifests + check.js)
$w2 = 'C:\Users\User\AppData\Local\Temp\rp-alpine-full'  # ALL services manifests

# Build the full-manifest dir
if (Test-Path $w2) { Remove-Item $w2 -Recurse -Force }
New-Item -ItemType Directory -Path $w2 | Out-Null
Copy-Item -Path "$root\package.json" -Destination $w2
Copy-Item -Path "$root\package-lock.json" -Destination $w2
Copy-Item -Path "$root\tsconfig.base.json" -Destination $w2
foreach ($svc in (Get-ChildItem "$root\services" -Directory | ForEach-Object { $_.Name })) {
  $pkg = "$root\services\$svc\package.json"
  if (Test-Path $pkg) { New-Item -ItemType Directory -Path "$w2\services\$svc" -Force | Out-Null; Copy-Item -Path $pkg -Destination "$w2\services\$svc\package.json" }
}
foreach ($p in (Get-ChildItem "$root\packages" -Directory | ForEach-Object { $_.Name })) {
  $pkg = "$root\packages\$p\package.json"
  if (Test-Path $pkg) { New-Item -ItemType Directory -Path "$w2\packages\$p" -Force | Out-Null; Copy-Item -Path $pkg -Destination "$w2\packages\$p\package.json" }
}
if (Test-Path "$root\shared\package.json") { New-Item -ItemType Directory -Path "$w2\shared" -Force | Out-Null; Copy-Item -Path "$root\shared\package.json" -Destination "$w2\shared\package.json" }

TestTree 'api-gateway ONLY (--omit=dev)' $w1
TestTree 'ALL services (--omit=dev)' $w2