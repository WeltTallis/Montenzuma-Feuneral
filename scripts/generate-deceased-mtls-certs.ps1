$ErrorActionPreference = 'Stop'

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$certificateRoot = Join-Path $repositoryRoot 'secrets\deceased-mtls'
$caDirectory = Join-Path $certificateRoot 'ca'
$serverDirectory = Join-Path $certificateRoot 'deceased'
$gatewayDirectory = Join-Path $certificateRoot 'gateway'

if (Test-Path (Join-Path $caDirectory 'ca.key')) {
    throw "A CA already exists at $caDirectory. Refusing to overwrite it."
}
foreach ($directory in @($caDirectory, $serverDirectory, $gatewayDirectory)) {
    if ((Test-Path $directory) -and (Get-ChildItem -Force $directory | Select-Object -First 1)) {
        throw "Certificate directory is not empty: $directory"
    }
}
foreach ($directory in @($caDirectory, $serverDirectory, $gatewayDirectory)) {
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
}

$openssl = Get-Command openssl -ErrorAction SilentlyContinue
if (-not $openssl) {
    throw 'OpenSSL is required. Install OpenSSL and rerun this script.'
}

function Invoke-OpenSsl {
    param([string[]]$Arguments)
    & $openssl.Source @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "OpenSSL failed: $($Arguments -join ' ')"
    }
}

$caKey = Join-Path $caDirectory 'ca.key'
$caCertificate = Join-Path $caDirectory 'ca.crt'
Invoke-OpenSsl @(
    'req', '-new', '-x509', '-sha256', '-days', '3650',
    '-newkey', 'rsa:4096', '-nodes',
    '-keyout', $caKey, '-out', $caCertificate,
    '-subj', '/CN=Restpoint Internal CA',
    '-addext', 'basicConstraints=critical,CA:TRUE',
    '-addext', 'keyUsage=critical,keyCertSign,cRLSign'
)

$serverKey = Join-Path $serverDirectory 'tls.key'
$serverRequest = Join-Path $serverDirectory 'tls.csr'
$serverCertificate = Join-Path $serverDirectory 'tls.crt'
$serverExtensions = Join-Path $serverDirectory 'tls.ext'
@'
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=DNS:restpoint_deceased_service,DNS:deceased-service
'@ | Set-Content -Encoding ascii -Path $serverExtensions
Invoke-OpenSsl @(
    'req', '-new', '-newkey', 'rsa:3072', '-nodes',
    '-keyout', $serverKey, '-out', $serverRequest,
    '-subj', '/CN=restpoint_deceased_service'
)
Invoke-OpenSsl @(
    'x509', '-req', '-in', $serverRequest,
    '-CA', $caCertificate, '-CAkey', $caKey, '-CAcreateserial',
    '-out', $serverCertificate, '-days', '397', '-sha256',
    '-extfile', $serverExtensions
)
Copy-Item $caCertificate (Join-Path $serverDirectory 'ca.crt')

$clientKey = Join-Path $gatewayDirectory 'tls.key'
$clientRequest = Join-Path $gatewayDirectory 'tls.csr'
$clientCertificate = Join-Path $gatewayDirectory 'tls.crt'
$clientExtensions = Join-Path $gatewayDirectory 'tls.ext'
@'
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=clientAuth
'@ | Set-Content -Encoding ascii -Path $clientExtensions
Invoke-OpenSsl @(
    'req', '-new', '-newkey', 'rsa:3072', '-nodes',
    '-keyout', $clientKey, '-out', $clientRequest,
    '-subj', '/CN=restpoint_api_gateway'
)
Invoke-OpenSsl @(
    'x509', '-req', '-in', $clientRequest,
    '-CA', $caCertificate, '-CAkey', $caKey, '-CAcreateserial',
    '-out', $clientCertificate, '-days', '397', '-sha256',
    '-extfile', $clientExtensions
)
Copy-Item $caCertificate (Join-Path $gatewayDirectory 'ca.crt')

Write-Host 'Generated a private CA, deceased-service certificate, and gateway client certificate.'
Write-Host 'Keep secrets/deceased-mtls/ca/ca.key offline; do not mount it into containers or commit it.'
Write-Host 'Mount the deceased/ and gateway/ directories read-only. Restrict tls.key access to the service runtime.'
