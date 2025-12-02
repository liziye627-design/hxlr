#!/bin/bash

# 剧本杀系统启动脚本
# Jubensha System Startup Script

echo "=================================="
echo "🎭 剧本杀 AI 系统启动"
echo "=================================="

# 检查 Python 环境
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误：未找到 Python 3"
    exit 1
fi

# 检查依赖
echo ""
echo "📦 检查依赖..."
python3 -c "import fastapi, uvicorn, openai, qdrant_client, langgraph" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  缺少依赖，正在安装..."
    pip install -r requirements.txt
fi

# 检查 Qdrant
echo ""
echo "🔍 检查 Qdrant 服务..."
if ! curl -s http://localhost:6333/health > /dev/null; then
    echo "⚠️  Qdrant 未运行"
    echo "请先启动 Qdrant："
    echo "  docker run -p 6333:6333 qdrant/qdrant"
    echo ""
    read -p "按 Enter 继续（如果已在其他终端启动）..."
fi

# 检查 OpenAI API Key
if [ -z "$OPENAI_API_KEY" ]; then
    echo ""
    echo "⚠️  未设置 OPENAI_API_KEY"
    echo "请设置环境变量："
    echo "  export OPENAI_API_KEY='sk-...'"
    exit 1
fi

echo ""
echo "✅ 环境检查完成"
echo ""
echo "=================================="
echo "🚀 启动服务器"
echo "=================================="
echo ""
echo "API 地址: http://localhost:8000"
echo "API 文档: http://localhost:8000/docs"
echo "Web 界面: http://localhost:8000/web/"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

# 启动服务器
python3 api_server.py
