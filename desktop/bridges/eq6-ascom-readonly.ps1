# EQ6 ASCOM bridge (32-bit PowerShell)
# Azioni: discover | snapshot | disconnect | moveAxis | stopAxes
# moveAxis/stopAxes: SOLO MoveAxis. Nessun GOTO/Slew/Park/Sync/Tracking write.

param(
  [ValidateSet("discover", "snapshot", "disconnect", "moveAxis", "stopAxes")]
  [string]$Action = "snapshot",
  [string]$ProgId = "EQMOD.Telescope",
  [ValidateSet(0, 1)]
  [int]$Axis = 0,
  [double]$Rate = 0,
  [int]$TimeoutSec = 8
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

function Write-Json($obj) {
  $json = $obj | ConvertTo-Json -Compress -Depth 8
  [Console]::Out.WriteLine($json)
}

function Read-Prop($tel, $name) {
  try {
    $v = $tel.$name
    return @{ ok = $true; value = $v; error = $null }
  } catch {
    return @{ ok = $false; value = $null; error = $_.Exception.Message }
  }
}

function Get-AxisRatesList($tel, $axis) {
  $list = New-Object System.Collections.ArrayList
  try {
    $coll = $tel.AxisRates($axis)
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
    # leave empty
  }
  return ,@($list)
}

function Get-Snapshot($tel, $connectedFlag) {
  $propNames = @(
    "Name", "Description", "DriverInfo", "DriverVersion", "InterfaceVersion", "Connected",
    "RightAscension", "Declination", "Altitude", "Azimuth", "SiderealTime",
    "Tracking", "Slewing", "AtPark", "AtHome", "SideOfPier",
    "SiteLatitude", "SiteLongitude", "SiteElevation",
    "CanSlew", "CanSlewAsync", "CanPark", "CanUnpark", "CanSync", "CanSetTracking", "CanPulseGuide", "CanFindHome"
  )
  $props = @{}
  $capabilities = @{}
  foreach ($n in $propNames) {
    $r = Read-Prop $tel $n
    if ($r.ok) {
      $props[$n] = $r.value
      if ($n -like "Can*") { $capabilities[$n] = [bool]$r.value }
    } else {
      $props[$n] = $null
      $props[($n + "_error")] = $r.error
    }
  }

  $can0 = $false
  $can1 = $false
  try { $can0 = [bool]$tel.CanMoveAxis(0) } catch { $can0 = $false }
  try { $can1 = [bool]$tel.CanMoveAxis(1) } catch { $can1 = $false }
  $capabilities["CanMoveAxis0"] = $can0
  $capabilities["CanMoveAxis1"] = $can1
  $capabilities["CanMoveAxis"] = ($can0 -or $can1)

  $axisRates0 = Get-AxisRatesList $tel 0
  $axisRates1 = Get-AxisRatesList $tel 1

  $siteLat = $props["SiteLatitude"]
  $siteLon = $props["SiteLongitude"]
  $siteWarning = $true
  if ($null -ne $siteLat -and $null -ne $siteLon) {
    $lat = [double]$siteLat
    $lon = [double]$siteLon
    if ($lat -gt 40 -and $lat -lt 43 -and $lon -gt 11 -and $lon -lt 14) { $siteWarning = $false }
  }

  return [ordered]@{
    ok = $true
    action = "snapshot"
    progId = $ProgId
    connected = [bool]$connectedFlag
    liveState = if ($connectedFlag) { "LIVE" } else { "OFFLINE" }
    protocol = "ASCOM_EQMOD"
    comPort = "COM3"
    baud = 9600
    name = $props["Name"]
    description = $props["Description"]
    driverInfo = $props["DriverInfo"]
    driverVersion = $props["DriverVersion"]
    interfaceVersion = $props["InterfaceVersion"]
    ra = $props["RightAscension"]
    dec = $props["Declination"]
    altitude = $props["Altitude"]
    azimuth = $props["Azimuth"]
    siderealTime = $props["SiderealTime"]
    tracking = $props["Tracking"]
    slewing = $props["Slewing"]
    atPark = $props["AtPark"]
    atHome = $props["AtHome"]
    sideOfPier = $props["SideOfPier"]
    siteLatitude = $siteLat
    siteLongitude = $siteLon
    siteElevation = $props["SiteElevation"]
    siteWarning = $siteWarning
    siteWarningMessage = "Coordinate sito EQMOD da verificare"
    capabilities = $capabilities
    axisRates0 = $axisRates0
    axisRates1 = $axisRates1
    props = $props
    lastPollAt = (Get-Date).ToUniversalTime().ToString("o")
    source = "live"
    readOnly = $false
    motionCommandsSent = $false
  }
}

try {
  if ($Action -eq "discover") {
    $exists = $false
    $label = $null
    try {
      $reg = Get-ItemProperty "HKLM:\SOFTWARE\WOW6432Node\ASCOM\Telescope Drivers\EQMOD.Telescope" -ErrorAction Stop
      $exists = $true
      $label = [string]$reg.'(default)'
    } catch {}
    $comOk = $false
    try {
      $t = New-Object -ComObject $ProgId
      $comOk = $true
      try { [Runtime.InteropServices.Marshal]::ReleaseComObject($t) | Out-Null } catch {}
    } catch {}
    Write-Json ([ordered]@{
      ok = ($exists -or $comOk)
      action = "discover"
      progId = $ProgId
      registered = $exists
      label = $label
      comCreatable = $comOk
      protocol = "ASCOM_EQMOD"
      comPortHint = "COM3"
      baudHint = 9600
      motionCommandsSent = $false
    })
    exit 0
  }

  $tel = New-Object -ComObject $ProgId

  if ($Action -eq "disconnect") {
    # Soft disconnect: stop axes then leave EQMOD Connected as-is
    try {
      if ([bool]$tel.Connected) {
        try { if ([bool]$tel.CanMoveAxis(0)) { $tel.MoveAxis(0, 0) } } catch {}
        try { if ([bool]$tel.CanMoveAxis(1)) { $tel.MoveAxis(1, 0) } } catch {}
      }
    } catch {}
    try { [Runtime.InteropServices.Marshal]::ReleaseComObject($tel) | Out-Null } catch {}
    Write-Json ([ordered]@{
      ok = $true
      action = "disconnect"
      soft = $true
      connected = $null
      motionCommandsSent = $true
      stopAxes = $true
      message = "NovaSky disconnessa (assi fermati; EQMOD Connected invariato)"
    })
    exit 0
  }

  if ($Action -eq "stopAxes") {
    if (-not [bool]$tel.Connected) {
      Write-Json ([ordered]@{
        ok = $false
        action = "stopAxes"
        error = "not_connected"
        message = "Connected=false: impossibile fermare assi via ASCOM."
        motionCommandsSent = $false
      })
      try { [Runtime.InteropServices.Marshal]::ReleaseComObject($tel) | Out-Null } catch {}
      exit 2
    }
    $stopped = @()
    try {
      if ([bool]$tel.CanMoveAxis(0)) { $tel.MoveAxis(0, 0); $stopped += 0 }
    } catch {}
    try {
      if ([bool]$tel.CanMoveAxis(1)) { $tel.MoveAxis(1, 0); $stopped += 1 }
    } catch {}
    $slewing = $false
    try { $slewing = [bool]$tel.Slewing } catch {}
    try { [Runtime.InteropServices.Marshal]::ReleaseComObject($tel) | Out-Null } catch {}
    Write-Json ([ordered]@{
      ok = $true
      action = "stopAxes"
      stoppedAxes = $stopped
      slewing = $slewing
      motionCommandsSent = $true
    })
    exit 0
  }

  if ($Action -eq "moveAxis") {
    if (-not [bool]$tel.Connected) {
      Write-Json ([ordered]@{
        ok = $false
        action = "moveAxis"
        error = "not_connected"
        message = "Connected=false: nessun movimento inviato."
        motionCommandsSent = $false
      })
      try { [Runtime.InteropServices.Marshal]::ReleaseComObject($tel) | Out-Null } catch {}
      exit 2
    }
    $can = $false
    try { $can = [bool]$tel.CanMoveAxis($Axis) } catch { $can = $false }
    if (-not $can) {
      Write-Json ([ordered]@{
        ok = $false
        action = "moveAxis"
        error = "capability_denied"
        message = "CanMoveAxis($Axis)=false: comando disabilitato."
        axis = $Axis
        rate = $Rate
        motionCommandsSent = $false
      })
      try { [Runtime.InteropServices.Marshal]::ReleaseComObject($tel) | Out-Null } catch {}
      exit 3
    }

    # Clamp rate to AxisRates maximum (absolute)
    $maxRate = 3.34
    try {
      $rates = Get-AxisRatesList $tel $Axis
      if ($rates.Count -gt 0 -and $null -ne $rates[0].Maximum) {
        $maxRate = [double]$rates[0].Maximum
      }
    } catch {}
    if ($maxRate -le 0) { $maxRate = 3.34 }
    $abs = [Math]::Abs([double]$Rate)
    if ($abs -gt $maxRate) { $abs = $maxRate }
    # Safety floor: never exceed 0.5 deg/s from NovaSky UI path unless already lower
    if ($abs -gt 0.5) { $abs = 0.5 }
    $signed = if ($Rate -lt 0) { -$abs } else { $abs }

    $tel.MoveAxis($Axis, $signed)
    $slewing = $false
    try { $slewing = [bool]$tel.Slewing } catch {}
    try { [Runtime.InteropServices.Marshal]::ReleaseComObject($tel) | Out-Null } catch {}
    Write-Json ([ordered]@{
      ok = $true
      action = "moveAxis"
      axis = $Axis
      rate = $signed
      slewing = $slewing
      motionCommandsSent = $true
    })
    exit 0
  }

  # snapshot
  $connected = $false
  $lastErr = $null
  for ($attempt = 1; $attempt -le 4; $attempt++) {
    try {
      $already = $false
      try { $already = [bool]$tel.Connected } catch { $already = $false }
      if ($already) {
        $connected = $true
        break
      }
      $tel.Connected = $true
      Start-Sleep -Milliseconds (250 * $attempt)
      $connected = [bool]$tel.Connected
      if ($connected) { break }
    } catch {
      $lastErr = $_.Exception.Message
      Start-Sleep -Milliseconds 500
    }
  }
  if (-not $connected) {
    Write-Json ([ordered]@{
      ok = $false
      action = "snapshot"
      error = "connect_failed"
      message = $(if ($lastErr) { $lastErr } else { "EQMOD non connesso. In EQASCOM premi Connect su COM3, poi riprova in NovaSky." })
      liveState = "ERROR"
      motionCommandsSent = $false
    })
    try { [Runtime.InteropServices.Marshal]::ReleaseComObject($tel) | Out-Null } catch {}
    exit 2
  }

  $snap = Get-Snapshot $tel $connected
  try { [Runtime.InteropServices.Marshal]::ReleaseComObject($tel) | Out-Null } catch {}
  Write-Json $snap
  exit 0
} catch {
  Write-Json ([ordered]@{
    ok = $false
    action = $Action
    error = "bridge_exception"
    message = $_.Exception.Message
    liveState = "ERROR"
    motionCommandsSent = $false
  })
  exit 1
}
