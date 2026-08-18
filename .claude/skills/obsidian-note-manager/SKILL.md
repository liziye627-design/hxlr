---
name: obsidian-note-manager
description: 管理 Obsidian Vault 中的项目笔记
category: obsidian
tags: [obsidian, notes, project-management]
---

# Obsidian 项目笔记管理

## 概述

专注于 Obsidian Vault 中的项目笔记管理，包括创建、读取、更新、搜索项目笔记。

## Obsidian MCP 工具使用

### 读取笔记
使用 `obsidian-read` skill 读取项目笔记：
```
obsidian-read: "Projects/MyProject/project.md"
```

### 写入笔记
使用 `obsidian-write` skill 创建或更新笔记：
```
obsidian-write: "Projects/NewProject/project.md"
```

### 搜索笔记
使用 `obsidian-search` skill 搜索项目相关笔记：
```
obsidian-search: "PostgreSQL" "database" folder:Projects
```

## 项目笔记结构

### 基础结构
```
Projects/ProjectName/
├── project.md          # 项目主文档
├── README.md        # 项目说明
├── notes/           # 技术笔记
├── resources/       # 资源文件
└── logs/            # 执行日志

Logs/ProjectName/
├── daily/            # 每日日志
└── project-log-*.md    # 执行日志

Reports/ProjectName/
├── summary-*.md        # 总结报告
└── evaluation*.md       # 评估报告
```

### 高级结构
```
Projects/ProjectName/
├── project.md
├── requirements/
│   ├── user-stories.md
│   └── tech-specs.md
├── design/
│   ├── ui-ux.md
│   └── api-design.md
└── implementation/
    ├── frontend/
    ├── backend/
    └── deployment/
└── testing/
└── archive/        # 已归档
```

## 使用场景

### 1. 项目设置
```
用户: 帮我设置一个 WebAPI 后端项目

Agent 执行：
1. obsidian-templates: 读取 Project.md 模板
2. 填充项目信息
3. 创建项目笔记结构
4. 使用 obsidian-write: 保存所有笔记
```

### 2. 记录进展
```
用户: 记录今天的进展

Agent 执行：
1. obsidian-templates: 使用 Daily-Log.md 模板
2. 填充今日任务和完成情况
3. 使用 obsidian-write: 创建日志笔记
4. 更新项目状态
```

### 3. 查询历史
```
用户: 查看 PostgreSQL 配置的笔记

Agent 执行：
1. obsidian-search: "PostgreSQL" + "MCP" + "配置"
2. obsidian-read: 读取找到的配置笔记
3. 总结关键配置步骤
4. 使用 obsidian-write: 保存查询结果
```

## 最佳实践

### 命名规范
- 使用连字符：`Project-Name-Feature-Name` 格式
- 使用标签：`project`、`mcp`、`database`、`obsidian`
- 使用日期：`2026-01-13` 标签用于定期回顾

### 文档组织
- `project.md` - 项目主文档
- `requirements/` - 需求和用户故事
- `design/` - 设计文档
- `implementation/` - 实现代码
- `logs/` - 日志文件
- `archive/` - 已归档内容

## 相关技能

- obsidian-read - 读取笔记
- obsidian-write - 写入笔记
- obsidian-search - 搜索笔记
- obsidian-rag - RAG 增强
- obsidian-automation - 自动化管理
- obsidian-templates - 模板管理
