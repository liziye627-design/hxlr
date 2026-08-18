# MCP Discovery - MCP 服务器发现和管理

统一管理和发现所有可用的 MCP 服务器，包括 opencode、Pencil 和其他第三方服务器。

## 概述

### 什么是 MCP？

**Model Context Protocol (MCP)** 是一个开放标准，由 Anthropic 于 2024 年 11 月发布，用于连接 AI 模型与外部数据和工具。

### MCP 服务器类型

| 类型 | 描述 | 示例 |
|------|------|------|
| **stdio** | 通过标准输入/输出通信 | npx 执行的命令行工具 |
| **SSE** | 通过服务器发送事件通信 | HTTP SSE 端点 |
| **Node** | Node.js 进程内通信 | 内置模块 |
| **Browser** | 浏览器扩展通信 | Chrome/Firefox 扩展 |

---

## 已发现 MCP 服务器

### ✅ opencode/mcp/mcp.json (8 个服务器)

| 名称 | 状态 | 类型 | 命令 | 功能描述 |
|------|------|------|--------|----------|
| `ruv-swarm` | 🟢 Active | stdio | npx ruv-swarm@latest mcp start | Swarm 协调和分布式执行 |
| `fetch` | 🟢 Active | npx | npx -y @modelcontextprotocol/server-fetch | Web 内容获取和数据提取 |
| `memory` | 🟢 Active | npx | npx -y @modelcontextprotocol/server-memory | 持久化内存和会话管理 |
| `filesystem` | 🟢 Active | npx | npx -y @modelcontextprotocol/server-filesystem /path | 安全文件系统访问 |
| `github` | 🟢 Active | npx | npx -y @modelcontextprotocol/server-github | GitHub API 集成 |
| `obsidian` | 🟢 Active | node | node @beshkenadze/mcp-obsidian/dist/stdio.js | Obsidian vault 集成 |
| `postgresql` | 🟡 Ready | npx | npx -y @modelcontextprotocol/server-postgres | PostgreSQL 数据库集成 |
| `mysql` | 🟡 Ready | uvx | uvx mcp-server-mysql | MySQL 数据库集成 |
| `brave_search` | 🟡 Ready | npx | npx -y @modelcontextprotocol/server-brave-search | Brave 搜索引擎 |

### ✅ 已安装的全局 MCP 包 (4 个)

| 包名 | 版本 | 功能 |
|------|------|------|
| `@beshkenadze/mcp-obsidian` | 1.2.0 | Obsidian MCP 服务器 |
| `mcp-voice-interface` | 1.0.0 | 语音输入/输出接口 |
| `obsidian-mcp-server` | 2.0.7 | 替代 Obsidian MCP 服务器 |
| `with-context-mcp` | 3.0.7 | 上下文管理 MCP |

### ✅ Pencil MCP (自动运行)

| 名称 | 状态 | 类型 | 描述 |
|------|------|------|------|
| `pencil` | 🟢 Auto | 内置 | Pencil 内置 MCP 服务器，无需手动安装 |

**功能**：
- 读取视觉布局
- 生成像素级精确的代码（React, HTML 等）
- 与设计工作流深度集成
- 自动运行（使用 Pencil 时自动启动）

---

## MCP 服务器配置格式

### stdio 类型

```json
{
  "mcpServers": {
    "server-name": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "package-name"],
      "env": {
        "API_KEY": "your-key"
      }
    }
  }
}
```

### Node 类型

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {
        "CONFIG_PATH": "/path/to/config"
      }
    }
  }
}
```

---

## 使用方法

### 在 Claude Code 中启用 MCP

1. **编辑配置文件**
   ```bash
   # 编辑 Claude Code 设置
   code ~/.claude/settings.local.json
   ```

2. **添加服务器**
   ```json
   {
     "enabledMcpjsonServers": [
       "server-name-1",
       "server-name-2"
     ]
   }
   ```

3. **重启 Claude Code**

### 验证 MCP 连接

```bash
# 测试 MCP 服务器连接
mcp-test server-name

