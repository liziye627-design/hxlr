---
name: skill-creator
description: 基于 SKILL.md 规范的交互式创建器
category: development
tags: [skill, creation, SKILL.md, generator, template]
priority: high
---

# Skill Creator - SKILL.md 规范工具

## 目的

基于 [SKILL.md 规范](https://agentskills.io/specification) 的交互式创建器，快速生成符合规范的 Agent Skills。

## 功能特性

### 🚀 快速创建
- 交互式向导
- 3 种模板类型（基础/完整/Obsidian）
- 自动生成完整目录结构
- 自动创建 install.sh 安装脚本

### 📋 3 种模板

#### 1. 基础模板
- 简洁的 frontmatter
- 基础内容章节
- 适合快速创建简单技能

#### 2. 完整模板
- 完整 frontmatter（包含所有字段）
- 详细的章节结构
- 包含示例和最佳实践

#### 3. Obsidian 模板
- 集成 Obsidian MCP 工具
- 读取笔记、写入笔记、搜索笔记
- 自动化日志、批量操作

## 使用方法

### 快速开始

```bash
cd /mnt/c/Users/llwxy/opencode/skills/installed/skill-creator
./skill-creator.sh
```

### 创建流程

1. **输入基本信息**
   - Skill 名称
   - 简短描述
   - 分类
   - 标签（可选）

2. **选择模板类型**
   - 1) 基础（快速）
   - 2) 完整（推荐）
   - 3) Obsidian 集成

3. **选择保存位置**
   - ~/.config/opencode/skill/ (全局)
   - ~/.claude/skills/ (Claude 兼容)
   - 自定义路径

4. **自动生成**
   - SKILL.md 文件
   - 目录结构
   - 安装脚本

## 技能详情

### 基础模板结构
```
skill-name/
├── SKILL.md              # 主文件（frontmatter + 内容）
├── scripts/             # 可选脚本
├── templates/           # 可选模板
└── assets/              # 可选资源
```

### 完整模板结构
```
skill-name/
├── SKILL.md              # 主文件
├── scripts/
│   ├── install.sh         # 安装脚本
└── example.sh        # 示例脚本
├── templates/
│   ├── SKILL-Template.md  # 项目模板
│   ├── MCP-Config.md       # MCP 配置
│   └── Daily-Log.md        # 每日日志
└── assets/
    └── README.md            # 资源说明
```

### Obsidian 模板增强

#### 自动化功能
- 每日自动生成日志
- 批量更新 frontmatter
- 自动生成项目索引
- 定期清理归档

#### 智能集成
- obsidian-read - 读取笔记
- obsidian-write - 写入笔记
- obsidian-search - 搜索笔记
- obsidian-rag - RAG 检索
- obsidian-automation - 自动化管理

## 使用场景

### 场景 1：创建 Git 工作流 Skill

```bash
./skill-creator.sh
Skill 名称: git-workflow
描述: Git 版本控制工作流
分类: development
标签: git, version-control, workflow
模板: 1) 基础
保存: ~/.claude/skill/
```

### 场景 2：创建完整的项目 Skill

```bash
./skill-creator.sh
Skill 名称: project-manager
描述: 项目管理器
分类: development
标签: project, management
模板: 2) 完整
保存: ~/.claude/skill/
```

### 场景 3：创建 Obsidian 集成 Skill

```bash
./skill-creator.sh
Skill 名称: obsidian-note-manager
描述: Obsidian 笔记管理器
分类: obsidian
标签: obsidian, notes
模板: 3) Obsidian
保存: ~/.claude/skill/
```

## Frontmatter 字段

### 必需字段
```yaml
---
name: skill-name              # 技能名称
description: skill-description   # 简短描述
category: skill-category       # 分类
tags: [tag1, tag2]        # 标签（可选）
---
```

### 推荐字段

#### 分类
- `development` - 开发相关
- `testing` - 测试相关
- `docs` - 文档相关
- `productivity` - 生产力
- `automation` - 自动化
- `obsidian` - Obsidian 集成

#### 标签
- `git` - Git 操作
- `testing` - 测试
- `debugging` - 调试
- `docs` - 文档
- `obsidian` - Obsidian
- `automation` - 自动化

## 高级功能

### 自动化脚本

#### 1. 自动生成 install.sh
```bash
#!/bin/bash
# 自动生成安装脚本
# 包含复制到全局目录
# 自动启用技能
```

#### 2. 模板扩展
- 支持自定义模板
- 添加新的模板类型
- 模板继承

#### 3. 批量创建
- 支持从列表创建多个技能
- 批量更新 frontmatter

## SKILL.md 模板说明

### 基础模板

