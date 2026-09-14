cd 'c:\Users\User\Downloads\restpoint'
docker build -t restpoint-api-gateway:test -f services/api-gateway/Dockerfile . *> "$env:TEMP\rp-docker-build-api.log" 2>&1
Write-Output "docker build exit: $LASTEXITCODE" | Add-Content "$env:TEMP\rp-docker-build-api.log"