---
name: obsidian-knowledge-base
description: 将 Obsidian Vault 作为知识库进行智能问答和检索
category: obsidian
tags: [obsidian, rag, knowledge-base, retrieval]
---

# Obsidian 知识库

## 概述

将 Obsidian Vault 作为知识库，支持语义搜索和上下文增强，让 Agent 能够基于你的笔记提供更准确的答案。

## RAG 检索增强

### 语义搜索
不是简单的关键词匹配，而是"语义相关"搜索：
- 搜索："数据库连接" 会返回：
  - PostgreSQL 配置步骤
  - MySQL 连接字符串格式
  - 数据库认证方法

### 知识库集成
跨笔记的链接分析：
```
Project A 笔记提到 [[Knowledge/Database/PostgreSQL]]
  ↓
自动加载那些笔记作为上下文
  ↓
上下文更丰富，答案更准确
```

### 上下文增强
读取相关笔记作为上下文，使回答更加准确和有依据。

## 使用场景

### 1. 配置查询
```
用户: 如何配置 PostgreSQL MCP？

Agent 执行：
1. obsidian-search: "PostgreSQL" + "MCP" + "配置"
2. obsidian-rag: 基于搜索结果生成详细答案
3. obsidian-read: 读取配置模板
4. 生成完整配置步骤
```

### 2. 项目历史查询
```
用户: 我之前配置过类似的数据库

Agent 执行：
1. obsidian-search: "database" + "配置" + "PostgreSQL"
2. obsidian-rag: 检索历史配置
3. 基于找到的配置文档
4. 对比并提供优化建议
```

### 3. 技术参考查询
```
用户: Obsidian 中有哪些 Python 相关的笔记？

Agent 执行：
1. obsidian-search: "Python" + "开发" + "SDK"
2. obsidian-read: 读取所有相关笔记
3. 提取技术规范和最佳实践
4. 总结整理为文档
```

### 4. 经验总结查询
```
用户: 之前遇到类似问题的解决方案是什么？

Agent 执行：
1. obsidian-search: 问题类型 + "解决方案"
2. obsidian-read: 读取问题解决步骤
3. obsidian-rag: 生成总结
4. 提供相关链接
```

## 常见提示词

- "搜索我 Obsidian 里关于 PostgreSQL 的笔记"
- "基于我的项目文档生成技术方案"
- "总结我所有数据库相关的笔记"
- "查找项目中类似功能的实现"

## 最佳实践

1. **笔记组织**
- 使用 frontmatter 组织元数据
- 使用标签分类笔记（project, mcp, obsidian 等）
- 建立清晰的目录结构
- 使用 [[Link]] 建立笔记间的关联

2. **知识积累**
- 记录配置步骤和经验
- 文档化问题和解决方案
- 整理技术文档和参考
- 维护最佳实践清单

3. **RAG 提示词使用**
- 明确指定搜索关键词
- 使用场景和分类
- 引用相关的 Obsidian 笔记
- 避免通用的查询

## 工作流

### 输入：用户提问

**1. 关键词识别**
分析用户问题，提取关键搜索词

**2. 知询知识库**
使用 obsidian-search 搜索相关笔记

**3. 读取上下文**
使用 obsidian-read 读取详细信息

**4. RAG 增强**
使用 obsidian-rag 基于笔记生成答案

**5. 输出结果**
返回包含引用的详细答案

## 参考技能

- obsidian-read - 读取笔记
- obsidian-write - 写入笔记
- obsidian-search - 搜索笔记
- obsidian-rag - RAG 增强
- obsidian-automation - 自动化管理
