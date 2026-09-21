$files = @(
  'coffins\coffininventory.jsx','coffins\registerCoffin.jsx','coffins\coffinDetails.jsx',
  'coffins\coffinselectModal.jsx','coffins\coffinTransfers.jsx','coffins\ReservationDashboard.jsx',
  'leave\LeavePage.jsx','leave\Dashboard.jsx','leave\ApplyLeave.jsx','leave\MyLeaves.jsx',
  'leave\AllLeaves.jsx','leave\EmpTable.jsx','leave\LeaveCalendar.jsx','leave\ApproveLeave.jsx',
  'florists\FlowerBookingsNew.jsx','florists\FlowerOrderDetail.jsx','florists\FlowerSnowBookingForm.jsx'
)
$base = 'C:\Users\User\Downloads\restpoint\FrontendClient\client\src\components'
foreach ($f in $files) {
  $p = Join-Path $base $f
  if (-not (Test-Path $p)) { "$f | MISSING"; continue }
  $c = Get-Content $p
  $styleBlocks = ($c | Select-String -Pattern '<style').Count
  $styled = ($c | Select-String -Pattern 'styled\.').Count
  $flexInline = ($c | Select-String -Pattern 'display: .flex.').Count
  $media = ($c | Select-String -Pattern '@media').Count
  $grid = ($c | Select-String -Pattern 'gridTemplateColumns|grid-template-columns').Count
  "$f | styleBlocks=$styleBlocks | styledComponents=$styled | inlineFlex=$flexInline | grid=$grid | media=$media | lines=$($c.Count)"
}
