Set-Location 'C:\Users\User\AppData\Local\Temp\rp-alpine-api'
'=== api-gateway-only | npm ls --omit=dev --package-lock-only (express-rate-limit, express) ===' >> 'C:\Users\User\Downloads\restpoint\logs\lsone-out.txt'
npm ls express-rate-limit express --omit=dev --legacy-peer-deps --package-lock-only --all 2>&1 | Out-File -Append -FilePath 'C:\Users\User\Downloads\restpoint\logs\lsone-out.txt' -Encoding utf8
"DONE rc=$LASTEXITCODE" >> 'C:\Users\User\Downloads\restpoint\logs\lsone-out.txt'
'done marker written'