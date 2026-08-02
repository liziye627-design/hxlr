---
name: skill-creator-template-basic
description: 基础 SKILL.md 模板 - 快速创建简单技能
category: template
tags: [template, basic, quick-start, beginner]
---

# 基础 SKILL.md 模板

## 概述
最简单的 SKILL.md 模板，用于快速创建基础的 Agent Skills。

## 使用指南

### 基础知识

创建技能时了解：
- Skill 的用途
- 何时使用
- 前置条件

### 快速创建

1. 填写信息
   - Skill 名称
   - 简短描述
   - 分类

2. 创建文件
   ```
mkdir -p ~/.claude/skill/my-skill-name
   cd ~/.claude/skill/my-skill-name
   # 创建 SKILL.md
   ```

3. 添加内容
   - Frontmatter（必须）
   - 概述（必须）
   - 使用场景（推荐）
   - 操作步骤（推荐）

4. 测试技能
   - 在 Agent 中使用
   - 验证功能

## Frontmatter 模板

```markdown
---
name: my-skill-name
description: 我的技能描述
category: development
tags: [tag1, tag2]
---

# 我的技能

## 概述
简短描述这个技能的用途...

## 使用场景
当用户需要时，使用此技能...

## 操作流程
1. 第一步：...
2. 第二步：...
3. 第三步：...

## 注意事项
- 注意点 1
- 注意点 2
```

## 最佳实践

1. 保持简洁
2. 提供示例
3. 文档完整
4. 定期测试
```

## 示例

### 示例：简单文件操作技能

```markdown
---
name: file-operations
description: 基础的文件操作技能
category: development
tags: [file, basic, beginner]
---

# 文件操作

## 概述
基础文件操作技能，包括读取、写入、删除文件。

## 使用场景
当需要操作文件系统时使用。

## 操作流程
1. 检查文件是否存在
2. 读取文件内容
3. 执行操作
4. 验证结果

## 注意事项
- 检查文件权限
- 避免覆盖重要文件
- 提供错误处理
```
```

### 示例：Git 工作流技能

```markdown
---
name: git-workflow
description: Git 版本控制工作流
category: development
tags: [git, version-control, beginner]
---

# Git 工作流

## 概述
Git 版本控制基础工作流，包括提交、推送、拉取等。

## 操作流程
1. 初始化仓库
2. 添加文件
3. 提交更改
4. 推送到远程

## 注意事项
- 提交信息要清晰
- 推送前先拉取
- 分支策略
```

## 快速开始

```bash
# 1. 创建技能目录
mkdir -p ~/.claude/skill/git-workflow
cd ~/.claude/skill/git-workflow

# 2. 创建 SKILL.md
# 使用上面的模板

# 3. 测试
# 在 Agent 中使用 git-workflow skill
```
```
