#!/bin/bash
# System Dashboard 启动脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 System Dashboard 启动中..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 创建配置文件（如果不存在）
if [ ! -f "dashboard.config.json" ]; then
    echo "📝 创建配置文件..."
    cat > dashboard.config.json << EOF
{
  "server": {
    "port": 8080,
    "host": "localhost",
    "ssl": false
  },
  "ui": {
    "theme": "dark",
    "language": "zh-CN",
    "refreshInterval": 5000
  },
  "features": {
    "realtime": true,
    "notifications": true,
    "autoSave": true
  },
  "paths": {
    "claude": "/mnt/c/Users/llwxy/.claude",
    "opencode": "/mnt/c/Users/llwxy/opencode",
    "obsidian": "/mnt/c/Users/llwxy/ObsidianVault"
  }
}
EOF
fi

# 启动服务器
echo "✅ 启动服务器..."
echo "📊 访问地址: http://localhost:8080"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

npm start
