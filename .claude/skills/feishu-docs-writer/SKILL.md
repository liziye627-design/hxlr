---
name: "feishu-docs-writer"
description: "飞书 Docx 文档写入与块操作 Skill。用于配置 MCP、创建文档、写入块内容与返回文档链接的标准工作流场景。"
---

# 飞书文档写入（Docx + MCP）

## 概述
将飞书 Docx 文档写入能力沉淀为可调用流程：
- 一次性完成飞书开放平台配置与授权
- 本地配置 MCP Server
- 使用标准步骤创建文档并写入块

## 适用场景
- 在 Claude Code / OpenCode 中自动创建飞书文档
- 批量写入标题/段落/列表/代码块等内容
- 需要可复用的 MCP 配置模板与权限清单

## 一次性前置配置（飞书开放平台）
1. 创建企业自建应用并获取 App ID / App Secret
2. 权限管理开启：
   - docx:document:read
   - docx:document:write
   - docx:document:create
   - docx:block:read
   - docx:block:write
3. OAuth 回调 URL：
   - http://localhost:3000/callback

## 本地授权登录（一次性）
```bash
npx -y @larksuiteoapi/lark-mcp login \
  -a cli_your_app_id \
  -s your_app_secret \
  --scope offline_access docx:document
```

## MCP Server 配置模板
**Claude Code（VS Code）**：`.vscode/settings.json`
```json
{
  "claude.mcp.servers": {
    "feishu": {
      "command": "npx",
      "args": [
        "-y",
        "@larksuiteoapi/lark-mcp",
        "mcp",
        "-a",
        "cli_your_app_id",
        "-s",
        "your_app_secret",
        "--oauth",
        "--token-mode",
        "user_access_token",
        "-t",
        "docx.v1.document.create,docx.v1.document.get,docx.v1.block.create,docx.v1.block.get,docx.v1.block.list"
      ]
    }
  }
}
```

**OpenCode / Cursor**：`~/.opencode/mcp.json` 或 `~/.cursor/mcp.json`
```json
{
  "mcpServers": {
    "feishu": {
      "command": "npx",
      "args": [
        "-y",
        "@larksuiteoapi/lark-mcp",
        "mcp",
        "-a",
        "cli_your_app_id",
        "-s",
        "your_app_secret",
        "--oauth",
        "--token-mode",
        "user_access_token",
        "-t",
        "docx.v1.document.create,docx.v1.document.get,docx.v1.block.create,docx.v1.block.get,docx.v1.block.list"
      ]
    }
  }
}
```

## 标准工作流（最小可用）
1. 创建文档：`docx.v1.document.create`
2. 批量写入块：`docx.v1.block.create`
3. 返回文档链接：`https://doc.feishu.cn/docx/{document_id}`

## 块类型建议
- heading1/heading2/heading3
- text
- bullet/ordered
- code
- quote
- divider

## 常见问题
- **权限不足**：检查 docx:document:* 与 docx:block:* 是否已开
- **Token 无效**：重新执行 login 获取 user_access_token
- **MCP 配置未生效**：确认客户端配置路径是否正确并重启

## 快速示例指令
“帮我创建一个飞书文档，标题《项目总结》，包含：
1) 项目目标（标题+段落）
2) 完成情况（列表）
3) 技术栈（代码块）
4) 遇到的问题与解决方案（引用）”