# 查看可用工具
mcp-list-tools server-name

# 调用特定工具
mcp-call server-name tool-name args
```

---

## MCP 工具发现

### 搜索可用 MCP 服务器

```bash
# 从 npm 搜索
npm search mcp-server

# 从 GitHub 搜索
# 访问 https://github.com/topics/mcp-server

# 从市场搜索
# 访问 https://modelcontextprotocol.io/servers
```

### 常用 MCP 服务器类别

| 类别 | 服务器 |
|------|--------|
| **文件系统** | filesystem, google-drive, dropbox |
| **数据库** | postgresql, mysql, sqlite, mongodb |
| **搜索** | brave-search, google-search, bing-search |
| **API** | github, gitlab, slack, notion |
| **开发** | puppeteer, playwright, browserbase |
| **设计** | pencil, figma, framer |
| **笔记** | obsidian, notion, evernote |

---

## 配置示例

### 完整配置示例

```json
{
  "enabledMcpjsonServers": [
    "ruv-swarm",
    "claude-flow",
    "fetch",
    "memory",
    "filesystem",
    "github",
    "obsidian",
    "postgresql",
    "mysql",
    "brave_search",
    "pencil"
  ],
  "mcpServers": {
    "ruv-swarm": {
      "type": "stdio",
      "command": "npx",
      "args": ["ruv-swarm@latest", "mcp", "start"]
    },
    "claude-flow": {
      "type": "stdio",
      "command": "npx",
      "args": ["claude-flow@alpha", "mcp", "start"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/mnt/c/Users/llwxy"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      }
    },
    "obsidian": {
      "command": "node",
      "args": ["/path/to/mcp-obsidian/dist/stdio.js"],
      "env": {
        "OBSIDIAN_VAULT_PATH": "/mnt/c/Users/llwxy/ObsidianVault"
      }
    },
    "postgresql": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://user:password@localhost:5432/dbname"
      }
    },
    "mysql": {
      "command": "uvx",
      "args": ["mcp-server-mysql"],
      "env": {
        "MYSQL_CONNECTION_STRING": "mysql://user:password@localhost:3306/dbname"
      }
    },
    "brave_search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your-api-key"
      }
    },
    "pencil": {
      "type": "builtin",
      "description": "Pencil built-in MCP server"
    }
  }
}
```

---

## 系统集成

### 与 System Dashboard 集成

```javascript
// 在 dashboard 中显示 MCP 服务器
async function getMcpServers() {
  const opencodeMcp = await loadOpencodeMcp();
  const globalMcp = await loadGlobalMcp();
  const pencilMcp = { name: 'pencil', status: 'auto', type: 'builtin' };

  return [...opencodeMcp, ...globalMcp, pencilMcp];
}
```

### 与 Skills 集成

```bash
# 在 skill 中使用 MCP 工具
mcp__pencil__get_editor_state
mcp__filesystem__read_file
mcp__github__create_pull_request
```

---

## 资源链接

### 官方资源
- [MCP 官方文档](https://modelcontextprotocol.io/)
- [Anthropic MCP 仓库](https://github.com/anthropics/mcp-spec)
- [MCP 服务器市场](https://modelcontextprotocol.io/servers)

### 社区资源
- [Awesome MCP Servers](https://github.com/pqx/aef-mcp-servers)
- [MCP SDK](https://github.com/anthropics/mcp-sdk)

### 特定服务器
- [Pencil MCP 文档](https://docs.pencil.dev/getting-started/installation)
- [Obsidian MCP](https://github.com/beshkenadze/mcp-obsidian)
- [GitHub MCP](https://github.com/modelcontextprotocol/servers/tree/main/src/github)

---

## 版本信息

- 创建日期：2026-02-15
- 支持的 MCP 版本：2024-11+
- 兼容性：Claude Code, Cursor, Windsurf 等
