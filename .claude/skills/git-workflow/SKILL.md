---
name: git-workflow
description: Git 版本控制工作流管理
category: development
tags: [git, version-control, workflow]
priority: high
---

# Git 工作流管理

## 概述

这是一个 Git 版本控制工作流管理的 skill，包含常见的 Git 操作和最佳实践。

## 常用命令

### 基础操作
```bash
# 查看状态
git status

# 查看差异
git diff
git diff --staged

# 添加文件
git add .
git add <file>

# 提交
git commit -m "message"
git commit -am "message"  # 添加并提交已跟踪文件
```

### 分支管理
```bash
# 查看分支
git branch
git branch -a  # 所有分支

# 创建分支
git branch <branch-name>
git checkout -b <branch-name>

# 切换分支
git checkout <branch-name>
git switch <branch-name>

# 删除分支
git branch -d <branch-name>
git branch -D <branch-name>  # 强制删除
```

### 远程操作
```bash
# 查看远程
git remote -v

# 推送
git push
git push origin <branch-name>

# 拉取
git pull
git fetch

# 克隆
git clone <url>
```

## 工作流程

### Feature 分支流程
1. 从 develop 分支创建 feature 分支
2. 在 feature 分支进行开发
3. 提交变更
4. 推送到远程
5. 创建 Pull Request
6. 合并到 develop
7. 删除 feature 分支

### Commit 信息规范
```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type):**
- feat: 新功能
- fix: 修复
- docs: 文档
- style: 格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

**示例:**
```
feat(auth): add OAuth login support

- Add Google OAuth integration
- Add token refresh mechanism
- Update user authentication flow

Closes #123
```

## 最佳实践

1. **提交前检查**
   - 运行测试: `npm test`
   - 检查 lint: `npm run lint`
   - 查看差异: `git diff`

2. **原子提交**
   - 每次提交只做一件事
   - 提交信息清晰描述变更

3. **分支命名**
   - feature/功能名称
   - bugfix/修复内容
   - hotfix/紧急修复

4. **代码审查**
   - 推送前自我审查
   - 保持代码风格一致
   - 添加必要的注释

## 故障排除

### 撤销操作
```bash
# 撤销工作区修改
git checkout -- <file>

# 撤销暂存区
git reset HEAD <file>

# 撤销最近一次提交（保留修改）
git reset --soft HEAD~1

# 撤销最近一次提交（不保留修改）
git reset --hard HEAD~1
```

### 合并冲突
```bash
# 查看冲突文件
git status

# 手动解决冲突后
git add <resolved-file>
git commit
```

## 参考资源

- [Git 官方文档](https://git-scm.com/doc)
- [GitHub Git 指南](https://guides.github.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
