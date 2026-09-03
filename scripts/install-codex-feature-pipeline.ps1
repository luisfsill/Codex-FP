param([switch]$Uninstall)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$bin = Join-Path $env:USERPROFILE '.local\bin'
New-Item -ItemType Directory -Force -Path $bin | Out-Null
foreach ($name in @('feature.cmd','codex-feature.cmd')) {
  $target = Join-Path $bin $name
  if ($Uninstall) { if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Force }; continue }
  Set-Content -LiteralPath $target -Value "@echo off`r`nnode `"$root\bin\feature.js`" %*`r`n" -Encoding ascii
}
if (-not $Uninstall) { Write-Host 'Instalado. Feche e abra o terminal se necessário.'; node (Join-Path $root 'bin\feature.js') --version } else { Write-Host 'Desinstalado.' }
