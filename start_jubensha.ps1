$ErrorActionPreference = "Stop"

param(
  [string]$BackendPort = "8010",
  [string]$FrontendPort = "3001"
)

Write-Host "Starting Jubensha AI frontend on port $FrontendPort" -ForegroundColor Green
Start-Process -NoNewWindow -WorkingDirectory "jubensha-ai-master\frontend" powershell -ArgumentList "-NoProfile","-Command","npm run dev"

Write-Host "Starting Jubensha AI backend on port $BackendPort" -ForegroundColor Green
Start-Process -NoNewWindow -WorkingDirectory "jubensha-ai-master\backend" powershell -ArgumentList "-NoProfile","-Command","python main.py"

Write-Host "Frontend: http://localhost:$FrontendPort" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:$BackendPort" -ForegroundColor Cyan
