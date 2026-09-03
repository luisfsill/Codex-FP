param([switch]$Uninstall, [string]$ProjectPath)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$bin = Join-Path $env:USERPROFILE '.local\bin'
New-Item -ItemType Directory -Force -Path $bin | Out-Null
foreach ($name in @('feature.cmd','codex-feature.cmd')) {
  $target = Join-Path $bin $name
  if ($Uninstall) { if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Force }; continue }
  if (Test-Path -LiteralPath $target) {
    $existing = Get-Content -LiteralPath $target -Raw
    if (($existing -notmatch 'Codex Feature Pipeline launcher') -and ($existing -notmatch 'bin\\feature\.js')) { throw "Launcher existente não pertence ao Codex FP: $target" }
  }
  Set-Content -LiteralPath $target -Value "@echo off`r`nrem Codex Feature Pipeline launcher`r`nnode `"$root\bin\feature.js`" %*`r`n" -Encoding ascii
}
if (-not $Uninstall) {
  $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
  $pathEntries = @($userPath -split ';' | Where-Object { $_ })
  if ($pathEntries -notcontains $bin) {
    [Environment]::SetEnvironmentVariable('Path', (($pathEntries + $bin) -join ';'), 'User')
  }
  if (($env:Path -split ';') -notcontains $bin) { $env:Path = "$env:Path;$bin" }
  Write-Host 'Codex FP instalado.'
  node (Join-Path $root 'bin\feature.js') --version
  if ($ProjectPath) { node (Join-Path $root 'bin\feature.js') install-project --project $ProjectPath }
} else { Write-Host 'Desinstalado. A entrada de PATH foi preservada para não afetar outras ferramentas em .local\bin.' }
