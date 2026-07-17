# Verifica LIVE Alpaca (PowerShell) — nessun Node richiesto
# Uso: collegati all'hotspot Seestar, poi:
#   powershell -ExecutionPolicy Bypass -File scripts/verify-seestar-live.ps1

$ErrorActionPreference = "Continue"
$hostIp = "10.0.0.1"
$port = 32323
$base = "http://${hostIp}:${port}"
$clientId = 42
$tx = 1

function Get-Alpaca([string]$Path) {
  $script:tx++
  $url = "$base$Path" + "?ClientID=$clientId&ClientTransactionID=$tx"
  try {
    $r = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing
    $j = $r.Content | ConvertFrom-Json
    return [pscustomobject]@{ Ok = ($j.ErrorNumber -eq 0); Value = $j.Value; Err = $j.ErrorNumber; Msg = $j.ErrorMessage; Url = $url }
  } catch {
    return [pscustomobject]@{ Ok = $false; Value = $null; Err = -1; Msg = $_.Exception.Message; Url = $url }
  }
}

Write-Host "=== NovaSky Seestar LIVE verify (GET only) ===" -ForegroundColor Cyan
$cfg = Get-Alpaca "/management/v1/configureddevices"
if (-not $cfg.Ok) {
  Write-Host "FAIL configureddevices: $($cfg.Msg)" -ForegroundColor Red
  Write-Host "Collega il PC all'hotspot S30 Pro e riprova."
  exit 1
}
$tels = @($cfg.Value | Where-Object { $_.DeviceType -match 'Telescope' })
$cams = @($cfg.Value | Where-Object { $_.DeviceType -match 'Camera' })
Write-Host "OK Telescope count=$($tels.Count) Camera count=$($cams.Count)"
if ($tels.Count -lt 1) { Write-Host "FAIL: no Telescope"; exit 1 }

$n = [int]$tels[0].DeviceNumber
$props = @("name","rightascension","declination","altitude","azimuth","tracking","slewing","atpark","athome","connected","driverversion")
foreach ($p in $props) {
  $r = Get-Alpaca "/api/v1/telescope/$n/$p"
  if ($r.Ok) { Write-Host ("OK  telescope[{0}].{1} = {2}" -f $n, $p, ($r.Value | ConvertTo-Json -Compress)) }
  else { Write-Host ("FAIL telescope[{0}].{1} err={2} {3}" -f $n, $p, $r.Err, $r.Msg) -ForegroundColor Yellow }
}

Write-Host "=== Done (no PUT / no motion) ===" -ForegroundColor Green