```markdown
---
name: my-awesome-skill
description: 我的一个很棒的技能
category: development
tags: [awesome, tool]
---

# 我的技能

## 概述
这个技能非常棒，能够...

## 使用场景
当用户需要时，加载此技能...

## 操作流程
1. 第一步：...
2. 第二步：...

## 注意事项
- 注意点 1
- 注意点 2
```

### 完整模板

```markdown
---
name: advanced-processor
description: 高级数据处理器
category: development
tags: [advanced, processor, data]
priority: high
compatibility:
  claude: true
  opencode: true
  github-copilot: true
  vscode: true
allowed-tools:
  - web-search
  - filesystem
  - git
---

# 高级数据处理器

## 概述
一个功能完整的数据处理技能...

## 使用场景
- 场景 1：...
- 场景 2：...

## 操作流程

### 1. 主要流程
详细步骤...

### 2. 可选流程
额外功能说明...

## 前提条件
- 前置条件 1
- 前置条件 2

## 操作步骤
- 步骤 1：...
- 步骤 2：...
- 步骤 3：...

## 输出格式
输出格式说明

## 示例

### 示例 1：基础用法
```
用户： 帮我处理文件
你的回复：执行文件操作...
```

### 示例 2：高级用法
```
用户: 分析这个 JSON 数据
你的回复：[详细分析结果]
```

## 注意事项
- 注意点 1
- 注意点 2

## 相关资源
- 资源 1
- 资源 2

## 故障排除

### 问题 1
**原因**: ...
**解决方案**: ...

### 问题 2
**原因**: ...
**解决方案**: ...

## 最佳实践

1. 保持简洁清晰
2. 提供示例
3. 添加注释
4. 文档完整
5. 测试技能功能
```

### Obsidian 集成模板

```markdown
---
name: obsidian-project-manager
description: 管理 Obsidian 项目笔记
category: obsidian
tags: [obsidian, project, notes]
compatibility:
  claude: true
  opencode: true
  github-copilot: true
  vscode: true
allowed-tools:
  - obsidian-read
  - obsidian-write
  - obsidian-search
  obsidian-rag
  obsidian-automation
---

# Obsidian 项目管理器

## 概述
管理 Obsidian Vault 中的项目笔记，包括创建、更新、搜索和自动化。

## Obsidian MCP 工具

### 读取笔记
使用 `obsidian-read` skill 读取项目笔记：
```
obsidian-read: "Projects/MyProject/README.md"
```

### 写入笔记
使用 `obsidian-write` skill 创建或更新笔记：
```
obsidian-write: "Projects/NewProject/project.md" "项目启动文档"

### 搜索笔记
使用 `obsidian-search` skill 搜索笔记：
```
obsidian-search: "Python" folder:Knowledge/Python
```

### 自动化管理
使用 `obsidian-automation` skill 自动化操作：
```
obsidian-automation: "批量更新状态"
obsidian-automation: "生成索引"
```

## 项目笔记结构

```
ObsidianVault/Projects/ProjectName/
├── README.md          # 项目说明
├── requirements/     # 依赖
├── architecture/    # 架构
├── logs/           # 日志
└── resources/      # 资源
```

## 自动化功能

### 每日日志
每天 09:00 自动创建：
```
Logs/daily/2026-01-13.md
```

### 批量更新
所有项目笔记加上 status 字段：
```
status: in-progress
```

### 自动索引
生成项目索引：
```markdown
# 项目索引

## 进行中
- [[Projects/ProjectA]]
- [[Projects/ProjectB]]

## 已完成
- [[Projects/ProjectC]]
- [[Projects/ProjectD]]
```

## 使用场景

### 场景 1：项目设置
用户：设置一个新项目
```
@skill-creator 创建一个新项目技能
你的回复：
[创建项目笔记结构]
```

### 场景 2：记录进展
用户：记录今天的进展
```
@obsidian-automation 自动生成日志
你的回复：
[保存到日志文件]
```

### 场景 3：查询知识库
用户：查询某个技术文档
```
@obsidian-search "PostgreSQL" "database"
@obsidian-rag 基于搜索结果回答
你的回复：
[从知识库找到的答案]
```

## 最佳实践

1. **保持一致性**
- 使用统一的笔记结构
- 遵循命名规范
- 定期更新状态

2. **使用标签系统**
- #project - 项目标记
- #database - 数据库相关
- #docs - 文档
- #todo - 待办事项

3. **建立链接关系**
- 使用 [[Link]] 连接相关笔记
- 使用 #标签建立交叉引用

4. **定期维护**
- 清理旧日志
- 归档已完成项目
- 更新过期状态

## 相关技能

- obsidian-read
- obsidian-write
- obsidian-search
- obsidian-rag
- obsidian-automation
- obsidian-templates
```

### 高级功能

### RAG 检索
- 基于语义的搜索
- 上下文增强
- 多源知识融合

### 自动化脚本
- 每日日志
- 批量操作
- 定期备份
```
