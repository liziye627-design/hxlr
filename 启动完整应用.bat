@echo off
chcp 65001 >nul
title 秒哒应用 - 完整启动器

echo ========================================
echo   秒哒应用 + Live2D 完整启动器
echo ========================================
echo.

set PROJECT_DIR=C:\Users\llwxy\Desktop\ai学习\app-7gn2vl8qe60x_app_version-7r0unkm6hkhs (3)\app-7gn2vl8qe60x_app_version-7r0unkm6hkhs\app-7gn2vl8qe60x
set VTUBER_DIR=%PROJECT_DIR%\Open-LLM-VTuber

echo [1/3] 启动 Live2D VTuber 服务...
echo      地址: http://localhost:12393
echo.
start "Live2D VTuber" cmd /k "cd /d "%VTUBER_DIR%" && .venv\Scripts\python.exe run_server.py"

timeout /t 5 /nobreak >nul

echo [2/3] 启动前端开发服务器...
echo      地址: http://127.0.0.1:5200
echo.
start "前端服务器" cmd /k "cd /d "%PROJECT_DIR%" && npm run dev"

echo.
echo ========================================
echo   服务已启动！
echo ========================================
echo.
echo   前端应用:   http://127.0.0.1:5200
echo   Live2D:     http://localhost:12393
echo.
echo   按任意键打开浏览器...
pause >nul

start http://127.0.0.1:5200

echo.
echo 启动完成！关闭此窗口不会影响运行中的服务。
echo.