---
name: opencode-troubleshooting
description: OpenCode 工具错误速查与排障
category: operations
tags: [opencode, troubleshooting, tools, files]
priority: medium
---

# OpenCode 工具故障排查

## 概述

记录 OpenCode 环境中常见工具错误和处理步骤，减少重复排查。

## 使用场景

- Read 提示文件不存在
- glob 提示 Tool execution aborted
- 需要确认项目路径或启动入口

## 快速入口

- 项目目录: `/mnt/c/Users/llwxy/opencode`
- 启动步骤: `./scripts/sync.sh` -> `opencode`

## 排查步骤

1. 先确认目录是否存在（`glob` 或 `ls`）。
2. 查找 `AGENTS.md` 时用 `glob` 搜索 `**/AGENTS.md`，不存在则跳过。
3. `glob` 搜索范围控制在具体目录，避免全盘模式。
4. 搜索失败时拆分为多个较小 pattern 再重试。
5. 把新问题补充到本 Skill。

## 已知问题与解决

### 问题 1：Read 文件不存在

**现象**: `Error: File not found: /mnt/c/Users/llwxy/opencode/AGENTS.md`

**原因**: 目标目录没有 `AGENTS.md`。

**解决方案**: 使用 `glob` 搜索确认是否存在；若无则跳过读取。

### 问题 2：glob 执行中断

**现象**: `Tool execution aborted`（使用 `glob` 搜索 `**/*obsidian*`）。

**原因**: 搜索范围过大或匹配结果过多。

**解决方案**: 限定 `path` 到具体目录（如 `/mnt/c/Users/llwxy/opencode`）并分段搜索。

### 问题 3：rg 命令缺失

**现象**: `/bin/bash: line 1: rg: command not found`

**原因**: 未安装 ripgrep。

**解决方案**: 临时改用 `grep`，或安装 ripgrep 后再使用 `rg`。

### 问题 4：npm 安装目录残留

**现象**: `npm error ENOTEMPTY: directory not empty, rename ... oh-my-opencode`

**原因**: 之前安装中断，残留目录导致无法覆盖。

**解决方案**: 删除残留目录后再执行安装。

### 问题 5：npm 安装超时

**现象**: `bash tool terminated command after exceeding timeout`

**原因**: 下载依赖耗时或网络慢。

**解决方案**: 重新执行安装，必要时延长超时或离线安装。

## 参考

- `/mnt/c/Users/llwxy/opencode/README.md`
- `/mnt/c/Users/llwxy/opencode/skills/README.md`
