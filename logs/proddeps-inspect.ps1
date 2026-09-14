cd 'c:\Users\User\Downloads\restpoint'
$f = 'C:\Users\User\AppData\Local\Temp\rp-proddeps-build.log'
docker build --target prod-deps -t rp-api-prod:dbg -f services/api-gateway/Dockerfile . *> $f 2>&1
"BUILD_EXIT=$LASTEXITCODE" | Add-Content $f
# Inspect the prod-deps stage's node_modules directly
$out = 'C:\Users\User\AppData\Local\Temp\rp-proddeps-inspect.txt'
"=== prod-deps stage inspection ===" | Set-Content $out
docker run --rm rp-api-prod:dbg sh -c 'ls node_modules | grep -iE "express|rate"; echo ---erl-root---; ls node_modules/express-rate-limit 2>&1; echo ---erl-nested---; ls services/api-gateway/node_modules/express-rate-limit 2>&1' *>> $out
"INSPECT_EXIT=$LASTEXITCODE" | Add-Content $out