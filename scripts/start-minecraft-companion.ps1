[CmdletBinding()]
param(
  [string]$ConfigPath = "config/minecraft.local.json",
  [string[]]$Profiles = @(),
  [switch]$SkipLauncher,
  [switch]$SkipBots,
  [switch]$DetectOnly,
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-RepoPath {
  param([Parameter(Mandatory = $true)][string]$PathValue)

  if ([string]::IsNullOrWhiteSpace($PathValue)) {
    return $null
  }

  if ([System.IO.Path]::IsPathRooted($PathValue)) {
    return [System.IO.Path]::GetFullPath($PathValue)
  }

  $repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
  return [System.IO.Path]::GetFullPath((Join-Path $repoRoot $PathValue))
}

function Import-DotEnvFile {
  $repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
  $envPath = Join-Path $repoRoot ".env"
  if (-not (Test-Path -LiteralPath $envPath)) {
    return
  }

  Get-Content -LiteralPath $envPath -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) {
      return
    }

    $separatorIndex = $line.IndexOf('=')
    if ($separatorIndex -lt 1) {
      return
    }

    $name = $line.Substring(0, $separatorIndex).Trim()
    $value = $line.Substring($separatorIndex + 1).Trim()
    [Environment]::SetEnvironmentVariable($name, $value)
  }
}

function Get-JsonFile {
  param([Parameter(Mandatory = $true)][string]$ResolvedPath)

  if (-not (Test-Path -LiteralPath $ResolvedPath)) {
    throw "Missing JSON file: $ResolvedPath"
  }

  return Get-Content -LiteralPath $ResolvedPath -Raw -Encoding UTF8 | ConvertFrom-Json
}

Import-DotEnvFile

function Get-PclConfigPath {
  return Join-Path $env:APPDATA "PCLCE\\config.v1.json"
}

function Get-RawPclConfig {
  $pclConfigPath = Get-PclConfigPath
  if (-not (Test-Path -LiteralPath $pclConfigPath)) {
    return $null
  }

  return Get-JsonFile -ResolvedPath $pclConfigPath
}

