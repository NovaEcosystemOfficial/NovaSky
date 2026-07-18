# Probe CanMoveAxis / AxisRates — READ ONLY, no MoveAxis calls
$ErrorActionPreference = "Continue"
$tel = New-Object -ComObject EQMOD.Telescope
$out = [ordered]@{}
try {
  if (-not [bool]$tel.Connected) { $tel.Connected = $true }
  Start-Sleep -Milliseconds 300
  $out.Connected = [bool]$tel.Connected
  $out.CanMoveAxis0 = [bool]$tel.CanMoveAxis(0)
  $out.CanMoveAxis1 = [bool]$tel.CanMoveAxis(1)
  try { $out.CanMoveAxis2 = [bool]$tel.CanMoveAxis(2) } catch { $out.CanMoveAxis2 = $null }

  function Get-Rates($telescope, $axis) {
    $list = New-Object System.Collections.ArrayList
    try {
      $coll = $telescope.AxisRates($axis)
      $count = 0
      try { $count = [int]$coll.Count } catch { $count = 0 }
      if ($count -gt 0) {
        for ($i = 1; $i -le $count; $i++) {
          $r = $coll.Item($i)
          [void]$list.Add([ordered]@{ Minimum = [double]$r.Minimum; Maximum = [double]$r.Maximum })
        }
      } else {
        foreach ($r in @($coll)) {
          [void]$list.Add([ordered]@{ Minimum = [double]$r.Minimum; Maximum = [double]$r.Maximum })
        }
      }
    } catch {
      [void]$list.Add([ordered]@{ error = $_.Exception.Message })
    }
    return ,@($list)
  }

  $out.AxisRates0 = Get-Rates $tel 0
  $out.AxisRates1 = Get-Rates $tel 1
  $out.Slewing = [bool]$tel.Slewing
  $out.Tracking = [bool]$tel.Tracking
} catch {
  $out.error = $_.Exception.Message
}
try { [Runtime.InteropServices.Marshal]::ReleaseComObject($tel) | Out-Null } catch {}
$out | ConvertTo-Json -Compress -Depth 6
