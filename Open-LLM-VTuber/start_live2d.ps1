# Open-LLM-VTuber 启动脚本
# Live2D 服务启动器

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Open-LLM-VTuber Live2D 服务启动器" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置项目目录
$ProjectDir = "C:\Users\llwxy\Desktop\ai学习\app-7gn2vl8qe60x_app_version-7r0unkm6hkhs (3)\app-7gn2vl8qe60x_app_version-7r0unkm6hkhs\app-7gn2vl8qe60x\Open-LLM-VTuber"

Write-Host "项目目录: $ProjectDir" -ForegroundColor Yellow
Set-Location $ProjectDir

# 检查虚拟环境
$VenvPath = "$ProjectDir\.venv\Scripts\python.exe"
if (Test-Path $VenvPath) {
    Write-Host "[OK] 找到虚拟环境" -ForegroundColor Green
    $PythonCmd = $VenvPath
} else {
    Write-Host "[!] 虚拟环境不存在，使用系统 Python" -ForegroundColor Yellow
    $PythonCmd = "python"
}

# 检查依赖
Write-Host ""
Write-Host "检查依赖..." -ForegroundColor Yellow
& $PythonCmd -c "import tomli" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] 缺少依赖，正在安装..." -ForegroundColor Yellow
    & $PythonCmd -m pip install -r "$ProjectDir\requirements.txt"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  启动 Live2D 服务" -ForegroundColor Green
Write-Host "  地址: http://localhost:12393" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 启动服务
& $PythonCmd "$ProjectDir\run_server.py"