param(
  [string]$Email = "asafur.rahman@northsouth.edu",
  [string]$RoleSearch = "admin"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot

function Import-DotEnv {
  param([string]$Path)
  if (!(Test-Path -LiteralPath $Path)) {
    return
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if (!$line -or $line.StartsWith("#") -or !$line.Contains("=")) {
      return
    }

    $name, $value = $line.Split("=", 2)
    $name = $name.Trim()
    $value = $value.Trim().Trim('"').Trim("'")
    $currentValue = [Environment]::GetEnvironmentVariable($name, "Process")
    if ($name -and !$currentValue) {
      Set-Item -Path "Env:$name" -Value $value
    }
  }
}

function Get-FirstProperty {
  param(
    [object]$Object,
    [string[]]$Names
  )

  foreach ($name in $Names) {
    if ($null -ne $Object -and $Object.PSObject.Properties[$name] -and $null -ne $Object.$name -and "$($Object.$name)" -ne "") {
      return $Object.$name
    }
  }

  return $null
}

function Get-ResponseItems {
  param([object]$Response)

  $candidates = @(
    $Response.data,
    $Response.items,
    $Response.result,
    $Response.Data,
    $Response.Items,
    $Response.Result
  )

  if ($Response.data -and $Response.data.PSObject.Properties["items"]) {
    $candidates += $Response.data.items
  }
  if ($Response.result -and $Response.result.PSObject.Properties["items"]) {
    $candidates += $Response.result.items
  }

  foreach ($candidate in $candidates) {
    if ($null -eq $candidate) {
      continue
    }
    if ($candidate -is [array]) {
      return @($candidate)
    }
    if ($candidate -is [System.Collections.IEnumerable] -and $candidate -isnot [string]) {
      return @($candidate)
    }
  }

  return @()
}

function Invoke-BlocksApi {
  param(
    [ValidateSet("GET", "POST")]
    [string]$Method,
    [string]$Path,
    [object]$Body = $null
  )

  $uri = "$apiBase$Path"
  $parameters = @{
    Method      = $Method
    Uri         = $uri
    Headers     = $headers
    ErrorAction = "Stop"
  }

  if ($null -ne $Body) {
    $parameters.ContentType = "application/json"
    $parameters.Body = ($Body | ConvertTo-Json -Depth 12)
  }

  Invoke-RestMethod @parameters
}

Import-DotEnv -Path (Join-Path $projectRoot ".env")

$apiBase = $env:VITE_API_BASE_URL
if (!$apiBase) {
  $apiBase = $env:VITE_BLOCKS_API_URL
}
if (!$apiBase) {
  $apiBase = "https://api.seliseblocks.com"
}
if ($apiBase.StartsWith("/")) {
  $apiBase = "https://api.seliseblocks.com"
}
$apiBase = $apiBase.TrimEnd("/")

$xBlocksKey = $env:VITE_X_BLOCKS_KEY
$accessToken = $env:SELISE_ACCESS_TOKEN

if (!$xBlocksKey) {
  Write-Host "Missing VITE_X_BLOCKS_KEY in local .env. Add the project key locally and rerun." -ForegroundColor Red
  exit 2
}

if (!$accessToken) {
  Write-Host "Missing SELISE_ACCESS_TOKEN." -ForegroundColor Yellow
  Write-Host "Log in as a SELISE admin, get a current access token, then run:" -ForegroundColor Yellow
  Write-Host '$env:SELISE_ACCESS_TOKEN = "<admin-access-token>"' -ForegroundColor DarkGray
  Write-Host '.\run-vibebuilder.bat admin' -ForegroundColor DarkGray
  Write-Host "No role changes were made." -ForegroundColor Yellow
  exit 2
}

$headers = @{
  Authorization  = "Bearer $accessToken"
  "x-blocks-key" = $xBlocksKey
}

Write-Host "Looking up SELISE user $Email..." -ForegroundColor Cyan
$usersResponse = Invoke-BlocksApi -Method POST -Path "/idp/v1/Iam/GetUsers" -Body @{
  page       = 1
  pageSize   = 20
  sort       = @{ property = "email"; isDescending = $false }
  filter     = @{ name = ""; email = $Email }
  projectKey = $xBlocksKey
}

$targetUser = Get-ResponseItems $usersResponse |
  Where-Object { "$(Get-FirstProperty $_ @("email", "Email", "userName", "UserName"))".ToLowerInvariant() -eq $Email.ToLowerInvariant() } |
  Select-Object -First 1

if (!$targetUser) {
  Write-Host "User not found: $Email" -ForegroundColor Red
  exit 1
}

$userId = Get-FirstProperty $targetUser @("userId", "UserId", "id", "Id")
if (!$userId) {
  Write-Host "Could not resolve SELISE user id for $Email." -ForegroundColor Red
  exit 1
}

Write-Host "Finding admin role..." -ForegroundColor Cyan
$rolesResponse = Invoke-BlocksApi -Method POST -Path "/idp/v1/Iam/GetRoles" -Body @{
  page       = 1
  pageSize   = 100
  sort       = @{ property = "name"; isDescending = $false }
  filter     = @{ search = $RoleSearch }
  projectKey = $xBlocksKey
}

$roles = Get-ResponseItems $rolesResponse
$adminRole = $roles |
  Sort-Object {
    $roleName = "$(Get-FirstProperty $_ @("slug", "roleSlug", "name", "Name", "id", "Id"))".ToLowerInvariant()
    if ($roleName -eq "admin") { 0 } elseif ($roleName -like "*admin*") { 1 } else { 2 }
  } |
  Select-Object -First 1

if (!$adminRole) {
  Write-Host "No admin-like role was found. Create an Admin role in SELISE IAM first." -ForegroundColor Red
  exit 1
}

$adminRoleSlug = Get-FirstProperty $adminRole @("slug", "roleSlug", "name", "Name", "id", "Id")
if (!$adminRoleSlug) {
  Write-Host "Admin role was found, but no slug/name/id could be resolved." -ForegroundColor Red
  exit 1
}

Write-Host "Reading current roles so existing assignments are preserved..." -ForegroundColor Cyan
$currentRolesResponse = Invoke-BlocksApi -Method GET -Path "/idp/v1/Iam/GetUserRoles?userId=$([uri]::EscapeDataString($userId))"
$currentRoleSlugs = Get-ResponseItems $currentRolesResponse |
  ForEach-Object { Get-FirstProperty $_ @("slug", "roleSlug", "name", "Name", "id", "Id") } |
  Where-Object { $_ } |
  Select-Object -Unique

$nextRoles = @($currentRoleSlugs)
if (($nextRoles | ForEach-Object { "$_".ToLowerInvariant() }) -notcontains "$adminRoleSlug".ToLowerInvariant()) {
  $nextRoles += $adminRoleSlug
}

Write-Host "Assigning admin role while preserving existing roles..." -ForegroundColor Cyan
Invoke-BlocksApi -Method POST -Path "/idp/v1/Iam/SetRoles" -Body @{
  userId     = $userId
  roles      = @($nextRoles)
  projectKey = $xBlocksKey
} | Out-Null

Write-Host "Done. $Email now has the admin role assignment in SELISE IAM." -ForegroundColor Green
