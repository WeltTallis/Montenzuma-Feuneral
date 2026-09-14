$log = 'C:\Users\User\AppData\Local\Temp\rp-docker-build-api.log'
Write-Output "=== npm summary in docker build log ==="
if (Test-Path $log) {
  Select-String -Path $log -Pattern 'added|omitted|removed|npm ERR|npm warn|express-rate-limit' -CaseSensitive:$false | Select-Object -Last 20 | ForEach-Object { $_.Line }
} else {
  Write-Output "no build log"
}
Write-Output "=== node_modules grep (context excludes?) ==="
Select-String -Path $log -Pattern 'node_modules' -CaseSensitive:$false | Select-Object -Last 15 | ForEach-Object { $_.Line }