# System Dashboard - 系统仪表板

统一的系统管理界面，集成所有 Skills 和 MCP 服务器。

## 功能特性

### 实时监控
- Skills 状态监控
- MCP 服务器连接状态
- 系统资源使用情况
- 任务执行跟踪

### 可视化界面
- 交互式图表展示
- 分类浏览和搜索
- 快速启用/禁用控制
- 配置文件编辑

### 集成管理
- 统一配置接口
- 批量操作支持
- 自动备份和恢复
- 版本控制集成

## 使用方法

### 启动仪表板

```bash
# 方式 1：通过 skill 调用
system-dashboard

# 方式 2：直接启动脚本
cd ~/.claude/skills/system-dashboard
./start-dashboard.sh

# 方式 3：使用 HTTP 接口
./server.sh --port 8080
```

### 访问界面

```
http://localhost:8080
```

## 界面结构

### 主页面
```
┌─────────────────────────────────────────────────────────────┐
│  System Dashboard - 系统仪表板                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   Skills  │  │   MCP    │  │  System  │        │
│  │   66      │  │   12     │  │  Status  │        │
│  │   Active   │  │   Active  │  │  Running  │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                             │
│  ┌─────────────────────────────────────────────────┐      │
│  │  Quick Actions - 快速操作                    │      │
│  │  [🔄 Refresh] [💾 Save] [🔍 Search]       │      │
│  └─────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Skills 标签页
```
┌─────────────────────────────────────────────────────────────┐
│  Skills (66)                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Filter: [🔍 Search...] [Category▼] [Status▼]        │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ 📦 Obsidian (7)                                  │     │
│  │   🟢 obsidian-bases        obsidian-cli       │     │
│  │   🟢 obsidian-knowledge-base  json-canvas       │     │
│  │   🟢 obsidian-markdown      defuddle           │     │
│  │   🟢 obsidian-note-manager                     │     │
│  │                                                      │     │
│  │ 📦 AgentDB (5)                                    │     │
│  │   🟢 agentdb-advanced       agentdb-learning   │     │
│  │   🟢 agentdb-memory-patterns                    │     │
│  │                                                      │     │
│  │ 📦 GitHub (5)                                      │     │
│  │   🟢 github-code-review    github-multi-repo  │     │
│  │   🟢 github-project-management                   │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### MCP 标签页
```
┌─────────────────────────────────────────────────────────────┐
│  MCP Servers (12)                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ Server Name         Status    Type       Actions │     │
│  ├───────────────────────────────────────────────────┤     │
│  │ claude-flow        🟢 Active  stdio      [⚙️] [📝] │     │
│  │ ruv-swarm         🟢 Active  stdio      [⚙️] [📝] │     │
│  │ flow-nexus        🟢 Active  stdio      [⚙️] [📝] │     │
│  │ fetch             🟢 Active  npx        [⚙️] [📝] │     │
│  │ memory            🟢 Active  npx        [⚙️] [📝] │     │
│  │ filesystem         🟢 Active  npx        [⚙️] [📝] │     │
│  │ github            🟢 Active  npx        [⚙️] [📝] │     │
│  │ obsidian          🟢 Active  node       [⚙️] [📝] │     │
│  │ postgresql        🟡 Ready  npx        [⚙️] [📝] │     │
│  │ mysql             🟡 Ready  uvx        [⚙️] [📝] │     │
│  │ brave_search       🟡 Ready  npx        [⚙️] [📝] │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## API 接口

### 获取系统状态

```http
GET /api/status

Response:
{
  "skills": {
    "total": 66,
    "active": 66,
    "categories": {
      "obsidian": 7,
      "agentdb": 5,
      "github": 5,
      "flow-nexus": 3,
      "sparc": 1
    }
  },
  "mcp": {
    "total": 12,
    "active": 9,
    "ready": 3
  },
  "system": {
    "uptime": "2d 5h 30m",
    "version": "1.0.0"
  }
}
```

### 获取 Skills 列表

```http
GET /api/skills?category=obsidian&status=active

Response:
{
  "skills": [
    {
      "name": "obsidian-cli",
      "category": "Obsidian",
      "status": "active",
      "description": "Interact with Obsidian vaults...",
      "version": "1.0.0"
    }
  ]
}
```

### 获取 MCP 服务器列表

```http
GET /api/mcp

Response:
{
  "servers": [
    {
      "name": "claude-flow",
      "status": "active",
      "type": "stdio",
      "command": "npx",
      "args": ["claude-flow@alpha"]
    }
  ]
}
```

## 配置文件

### dashboard.config.json

```json
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
```

## 命令行工具

```bash
# 启动服务器
system-dashboard start [--port=8080]

# 停止服务器
system-dashboard stop

# 重启服务器
system-dashboard restart

# 查看状态
system-dashboard status

# 生成报告
system-dashboard report [--format=json|html|markdown]

# 备份配置
system-dashboard backup [--path=.]

# 恢复配置
system-dashboard restore [--path=.]
```

## 集成选项

### 与 Claude Code 集成

仪表板可以作为 Claude Code 的 companion tool，通过 MCP 服务器进行通信。

### 与其他 IDE 集成

- VS Code 扩展
- Cursor 扩展
- Windsurf 扩展
- Obsidian 插件

## 开发路线图

### v1.0 (当前版本）
- [x] Skills 列表展示
- [x] MCP 服务器展示
- [x] 基础 API 接口
- [ ] Web 界面实现
- [ ] 实时状态更新

### v1.1 (计划中）
- [ ] Skills 启用/禁用
- [ ] MCP 服务器配置
- [ ] 批量操作
- [ ] 配置导入/导出

### v2.0 (未来版本)
- [ ] AI 助手集成
- [ ] 自动优化建议
- [ ] 性能分析
- [ ] 使用统计

## 技术栈

- **后端**: Node.js + Express
- **前端**: HTML + CSS + JavaScript
- **通信**: WebSocket + REST API
- **存储**: JSON 文件
- **日志**: Winston

## 依赖项

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "ws": "^8.14.0",
    "winston": "^3.8.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

## 许可证

MIT License - 可自由使用和修改
