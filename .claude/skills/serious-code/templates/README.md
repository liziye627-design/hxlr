# 变更记录目录

本目录记录项目的所有重要变更，确保每次变更都可追溯、可理解、可回滚。

## 目录结构

```
changes/
├── README.md              # 本文件
├── _template.md           # 变更文件模板
├── _archived/             # 已归档的变更（可选）
│   ├── v1.0.0/
│   └── v1.1.0/
├── 2026-02-15_001_login-auth.md
├── 2026-02-15_002_fix-null-pointer.md
└── 2026-02-16_003_add-pagination.md
```

## 文件命名规范

### 格式
```
YYYY-MM-DD_NNN_descriptive-title.md
```

### 各部分说明
- **YYYY-MM-DD**: 变更日期
- **NNN**: 当日递增序号（001-999）
- **descriptive-title**: 描述性标题（小写、连字符分隔）

### 示例
```
✅ 2026-02-15_001_login-auth.md
✅ 2026-02-15_002_fix-null-pointer.md
✅ 2026-02-16_003_add-pagination.md

❌ 20260215_01.md（缺少描述）
❌ change-001.md（缺少日期）
❌ Login Auth.md（格式错误）
```

## 变更分类

每次变更必须在文件顶部声明类型：

| 类型 | 说明 | 使用场景 |
|------|------|----------|
| **Added** | 新增功能 | 添加新功能、新接口、新字段 |
| **Changed** | 功能变更 | 修改现有功能的行为 |
| **Deprecated** | 即将废弃 | 标记即将移除的功能 |
| **Removed** | 已删除功能 | 移除已废弃的功能 |
| **Fixed** | 问题修复 | 修复 bug、错误 |
| **Security** | 安全相关 | 安全漏洞修复、安全加固 |

## 工作流

### 1. 开始变更前

```bash
# 使用严肃代码 skill 创建变更文件
serious-code new "feat: 添加用户认证" --type=Added

# 或手动创建
cp _template.md 2026-02-15_001_login-auth.md
```

### 2. 填写变更文件

编辑变更文件，确保填完：
- [x] 背景和动机
- [x] 做了什么
- [x] 风险与回滚方案
- [x] Git commit SHA（提父后补充）

### 3. 关联 Git

在变更文件中记录：
```markdown
## Git 关联

### Commits
- `a1b2c3d` - feat(auth): 添加用户登录
- `d4e5f6g` - test(auth): 添加登录测试

### Pull Requests
- PR #42 - [链接](https://github.com/owner/repo/pull/42)
```

### 4. 提交规范

使用 Conventional Commits 格式：
```bash
# 格式
git commit -m "type(scope): description"

# 示例
git commit -m "feat(auth): 添加用户登录"
git commit -m "fix(api): 修复空指针异常"
git commit -m "docs(readme): 更新安装说明"
```

## 变更文件清单

### 2026-02
| 日期 | ID | 标题 | 类型 | 状态 |
|------|----|----|----|----|
| 02-15 | 001 | 登录认证 | Added | ✅ |
| 02-15 | 002 | 空指针修复 | Fixed | ✅ |
| 02-16 | 003 | 分页功能 | Added | 🔄 |

### 2026-01
| 日期 | ID | 标题 | 类型 | 状态 |
|------|----|----|----|----|
| 01-30 | 015 | 数据库迁移 | Changed | ✅ |
| 01-28 | 014 | 性能优化 | Changed | ✅ |

## 归档策略

### 何时归档
- 版本发布后
- 变更超过 50 条
- 每月定期归档

### 归档方式
```bash
# 创建版本目录
mkdir _archived/v1.2.0

# 移动已发布变更
mv 2026-01-*.md _archived/v1.2.0/

# 创建索引
echo "# v1.2.0 变更\n" > _archived/v1.2.0/README.md
ls -1 _archived/v1.2.0/*.md >> _archived/v1.2.0/README.md
```

## 验证清单

在 PR/MR 合并前检查：

- [ ] 变更文件已创建
- [ ] 变更文件内容完整
- [ ] 提交信息符合规范
- [ ] 代码审查通过
- [ ] 测试全部通过
- [ ] 文档已更新

## 自动化

### 使用严肃代码 skill

```bash
# 初始化项目
serious-code init .

# 创建变更文件
serious-code new "标题" --type=Fixed

# 验证提交
serious-code validate-commit "fix: 修复问题"

# 生成 CHANGELOG
serious-code gen-changelog
```

### Git Hooks

安装后自动验证：
```bash
# commit-msg hook: 验证提交格式
# pre-commit hook: 检查代码风格
```

## 参考资源

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [严肃代码 Skill](../SKILL.md)
