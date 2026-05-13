param(
  [string]$Email = "",
  [string]$RoleSearch = "admin"
)

$ErrorActionPreference = "Stop"

Write-Host "This helper now follows the first-Gmail-only admin policy. The -Email argument is ignored." -ForegroundColor Yellow
& (Join-Path $PSScriptRoot "bootstrap-first-gmail-admin.ps1") -RoleSearch $RoleSearch
exit $LASTEXITCODE
