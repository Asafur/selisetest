param(
  [string]$EmailDomain = "@gmail.com",
  [string]$RoleSearch = "admin",
  [int]$PageSize = 100,
  [int]$MaxPages = 50
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

function Normalize-Role {
  param([object]$Role)

  $raw = $Role
  if ($Role -and $Role -isnot [string] -and $Role.PSObject.Properties) {
    $raw = Get-FirstProperty $Role @("slug", "roleSlug", "name", "Name", "id", "Id")
  }

  return "$raw".Trim().ToLowerInvariant() -replace "[\s_-]+", ""
}

function Is-AdminLikeRole {
  param([object]$Role)

  $normalized = Normalize-Role $Role
  return @("admin", "administrator", "cloudadmin", "cloudadministrator", "superadmin") -contains $normalized -or $normalized.Contains("admin")
}

function Mask-Email {
  param([string]$Email)
  if (!$Email -or !$Email.Contains("@")) {
    return "<unknown>"
  }

  $local, $domain = $Email.Split("@", 2)
  $prefixLength = [Math]::Min(2, $local.Length)
  $prefix = $local.Substring(0, $prefixLength)
  return "$prefix***@$domain"
}

function Get-DateValue {
  param([object]$User)

  $lastLogin = Get-FirstProperty $User @("lastLoggedInTime", "LastLoggedInTime", "lastLoginDate", "LastLoginDate")
  if ($lastLogin) {
    try {
      return [datetime]::Parse("$lastLogin")
    } catch {
      # Fall through to created date.
    }
  }

  $created = Get-FirstProperty $User @("createdDate", "CreatedDate", "createdAt", "CreatedAt")
  if ($created) {
    try {
      return [datetime]::Parse("$created")
    } catch {
      return [datetime]::MaxValue
    }
  }

  return [datetime]::MaxValue
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

function Get-AllUsers {
  $allUsers = @()

  for ($page = 1; $page -le $MaxPages; $page += 1) {
    $response = Invoke-BlocksApi -Method POST -Path "/idp/v1/Iam/GetUsers" -Body @{
      page       = $page
      pageSize   = $PageSize
      sort       = @{ property = "createdDate"; isDescending = $false }
      filter     = @{ name = ""; email = "" }
      projectKey = $xBlocksKey
    }

    $items = @(Get-ResponseItems $response)
    if ($items.Count -eq 0) {
      break
    }

    $allUsers += $items

    if ($items.Count -lt $PageSize) {
      break
    }
  }

  return @($allUsers)
}

function Get-UserId {
  param([object]$User)
  Get-FirstProperty $User @("userId", "UserId", "itemId", "ItemId", "id", "Id")
}

function Get-UserEmail {
  param([object]$User)
  Get-FirstProperty $User @("email", "Email", "userName", "UserName")
}

function Get-UserRoleSlugs {
  param([object]$User)

  $userId = Get-UserId $User
  $rolesFromEndpoint = @()

  if ($userId) {
    try {
      $rolesResponse = Invoke-BlocksApi -Method GET -Path "/idp/v1/Iam/GetUserRoles?userId=$([uri]::EscapeDataString($userId))"
      $rolesFromEndpoint = @(Get-ResponseItems $rolesResponse)
    } catch {
      $rolesFromEndpoint = @()
    }
  }

  $rawRoles = if ($rolesFromEndpoint.Count -gt 0) {
    $rolesFromEndpoint
  } else {
    @(Get-FirstProperty $User @("roles", "Roles"))
  }

  @($rawRoles |
    ForEach-Object { Get-FirstProperty $_ @("slug", "roleSlug", "name", "Name", "id", "Id") } |
    Where-Object { $_ } |
    Select-Object -Unique)
}

function Set-UserRoles {
  param(
    [string]$UserId,
    [string[]]$Roles
  )

  Invoke-BlocksApi -Method POST -Path "/idp/v1/Iam/SetRoles" -Body @{
    userId     = $UserId
    roles      = @($Roles)
    projectKey = $xBlocksKey
  } | Out-Null
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
  Write-Host "Log in as a SELISE admin, get a current bearer access token, then run one of:" -ForegroundColor Yellow
  Write-Host '$env:SELISE_ACCESS_TOKEN = "<admin-access-token>"; .\run-vibebuilder.bat admin' -ForegroundColor DarkGray
  Write-Host '.\run-vibebuilder.bat admin-token' -ForegroundColor DarkGray
  Write-Host "No role changes were made." -ForegroundColor Yellow
  exit 2
}

$headers = @{
  Authorization  = "Bearer $accessToken"
  "x-blocks-key" = $xBlocksKey
}

Write-Host "Finding admin role in SELISE IAM..." -ForegroundColor Cyan
$rolesResponse = Invoke-BlocksApi -Method POST -Path "/idp/v1/Iam/GetRoles" -Body @{
  page       = 1
  pageSize   = 100
  sort       = @{ property = "name"; isDescending = $false }
  filter     = @{ search = $RoleSearch }
  projectKey = $xBlocksKey
}

$adminRole = @(Get-ResponseItems $rolesResponse) |
  Sort-Object {
    $roleName = Normalize-Role $_
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

Write-Host "Reading SELISE users to choose the first signed-in Gmail account..." -ForegroundColor Cyan
$users = @(Get-AllUsers)
if ($users.Count -eq 0) {
  Write-Host "No users were returned by SELISE IAM. No role changes were made." -ForegroundColor Red
  exit 1
}

$normalizedDomain = $EmailDomain.Trim().ToLowerInvariant()
if (!$normalizedDomain.StartsWith("@")) {
  $normalizedDomain = "@$normalizedDomain"
}

$gmailUsers = @($users | Where-Object {
  $email = "$(Get-UserEmail $_)".Trim().ToLowerInvariant()
  $email.EndsWith($normalizedDomain)
})

if ($gmailUsers.Count -eq 0) {
  Write-Host "No users with email domain $normalizedDomain were found. No role changes were made." -ForegroundColor Red
  exit 1
}

$signedInGmailUsers = @($gmailUsers | Where-Object {
  $lastLogin = Get-FirstProperty $_ @("lastLoggedInTime", "LastLoggedInTime", "lastLoginDate", "LastLoginDate")
  $loginCount = Get-FirstProperty $_ @("logInCount", "LogInCount", "loginCount", "LoginCount")
  $lastLogin -or (($loginCount -as [int]) -gt 0)
})

$candidatePool = if ($signedInGmailUsers.Count -gt 0) { $signedInGmailUsers } else { $gmailUsers }
$firstGmailUser = $candidatePool | Sort-Object { Get-DateValue $_ } | Select-Object -First 1
$firstGmailUserId = Get-UserId $firstGmailUser
$firstGmailEmail = Get-UserEmail $firstGmailUser

if (!$firstGmailUserId -or !$firstGmailEmail) {
  Write-Host "Could not resolve the first Gmail user's ID/email. No role changes were made." -ForegroundColor Red
  exit 1
}

Write-Host "Selected only-admin Gmail account: $(Mask-Email $firstGmailEmail)" -ForegroundColor Cyan

$changedCount = 0
foreach ($user in $users) {
  $userId = Get-UserId $user
  if (!$userId) {
    continue
  }

  $currentRoles = @(Get-UserRoleSlugs $user)
  $rolesWithoutAdmin = @($currentRoles | Where-Object { -not (Is-AdminLikeRole $_) })
  $nextRoles = if ("$userId" -eq "$firstGmailUserId") {
    @($rolesWithoutAdmin + $adminRoleSlug | Select-Object -Unique)
  } else {
    @($rolesWithoutAdmin | Select-Object -Unique)
  }

  $currentNormalized = @($currentRoles | ForEach-Object { Normalize-Role $_ } | Sort-Object)
  $nextNormalized = @($nextRoles | ForEach-Object { Normalize-Role $_ } | Sort-Object)
  $isChanged = (Compare-Object $currentNormalized $nextNormalized).Count -gt 0

  if (!$isChanged) {
    continue
  }

  Set-UserRoles -UserId $userId -Roles $nextRoles
  $changedCount += 1
}

Write-Host "Done. The first Gmail account is now the only app admin by SELISE IAM role policy. Changed users: $changedCount." -ForegroundColor Green
