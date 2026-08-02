# 秒哒应用完整启动脚本
# 启动前端 + Live2D VTuber 服务

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  秒哒应用 + Live2D 完整启动器" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

$ProjectDir = "C:\Users\llwxy\Desktop\ai学习\app-7gn2vl8qe60x_app_version-7r0unkm6hkhs (3)\app-7gn2vl8qe60x_app_version-7r0unkm6hkhs\app-7gn2vl8qe60x"
$VTuberDir = "$ProjectDir\Open-LLM-VTuber"

# 1. 启动 Live2D VTuber 服务
Write-Host "[1/2] 启动 Live2D VTuber 服务..." -ForegroundColor Yellow
Write-Host "      地址: http://localhost:12393" -ForegroundColor Gray

Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$VTuberDir`" && .venv\Scripts\python.exe run_server.py" -WindowStyle Normal

Start-Sleep -Seconds 5

# 2. 启动前端开发服务器
Write-Host "[2/2] 启动前端开发服务器..." -ForegroundColor Yellow
Write-Host "      地址: http://127.0.0.1:5200" -ForegroundColor Gray

Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$ProjectDir`" && npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ 服务已启动！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  前端应用:   " -NoNewline; Write-Host "http://127.0.0.1:5200" -ForegroundColor Cyan
Write-Host "  Live2D:     " -NoNewline; Write-Host "http://localhost:12393" -ForegroundColor Cyan
Write-Host ""
Write-Host "  正在打开浏览器..." -ForegroundColor Yellow

Start-Sleep -Seconds 2
Start-Process "http://127.0.0.1:5200"

Write-Host ""
Write-Host "启动完成！关闭此窗口不会影响运行中的服务。" -ForegroundColor Gray
Write-Host ""