# Repro: npm install --omit=dev inside node:24-alpine, mirroring the prod-deps stage.
$work = 'C:\Users\User\AppData\Local\Temp\rp-prodtest'
$report = Join-Path $work 'alpine-report.txt'
"=== alpine repro (prod-deps logic) ====" | Set-Content $report
docker run --rm -v "$($work.Replace('\','/')):/work" -w /work node:24-alpine sh -c 'npm install --omit=dev --legacy-peer-deps --no-audit --no-fund > /work/alpine-install.log 2>&1; node /work/check.js' *>> $report
"EXIT=$LASTEXITCODE" | Add-Content $report
"=== npm summary from alpine-install.log ===" | Add-Content $report
Select-String -Path (Join-Path $work 'alpine-install.log') -Pattern 'added|omitted|removed|npm ERR|npm warn' -CaseSensitive:$false | Select-Object -Last 8 | ForEach-Object { $_.Line } | Add-Content $report
Write-Output "alpine repro finished; report at $report"