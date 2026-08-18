param(
    [string]$OutputDir = ".\\third_party\\airi"
)

$ErrorActionPreference = "Stop"

function Test-CommandExists {
    param([string]$Name)

    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

if (-not (Test-CommandExists "huggingface-cli")) {
    Write-Error "huggingface-cli not found. Install it first with: pip install -U huggingface_hub"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$downloads = @(
    @{
        Repo = "proj-airi/games-balatro-2024-yolo-ui-detection"
        RepoType = "model"
        LocalDir = Join-Path $OutputDir "balatro-ui-model"
    },
    @{
        Repo = "proj-airi/games-balatro-2024-ui-detection"
        RepoType = "dataset"
        LocalDir = Join-Path $OutputDir "balatro-ui-dataset"
    },
    @{
        Repo = "proj-airi/games-balatro-2024-entities-detection"
        RepoType = "dataset"
        LocalDir = Join-Path $OutputDir "balatro-entities-dataset"
    }
)

foreach ($item in $downloads) {
    Write-Host "Downloading $($item.Repo) -> $($item.LocalDir)"
    if ($item.RepoType -eq "dataset") {
        huggingface-cli download $item.Repo --repo-type dataset --local-dir $item.LocalDir
    }
    else {
        huggingface-cli download $item.Repo --local-dir $item.LocalDir
    }
}

Write-Host "AIRI asset download complete."
