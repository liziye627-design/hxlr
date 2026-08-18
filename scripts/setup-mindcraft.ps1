[CmdletBinding()]
param(
  [string]$MindcraftRoot = "third_party/mindcraft",
  [string]$RepoUrl = "https://github.com/mindcraft-bots/mindcraft.git",
  [string]$Branch = "v0.1.3",
  [switch]$SkipInstall,
  [switch]$ForceInstall
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$supportedKeyNames = @(
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "ANTHROPIC_API_KEY",
  "REPLICATE_API_KEY",
  "GROQCLOUD_API_KEY",
  "HUGGINGFACE_API_KEY",
  "QWEN_API_KEY",
  "XAI_API_KEY",
  "MISTRAL_API_KEY",
  "DEEPSEEK_API_KEY",
  "GHLF_API_KEY",
  "HYPERBOLIC_API_KEY",
  "NOVITA_API_KEY",
  "OPENROUTER_API_KEY",
  "CEREBRAS_API_KEY",
  "MERCURY_API_KEY"
)

$providerKeyMap = @{
  "openai" = "OPENAI_API_KEY"
  "azure" = "OPENAI_API_KEY"
  "gemini" = "GEMINI_API_KEY"
  "anthropic" = "ANTHROPIC_API_KEY"
  "claude" = "ANTHROPIC_API_KEY"
  "replicate" = "REPLICATE_API_KEY"
  "groq" = "GROQCLOUD_API_KEY"
  "groqcloud" = "GROQCLOUD_API_KEY"
  "huggingface" = "HUGGINGFACE_API_KEY"
  "qwen" = "QWEN_API_KEY"
  "xai" = "XAI_API_KEY"
  "mistral" = "MISTRAL_API_KEY"
  "deepseek" = "DEEPSEEK_API_KEY"
  "glhf" = "GHLF_API_KEY"
  "hyperbolic" = "HYPERBOLIC_API_KEY"
  "novita" = "NOVITA_API_KEY"
  "openrouter" = "OPENROUTER_API_KEY"
  "cerebras" = "CEREBRAS_API_KEY"
  "mercury" = "MERCURY_API_KEY"
}

function Resolve-RepoPath {
  param([Parameter(Mandatory = $true)][string]$PathValue)

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

function Get-ConfiguredValue {
  param(
    [Parameter(Mandatory = $true)][hashtable]$KeyFileValues,
    [Parameter(Mandatory = $true)][string]$KeyName
  )

  $fileValue = $KeyFileValues[$KeyName]
  if (($fileValue -is [string]) -and -not [string]::IsNullOrWhiteSpace($fileValue)) {
    return $fileValue
  }

  return [Environment]::GetEnvironmentVariable($KeyName)
}

function Get-RequiredProfileKeys {
  param([Parameter(Mandatory = $true)][string]$ProfilePath)

  if (-not (Test-Path -LiteralPath $ProfilePath)) {
    return @()
  }

  $profile = Get-Content -LiteralPath $ProfilePath -Raw -Encoding UTF8 | ConvertFrom-Json
  $fallbackProvider = if ($null -ne $profile.PSObject.Properties['name']) { ([string]$profile.name).ToLowerInvariant() } else { "" }
  $providers = New-Object System.Collections.Generic.List[string]

  foreach ($fieldName in @('model', 'embedding', 'code_model', 'vision_model')) {
    if ($null -eq $profile.PSObject.Properties[$fieldName]) {
      continue
    }

    $fieldValue = $profile.$fieldName
    $provider = $null
    if ($fieldValue -is [string]) {
      $normalized = ([string]$fieldValue).ToLowerInvariant()
      if ($providerKeyMap.ContainsKey($normalized)) {
        $provider = $normalized
      }
    } elseif ($null -ne $fieldValue.PSObject.Properties['api']) {
        $provider = ([string]$fieldValue.api).ToLowerInvariant()
    }

    if (-not $provider -and $fieldName -eq 'model' -and $providerKeyMap.ContainsKey($fallbackProvider)) {
      $provider = $fallbackProvider
    }

    if ($provider -and $providerKeyMap.ContainsKey($provider) -and -not $providers.Contains($provider)) {
      $providers.Add($provider)
    }
  }

  return @($providers | ForEach-Object { $providerKeyMap[$_] })
}

function Test-ConfiguredKeys {
  param(
    [Parameter(Mandatory = $true)][string]$KeysPath,
    [Parameter(Mandatory = $true)][string[]]$RequiredKeyNames
  )

  $keyFileValues = @{}

  if (Test-Path -LiteralPath $KeysPath) {
    try {
      $parsedKeys = Get-Content -LiteralPath $KeysPath -Raw -Encoding UTF8 | ConvertFrom-Json
      foreach ($property in $parsedKeys.PSObject.Properties) {
        $keyFileValues[$property.Name] = $property.Value
      }
    } catch {
      return $false
    }
  }

  $effectiveRequiredKeys = if ($RequiredKeyNames.Count -gt 0) { $RequiredKeyNames } else { $supportedKeyNames }
  foreach ($keyName in $effectiveRequiredKeys) {
    $value = Get-ConfiguredValue -KeyFileValues $keyFileValues -KeyName $keyName
    if (-not [string]::IsNullOrWhiteSpace($value)) {
      return $true
    }
  }

  return $false
}

Import-DotEnvFile

$resolvedMindcraftRoot = Resolve-RepoPath -PathValue $MindcraftRoot
$mindcraftAlreadyPresent = Test-Path -LiteralPath $resolvedMindcraftRoot
$clonedNow = $false

if (-not $mindcraftAlreadyPresent) {
  & git clone --depth 1 --branch $Branch $RepoUrl $resolvedMindcraftRoot
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to clone Mindcraft from $RepoUrl"
  }
  $clonedNow = $true
}

$keysExamplePath = Join-Path $resolvedMindcraftRoot "keys.example.json"
$keysPath = Join-Path $resolvedMindcraftRoot "keys.json"
$keysCopied = $false
if ((Test-Path -LiteralPath $keysExamplePath) -and -not (Test-Path -LiteralPath $keysPath)) {
  Copy-Item -LiteralPath $keysExamplePath -Destination $keysPath
  $keysCopied = $true
}

$nodeModulesPath = Join-Path $resolvedMindcraftRoot "node_modules"
$shouldInstall = -not $SkipInstall -and ($ForceInstall -or -not (Test-Path -LiteralPath $nodeModulesPath))
$installedNow = $false

if ($shouldInstall) {
  Push-Location $resolvedMindcraftRoot
  try {
    & npm install
    if ($LASTEXITCODE -ne 0) {
      throw "npm install failed in $resolvedMindcraftRoot"
    }
    $installedNow = $true
  } finally {
    Pop-Location
  }
}

$companionProfilePath = Join-Path $resolvedMindcraftRoot "profiles\\companion-ren.json"
$requiredKeyNames = @(Get-RequiredProfileKeys -ProfilePath $companionProfilePath)
$keysConfigured = Test-ConfiguredKeys -KeysPath $keysPath -RequiredKeyNames $requiredKeyNames
$warnings = New-Object System.Collections.Generic.List[string]

if (-not (Test-Path -LiteralPath $companionProfilePath)) {
  $warnings.Add("Companion profile is missing at $companionProfilePath.")
}
if (-not $keysConfigured) {
  $requiredKeysText = if ($requiredKeyNames.Count -gt 0) { ($requiredKeyNames -join ', ') } else { ($supportedKeyNames -join ', ') }
  $warnings.Add("Mindcraft API keys are still empty. Required keys: $requiredKeysText.")
}

[pscustomobject]@{
  ok = $true
  mindcraftRoot = $resolvedMindcraftRoot
  repoPresent = (Test-Path -LiteralPath $resolvedMindcraftRoot)
  repoExisted = $mindcraftAlreadyPresent
  clonedNow = $clonedNow
  keysPath = $keysPath
  keysCopied = $keysCopied
  requiredKeyNames = $requiredKeyNames
  keysConfigured = $keysConfigured
  nodeModulesPath = $nodeModulesPath
  dependenciesInstalled = (Test-Path -LiteralPath $nodeModulesPath)
  installedNow = $installedNow
  companionProfilePath = $companionProfilePath
  companionProfileExists = (Test-Path -LiteralPath $companionProfilePath)
  warnings = $warnings
} | ConvertTo-Json -Depth 6