function Get-PclLaunchRoots {
  $pclConfig = Get-RawPclConfig
  if (-not $pclConfig -or -not $pclConfig.LaunchFolders) {
    return @()
  }

  return ([string]$pclConfig.LaunchFolders).Split('|') |
    ForEach-Object { $_.Trim() } |
    Where-Object { $_ } |
    ForEach-Object {
      $segments = $_.Split('>')
      $segments[$segments.Length - 1].Trim()
    } |
    Where-Object { $_ } |
    ForEach-Object { $_.TrimEnd('\', '/') } |
    ForEach-Object { Resolve-RepoPath -PathValue $_ }
}

function Get-PclExecutableCandidates {
  $userHome = [Environment]::GetFolderPath("UserProfile")
  $candidates = @(
    (Join-Path $userHome "Desktop\\PCL2_CE_Release_x64.exe"),
    (Join-Path $userHome "Desktop\\PCL2.exe"),
    (Join-Path $userHome "Downloads\\PCL2_CE_Release_x64.exe"),
    (Join-Path $userHome "AppData\\Local\\PCLCE\\PCL2_CE_Release_x64.exe")
  )

  return $candidates | ForEach-Object {
    [pscustomobject]@{
      path = $_
      exists = (Test-Path -LiteralPath $_)
    }
  }
}

function Get-MinecraftVersions {
  param([Parameter(Mandatory = $true)][string]$GameRoot)

  $versionsDir = Join-Path $GameRoot "versions"
  if (-not (Test-Path -LiteralPath $versionsDir)) {
    return @()
  }

  $versionNames = Get-ChildItem -LiteralPath $versionsDir -Directory |
    Select-Object -ExpandProperty Name |
    Sort-Object

  return ,@($versionNames)
}

function Get-ModsCandidates {
  param(
    [Parameter(Mandatory = $true)][string]$GameRoot,
    [string]$VersionName,
    [string]$ExplicitModsDir
  )

  $candidates = New-Object System.Collections.Generic.List[object]

  if ($ExplicitModsDir) {
    $resolvedExplicit = Resolve-RepoPath -PathValue $ExplicitModsDir
    $candidates.Add([pscustomobject]@{
      path = $resolvedExplicit
      source = "explicit"
      exists = (Test-Path -LiteralPath $resolvedExplicit)
      score = 100
      versionScoped = $true
      reason = "Configured explicitly in minecraft.local.json"
    })
  }

  if ($VersionName) {
    $versionPath = Join-Path (Join-Path $GameRoot "versions") $VersionName
    $versionMods = Join-Path $versionPath "mods"
    $nestedVersionMods = Join-Path (Join-Path $versionPath ".minecraft") "mods"

    $candidates.Add([pscustomobject]@{
      path = $versionMods
      source = "version-local"
      exists = (Test-Path -LiteralPath $versionMods)
      score = 90
      versionScoped = $true
      reason = "Matches PCL version-isolated instance layout"
    })
    $candidates.Add([pscustomobject]@{
      path = $nestedVersionMods
      source = "version-nested"
      exists = (Test-Path -LiteralPath $nestedVersionMods)
      score = 70
      versionScoped = $true
      reason = "Fallback for nested per-version Minecraft roots"
    })
  }

  $sharedMods = Join-Path $GameRoot "mods"
  $candidates.Add([pscustomobject]@{
    path = $sharedMods
    source = "root-shared"
    exists = (Test-Path -LiteralPath $sharedMods)
    score = 50
    versionScoped = $false
    reason = "Shared root mods directory fallback"
  })

  $deduped = @{}
  foreach ($candidate in $candidates) {
    if (-not $deduped.ContainsKey($candidate.path)) {
      $deduped[$candidate.path] = $candidate
    }
  }

  return $deduped.Values |
    Sort-Object -Property @{ Expression = { if ($_.exists) { 0 } else { 1 } } }, @{ Expression = { -[int]$_.score } }
}

function Resolve-MinecraftDetection {
  param($Config)

  $launchRoots = @(Get-PclLaunchRoots)
  $configGameRoot = if ($Config -and $Config.gameRoot) { Resolve-RepoPath -PathValue ([string]$Config.gameRoot) } else { $null }
  $selectedGameRoot = $null
  if ($configGameRoot -and (Test-Path -LiteralPath $configGameRoot)) {
    $selectedGameRoot = $configGameRoot
  } else {
    $selectedGameRoot = $launchRoots | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
  }

  $versionCandidates = if ($selectedGameRoot) { @(Get-MinecraftVersions -GameRoot $selectedGameRoot) } else { @() }
  $selectedVersion = $null
  if ($Config -and $Config.versionName -and ($versionCandidates -contains [string]$Config.versionName)) {
    $selectedVersion = [string]$Config.versionName
  } elseif (@($versionCandidates).Count -gt 0) {
    $selectedVersion = [string]$versionCandidates[@($versionCandidates).Count - 1]
  }

  $explicitModsDir = if ($Config) { [string]$Config.instanceModsDir } else { $null }
  $modsCandidates = if ($selectedGameRoot) {
    @(Get-ModsCandidates -GameRoot $selectedGameRoot -VersionName $selectedVersion -ExplicitModsDir $explicitModsDir)
  } else {
    @()
  }

  $resolvedModsDir = if (@($modsCandidates).Count -gt 0) { [string]$modsCandidates[0].path } else { $null }

  $warnings = New-Object System.Collections.Generic.List[string]
  if (-not $selectedGameRoot) {
    $warnings.Add("No Minecraft root could be resolved from local config or PCL config.")
  }
  if ($selectedGameRoot -and @($versionCandidates).Count -eq 0) {
    $warnings.Add("Minecraft root exists, but no version directories were found.")
  }
  if (@($modsCandidates).Count -gt 0 -and -not ($modsCandidates | Where-Object { $_.exists } | Select-Object -First 1)) {
    $warnings.Add("No existing mods directory was found. The recommended candidate will need to be created.")
  }

  return [pscustomobject]@{
    pclConfigPath = Get-PclConfigPath
    launchRoots = $launchRoots
    selectedGameRoot = $selectedGameRoot
    versionCandidates = $versionCandidates
    selectedVersion = $selectedVersion
    pclExecutableCandidates = @(Get-PclExecutableCandidates)
    modsCandidates = $modsCandidates
    resolvedModsDir = $resolvedModsDir
    warnings = $warnings
  }
}

function Resolve-ModsDirectory {
  param(
    [Parameter(Mandatory = $true)]$Config,
    [string]$DetectedModsDir
  )

  if ($Config.instanceModsDir) {
    return Resolve-RepoPath -PathValue $Config.instanceModsDir
  }

  if ($DetectedModsDir) {
    return $DetectedModsDir
  }

  $gameRoot = Resolve-RepoPath -PathValue $Config.gameRoot
  $versionPath = Join-Path $gameRoot ("versions\" + $Config.versionName)
  $versionMods = Join-Path $versionPath "mods"
  if (Test-Path -LiteralPath $versionPath) {
    return $versionMods
  }

  return (Join-Path $gameRoot "mods")
}

function Get-FileSha256 {
  param([Parameter(Mandatory = $true)][string]$PathValue)

  if (-not (Test-Path -LiteralPath $PathValue)) {
    return $null
  }

  return (Get-FileHash -LiteralPath $PathValue -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Ensure-Mods {
  param(
    [Parameter(Mandatory = $true)]$Config,
    [Parameter(Mandatory = $true)]$Manifest,
    [string]$DetectedModsDir,
    [Parameter(Mandatory = $true)][bool]$DryRunFlag
  )

  $modsDir = Resolve-ModsDirectory -Config $Config -DetectedModsDir $DetectedModsDir
  if (-not (Test-Path -LiteralPath $modsDir) -and -not $DryRunFlag) {
    New-Item -ItemType Directory -Path $modsDir -Force | Out-Null
  }

  $results = @()
  $mods = @($Manifest.mods)

  foreach ($mod in $mods) {
    $sourcePath = Resolve-RepoPath -PathValue $mod.source
    $targetFileName = if ($mod.targetFileName) { $mod.targetFileName } else { [System.IO.Path]::GetFileName($sourcePath) }
    $targetPath = Join-Path $modsDir $targetFileName

    if (-not (Test-Path -LiteralPath $sourcePath)) {
      if ($mod.required) {
        throw "Required mod missing: $sourcePath"
      }

      $results += [pscustomobject]@{
        id = $mod.id
        action = "skipped_missing_optional"
        source = $sourcePath
        target = $targetPath
      }
      continue
    }

    $sourceHash = Get-FileSha256 -PathValue $sourcePath
    $targetHash = Get-FileSha256 -PathValue $targetPath
    $expectedHash = if ($mod.sha256) { ([string]$mod.sha256).ToLowerInvariant() } else { "" }

    if ($expectedHash -and $sourceHash -ne $expectedHash) {
      throw "Manifest hash mismatch for $($mod.id). Expected $expectedHash, got $sourceHash"
    }

    $action = if ($targetHash -and $targetHash -eq $sourceHash) { "verified" } else { "copied" }
    if ($action -eq "copied" -and -not $DryRunFlag) {
      Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force
    }

    $results += [pscustomobject]@{
      id = $mod.id
      action = $action
      source = $sourcePath
      target = $targetPath
      sha256 = $sourceHash
    }
  }

  return [pscustomobject]@{
    modsDir = $modsDir
    items = $results
  }
}

function Join-ProcessArguments {
  param(
    [Parameter(Mandatory = $true)][string[]]$Arguments
  )

  $escapedArguments = foreach ($argument in $Arguments) {
    if ($argument -notmatch '[\s"]') {
      $argument
      continue
    }

    '"' + (($argument -replace '(\\*)"', '$1$1\"') -replace '(\\+)$', '$1$1') + '"'
  }

  return [string]::Join(' ', $escapedArguments)
}

function Start-Bots {
  param(
    [Parameter(Mandatory = $true)]$Config,
    [Parameter(Mandatory = $true)][string[]]$SelectedProfiles,
    [Parameter(Mandatory = $true)][bool]$DryRunFlag
  )

  $bots = @($Config.bots)
  $activeBots = if (@($SelectedProfiles).Count -gt 0) {
    $bots | Where-Object { $_.id -in $SelectedProfiles }
  } else {
    $bots | Where-Object { $_.enabled -eq $true }
  }

  $results = @()

  foreach ($bot in $activeBots) {
    $workingDir = Resolve-RepoPath -PathValue $bot.workingDir
    if (-not (Test-Path -LiteralPath $workingDir)) {
      throw "Bot working directory missing for $($bot.id): $workingDir"
    }

    $arguments = @()
    foreach ($arg in @($bot.arguments)) {
      $argValue = [string]$arg
      $argValue = $argValue.Replace("{serverHost}", [string]$Config.serverHost)
      $argValue = $argValue.Replace("{serverPort}", [string]$Config.serverPort)
      $arguments += $argValue
    }

    if (-not $DryRunFlag) {
      $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
      $startInfo.FileName = [string]$bot.command
      $startInfo.WorkingDirectory = $workingDir
      $startInfo.UseShellExecute = $false
      $startInfo.Environment["MINECRAFT_PORT"] = [string]$Config.serverPort
      $startInfo.Arguments = Join-ProcessArguments -Arguments $arguments

      [System.Diagnostics.Process]::Start($startInfo) | Out-Null
    }

    $results += [pscustomobject]@{
      id = $bot.id
      displayName = $bot.displayName
      command = [string]$bot.command
      arguments = $arguments
      workingDir = $workingDir
    }
  }

  return $results
}

$resolvedConfigPath = Resolve-RepoPath -PathValue $ConfigPath
$config = if (Test-Path -LiteralPath $resolvedConfigPath) { Get-JsonFile -ResolvedPath $resolvedConfigPath } else { $null }
$detection = Resolve-MinecraftDetection -Config $config

if ($DetectOnly) {
  [pscustomobject]@{
    ok = $true
    detectOnly = $true
    configPath = $resolvedConfigPath
    configExists = [bool](Test-Path -LiteralPath $resolvedConfigPath)
    detection = $detection
    timestamp = (Get-Date).ToString("o")
  } | ConvertTo-Json -Depth 8
  exit 0
}

if (-not $config) {
  throw "Missing config file: $resolvedConfigPath. Run with -DetectOnly first or create minecraft.local.json."
}

$resolvedPclPath = if ($config.pclPath) {
  Resolve-RepoPath -PathValue ([string]$config.pclPath)
} else {
  ($detection.pclExecutableCandidates | Where-Object { $_.exists } | Select-Object -First 1).path
}
$resolvedManifestPath = Resolve-RepoPath -PathValue ([string]$config.modManifestPath)
$resolvedGameRoot = if ($config.gameRoot) {
  Resolve-RepoPath -PathValue ([string]$config.gameRoot)
} else {
  [string]$detection.selectedGameRoot
}
$effectiveVersionName = if ($config.versionName) { [string]$config.versionName } else { [string]$detection.selectedVersion }

if (-not $resolvedPclPath -or -not (Test-Path -LiteralPath $resolvedPclPath)) {
  throw "PCL executable not found. Checked config value and detected candidates from local machine."
}

if (-not $resolvedGameRoot -or -not (Test-Path -LiteralPath $resolvedGameRoot)) {
  throw "Minecraft game root not found. Checked config value and detected launch roots from local PCL config."
}

$manifest = Get-JsonFile -ResolvedPath $resolvedManifestPath
$selectedProfiles = if (@($Profiles).Count -gt 0) { $Profiles } else { @($config.defaultProfiles) }
$modsResult = Ensure-Mods -Config $config -Manifest $manifest -DetectedModsDir ([string]$detection.resolvedModsDir) -DryRunFlag ([bool]$DryRun)

if (-not $SkipLauncher) {
  if (-not $DryRun) {
    Start-Process -FilePath $resolvedPclPath | Out-Null
  }

  $waitSeconds = if ($config.launchWaitSeconds) { [int]$config.launchWaitSeconds } else { 5 }
  Start-Sleep -Seconds $waitSeconds
}

$botResults = @()
if (-not $SkipBots) {
  $botResults = Start-Bots -Config $config -SelectedProfiles $selectedProfiles -DryRunFlag ([bool]$DryRun)
}

$receiptRoot = Join-Path $resolvedGameRoot ".codex-minecraft-bootstrap"
$receiptPath = Join-Path $receiptRoot "last-run.json"
if (-not $DryRun -and -not (Test-Path -LiteralPath $receiptRoot)) {
  New-Item -ItemType Directory -Path $receiptRoot -Force | Out-Null
}

$summary = [pscustomobject]@{
  ok = $true
  dryRun = [bool]$DryRun
  configPath = $resolvedConfigPath
  configExists = $true
  pclPath = $resolvedPclPath
  gameRoot = $resolvedGameRoot
  versionName = $effectiveVersionName
  modsDir = $modsResult.modsDir
  mods = $modsResult.items
  selectedProfiles = @($selectedProfiles)
  bots = @($botResults)
  launchedPcl = (-not $SkipLauncher)
  launchedBots = (-not $SkipBots)
  detection = $detection
  timestamp = (Get-Date).ToString("o")
}

if (-not $DryRun) {
  $summary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $receiptPath -Encoding UTF8
}

$summary | ConvertTo-Json -Depth 8
