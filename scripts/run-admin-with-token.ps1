$ErrorActionPreference = "Stop"

$adminScript = Join-Path $PSScriptRoot "bootstrap-first-gmail-admin.ps1"
if (!(Test-Path -LiteralPath $adminScript)) {
  Write-Host "Admin helper was not found at $adminScript" -ForegroundColor Red
  exit 1
}

Write-Host "Paste a current SELISE admin bearer access token below." -ForegroundColor Cyan
Write-Host "The token will be used only for this PowerShell process and will not be printed or saved." -ForegroundColor DarkGray

$secureToken = Read-Host "SELISE access token" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
try {
  $plainToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

if (!$plainToken) {
  Write-Host "No token was entered. No role changes were made." -ForegroundColor Yellow
  exit 2
}

$env:SELISE_ACCESS_TOKEN = $plainToken
try {
  & $adminScript
  exit $LASTEXITCODE
} finally {
  Remove-Item Env:SELISE_ACCESS_TOKEN -ErrorAction SilentlyContinue
}
