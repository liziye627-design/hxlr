---
description: (project - Skill) Web3 development environment setup and workflows, specifically focusing on Remix IDE, Remixd local connection, and Solidity development.
---

# Web3 Remix Skill

## 概述
此技能包含 Web3 开发环境的配置指南，特别是 Remix IDE 与本地文件系统 (Remixd) 的连接配置。

## Remixd 本地环境配置

### 1. 安装
```bash
npm install -g @remix-project/remixd
```

### 2. 标准启动命令
```bash
# 格式: remixd -s <共享目录绝对路径> --remix-ide <Remix网址>
remixd -s "/mnt/c/Users/llwxy/Documents/Web3-Projects/contracts" --remix-ide "https://remix.ethereum.org"
```

### 3. 一键启动脚本
已在用户环境中创建快捷脚本：
- **路径**: `/mnt/c/Users/llwxy/Documents/Web3-Projects/start_remixd.sh`
- **使用方法**:
  ```bash
  cd /mnt/c/Users/llwxy/Documents/Web3-Projects
  ./start_remixd.sh
  ```

### 4. Remix IDE 连接步骤
1. 打开 [https://remix.ethereum.org](https://remix.ethereum.org)
2. 点击左上角 **Workspaces** 下拉菜单
3. 选择 **"- connect to localhost -"**
4. 在弹窗中确认连接

## 常见问题排查 (Troubleshooting)

| 问题 | 原因 | 解决方案 |
| :--- | :--- | :--- |
| `URL Remix IDE instance has to be provided` | 启动命令缺少 URL 参数 | 确保包含 `--remix-ide "https://remix.ethereum.org"` |
| `Error: EACCES: permission denied` | 权限不足 | 使用 `sudo` 运行或检查文件夹权限 |
| Remix 网页显示 "Cannot connect" | 服务未启动或端口被占 | 检查终端是否在运行 remixd，确认 65520 端口未被占用 |
| 连接后文件不显示 | 路径错误 | 确认 `-s` 指定的路径是存在的绝对路径 |

## 最佳实践
- **Git 管理**: 建议在本地 `contracts` 目录下初始化 Git 仓库，使用 VS Code 进行版本控制。
- **混合开发**: 使用 VS Code 编写代码 (利用 Copilot 等插件)，使用 Remix 进行编译、部署和调试。
