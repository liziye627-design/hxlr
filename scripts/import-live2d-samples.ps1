param(
    [string]$SampleRepoDir = ".\\.tmp\\CubismWebSamples",
    [string]$TargetDir = ".\\Open-LLM-VTuber\\live2d-models",
    [string]$AvatarDir = ".\\Open-LLM-VTuber\\avatars"
)

$ErrorActionPreference = "Stop"

$models = @("Haru", "Hiyori", "Mark", "Natori", "Ren", "Rice", "Wanko")
$resourceBase = Join-Path $SampleRepoDir "Samples\\Resources"

foreach ($model in $models) {
    $sourceModelDir = Join-Path $resourceBase $model
    $targetRuntimeDir = Join-Path (Join-Path $TargetDir $model.ToLower()) "runtime"

    if (-not (Test-Path $sourceModelDir)) {
        Write-Warning "Missing source model directory: $sourceModelDir"
        continue
    }

    New-Item -ItemType Directory -Force -Path $targetRuntimeDir | Out-Null

    Get-ChildItem -Path (Join-Path $sourceModelDir "*") -Force | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $targetRuntimeDir -Recurse -Force
    }

    $preview = Get-ChildItem -Path (Join-Path $sourceModelDir "*\\texture_00.png") -File -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($preview) {
        Copy-Item -Path $preview.FullName -Destination (Join-Path $AvatarDir ($model.ToLower() + ".png")) -Force
    }
}

Write-Host "Imported sample models:" ($models -join ", ")
