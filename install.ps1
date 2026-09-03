[CmdletBinding(SupportsShouldProcess)]
param(
  [string]$InstallRoot = (Join-Path $env:LOCALAPPDATA 'Codex-FP'),
  [string]$Repository = 'https://github.com/luisfsill/Codex-FP',
  [string]$Ref = 'main',
  [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'
$invocationPath = (Get-Location).Path

if ($Uninstall) {
  $uninstaller = Join-Path $InstallRoot 'scripts\install-codex-feature-pipeline.ps1'
  if (Test-Path -LiteralPath $uninstaller) { & $uninstaller -Uninstall }
  if (($null -eq $PSCmdlet) -or $PSCmdlet.ShouldProcess($InstallRoot, 'Remove Codex FP installation')) {
    if (Test-Path -LiteralPath $InstallRoot) { Remove-Item -LiteralPath $InstallRoot -Recurse -Force }
  }
  exit 0
}

$zipUrl = "$Repository/archive/refs/heads/$Ref.zip"
$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ('codex-fp-' + [Guid]::NewGuid().ToString('N'))
$zipPath = Join-Path $tempRoot 'codex-fp.zip'
$extractRoot = Join-Path $tempRoot 'extract'

try {
  New-Item -ItemType Directory -Force -Path $tempRoot, $extractRoot | Out-Null
  Write-Host "Baixando Codex FP de $Repository ($Ref)..."
  Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing
  Expand-Archive -LiteralPath $zipPath -DestinationPath $extractRoot -Force
  $source = Get-ChildItem -LiteralPath $extractRoot -Directory | Select-Object -First 1
  if (-not $source) { throw 'O arquivo baixado não contém uma pasta de projeto válida.' }
  if (($null -eq $PSCmdlet) -or $PSCmdlet.ShouldProcess($InstallRoot, 'Install Codex FP')) {
    New-Item -ItemType Directory -Force -Path $InstallRoot | Out-Null
    Get-ChildItem -LiteralPath $source.FullName -Force | Copy-Item -Destination $InstallRoot -Recurse -Force
    $projectPath = if ((Test-Path -LiteralPath (Join-Path $invocationPath '.git')) -or (Test-Path -LiteralPath (Join-Path $invocationPath 'AGENTS.md')) -or (Test-Path -LiteralPath (Join-Path $invocationPath 'package.json'))) { $invocationPath } else { $null }
    & (Join-Path $InstallRoot 'scripts\install-codex-feature-pipeline.ps1') -ProjectPath $projectPath
    Write-Host "Codex FP instalado em $InstallRoot"
    node (Join-Path $InstallRoot 'bin\feature.js') --version
  }
}
finally {
  if (Test-Path -LiteralPath $tempRoot) { Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue }
}
