cd 'c:\Users\User\Downloads\restpoint'
$log = 'C:\Users\User\AppData\Local\Temp\rp-guard-test-build.log'
"START $(Get-Date -Format o) — building prod-deps stage WITH guard (cache-reuse expected)" | Set-Content $log
docker build --target prod-deps -t guard-test:ag -f services/api-gateway\Dockerfile . *>> $log 2>&1
"BUILD_EXIT=$LASTEXITCODE $(Get-Date -Format o)" | Add-Content $log
"=== guard result tail ===" | Add-Content $log
docker run --rm guard-test:ag sh -c 'ls node_modules | grep -iE "express|rate"; echo ---erl---; ls node_modules/express-rate-limit 2>&1' *>> $log 2>&1
"INSPECT_EXIT=$LASTEXITCODE" | Add-Content $log
