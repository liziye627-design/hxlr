@echo off
chcp 65001 >nul
title 秒哒应用 - 完整启动器

echo ========================================
echo   秒哒应用 + Live2D 完整启动器
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] 启动前端服务器...
echo      地址: http://127.0.0.1:5200
echo.
start "前端服务器" cmd /k "npm run dev"

timeout /t 8 /nobreak >nul

echo [2/2] 启动 Live2D VTuber 服务...
echo      地址: http://localhost:12393
echo.
cd Open-LLM-VTuber
start "Live2D VTuber" cmd /k "python run_server.py"

cd ..

echo.
echo ========================================
echo   服务已启动！
echo ========================================
echo.
echo   前端应用:   http://127.0.0.1:5200
echo   Live2D:     http://localhost:12393
echo.
echo   正在打开浏览器...
timeout /t 5 /nobreak >nul

start http://127.0.0.1:5200

echo.
echo 启动完成！关闭此窗口不会影响运行中的服务。
echo.
pause