# Fast, bounded poll of the Docker daemon npipe (avoids the docker CLI hang
# that occurs when the daemon is down — docker info blocks on the dead socket).
try {
  $np = New-Object System.IO.Pipes.NamedPipeClientStream('.', 'dockerDesktopLinuxEngine', 'In')
  $np.Connect(4000)
  Write-Output ('npipe_connected=' + $np.IsConnected)
  $np.Close()
} catch {
  Write-Output ('npipe_error: ' + $_.Exception.Message)
}
