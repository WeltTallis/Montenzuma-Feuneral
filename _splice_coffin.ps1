$ErrorActionPreference = 'Stop'
$f = 'c:\Users\User\Downloads\restpoint\FrontendClient\client\src\components\coffins\coffininventory.jsx'
$lines = [System.Collections.Generic.List[string]](Get-Content $f)

function IdxOf([string]$pat) {
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match $pat) { return $i }
    }
    return -1
}

# 1) Remove old inline renderTransfers (its leading comment through closing brace)
$s = IdxOf 'const renderTransfers = \(\) => \{'
$m = IdxOf 'Main Render'
Write-Output "renderTransfers idx: $s  MainRender idx: $m"
if ($s -lt 0 -or $m -lt 0 -or $m -le $s) { throw 'markers not found' }
$lines.RemoveRange($s - 1, $m - $s)
$lines.Insert($s - 1, '  // Transfers tab UI extracted into ./coffinTransfers.jsx (rendered as <CoffinTransfers /> below)')

# 2) Replace old usage with component mount
$u = IdxOf "tab === 'transfers' && renderTransfers\(\)"
Write-Output "usage idx: $u"
if ($u -lt 0) { throw 'usage not found' }
$newUse = [string[]]@(
    "      {tab === 'transfers' && (",
    '        <CoffinTransfers',
    '          stockRequests={stockRequests}',
    '          coffins={coffins}',
    '          branches={branches}',
    '          currentBranch={currentBranch}',
    '          onStockAction={handleStockAction}',
    '          onRefresh={fetchAllData}',
    '        />',
    '      )}'
)
$lines.RemoveAt($u)
$lines.InsertRange($u, $newUse)

# 3) Remove lifted transfer state (comment + 3 useState lines)
$t = IdxOf 'const \[transferTab'
Write-Output "state idx: $t"
if ($t -lt 0) { throw 'state not found' }
$lines.RemoveRange($t - 1, 4)

# 4) pendingReqCount -> count pending in BOTH directions
$p = IdxOf 'const pendingReqCount'
Write-Output "pendingCount idx: $p"
if ($p -lt 0) { throw 'pendingReqCount not found' }
$newP = [string[]]@(
    '  const pendingReqCount = stockRequests.filter(',
    '    (r) =>',
    "      r.status === 'pending' &&",
    '      (r.from_branch_id == currentBranch || r.to_branch_id == currentBranch),',
    '  ).length;'
)
$lines.RemoveAt($p)
$lines.InsertRange($p, $newP)

Set-Content -Path $f -Value $lines -Encoding UTF8
Write-Output "DONE. New line count: $($lines.Count)"
