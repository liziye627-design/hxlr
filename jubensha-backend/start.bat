@echo off
REM 剧本杀系统启动脚本 (Windows)
REM Jubensha System Startup Script for Windows

echo ==================================
echo 🎭 剧本杀 AI 系统启动
echo ==================================

REM 检查 Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未找到 Python
    pause
    exit /b 1
)

REM 检查依赖
echo.
echo 📦 检查依赖...
python -c "import fastapi, uvicorn, openai, qdrant_client, langgraph" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  缺少依赖，正在安装...
    pip install -r requirements.txt
)

REM 检查 Qdrant
echo.
echo 🔍 检查 Qdrant 服务...
curl -s http://localhost:6333/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Qdrant 未运行
    echo 请先启动 Qdrant：
    echo   docker run -p 6333:6333 qdrant/qdrant
    echo.
    pause
)

REM 检查 OpenAI API Key
if "%OPENAI_API_KEY%"=="" (
    echo.
    echo ⚠️  未设置 OPENAI_API_KEY
    echo 请设置环境变量：
    echo   $env:OPENAI_API_KEY="sk-..."
    pause
    exit /b 1
)

echo.
echo ✅ 环境检查完成
echo.
echo ==================================
echo 🚀 启动服务器
echo ==================================
echo.
echo API 地址: http://localhost:8000
echo API 文档: http://localhost:8000/docs
echo Web 界面: 打开 web/index.html
echo.
echo 按 Ctrl+C 停止服务器
echo.

REM 启动服务器
python api_server.py
