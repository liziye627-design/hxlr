# 严肃代码 - Serious Code

可读 + 可追踪 + 可自动化的代码规范体系。

强制加载技能，适用于所有需要团队协作、长期维护的项目。

## 核心理念

### 可读
"任何人打开文件都能快速读懂并安全修改"

- 统一的代码风格（格式化 + Lint + Code Review）
- 清晰的命名和注释
- 模块化设计（单文件 < 500 行）

### 可追踪
"每次变更都有记录、有原因、有回滚方案"

- Conventional Commits 提交信息格式
- Keep a Changelog 变更分类
- changes/ 目录记录每次变更

### 可自动化
"用工具保证规范，而不是靠个人自觉"

- 提交信息校验（commit-msg hook）
- 变更文件自动生成
- CHANGELOG 自动汇总

## 使用方法

### 项目初始化

当用户需要为新项目或现有项目建立严肃代码规范时：

```bash
# 1. 初始化项目结构
serious-code init <project-path>

# 2. 这会创建：
# - docs/CODING_STYLE.md
# - changes/README.md
# - changes/_template.md
# - .git/hooks/commit-msg (可选)
```

### 日常开发流程

#### 1. 开始新功能/修复

```bash
# 创建变更文件
serious-code new "feat: 添加用户认证" --type=Added

# 或手动创建
cp changes/_template.md changes/2026-02-15_001_login-auth.md
```

#### 2. 填写变更文件

编辑变更文件，包含：
- 背景和动机
- 做了什么
- 风险与回滚方案
- Git commit SHA

#### 3. 按 Conventional Commits 提交

```bash
# 格式：type(scope): description
git commit -m "feat(auth): 添加用户登录功能

# 可选 body
git commit -m "feat(auth): 添加用户登录功能

- 实现 JWT 认证
- 添加登录表单
- 集成 session 管理"

# 破坏性变更
git commit -m "feat(api)!: 重构用户接口"
```

#### 4. 提交前验证

```bash
# 本地验证（如果有 hook 会自动执行）
serious-code validate-commit "feat(auth): 添加用户登录"

# 验证变更文件完整性
serious-code validate-change changes/2026-02-15_001_login-auth.md
```

### 提交类型（Conventional Commits）

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(auth): 添加用户登录` |
| `fix` | 修复 bug | `fix(api): 修复空指针异常` |
| `docs` | 文档更新 | `docs(readme): 更新安装说明` |
| `style` | 代码风格（不影响逻辑） | `style(auth): 统一缩进` |
| `refactor` | 重构（不是新功能也不是修复） | `refactor(api): 简化请求处理` |
| `perf` | 性能优化 | `perf(query): 添加索引` |
| `test` | 测试相关 | `test(auth): 添加单元测试` |
| `chore` | 构建/工具相关 | `chore(deps): 升级依赖` |

### 变更分类（Keep a Changelog）

| 分类 | 说明 |
|------|------|
| `Added` | 新增功能 |
| `Changed` | 功能变更 |
| `Deprecated` | 即将废弃 |
| `Removed` | 已删除功能 |
| `Fixed` | 问题修复 |
| `Security` | 安全相关 |

## 项目结构

```
your-repo/
├── src/...
├── docs/
│   └── CODING_STYLE.md          # 代码风格指南
├── changes/                     # 变更记录目录
│   ├── README.md
│   ├── _template.md
│   ├── 2026-02-15_001_login-auth.md
│   └── 2026-02-15_002_fix-null-pointer.md
└── CHANGELOG.md                 # 变更日志（汇总）
```

## 代码风格检查清单

在写代码或代码审查时，确保：

### 基础规范
- [ ] 文件 < 500 行
- [ ] 函数 < 50 行
- [ ] 缩进统一（tabs 或 2/4 空格）
- [ ] 命名清晰（变量/函数/类/文件）
- [ ] 注释充分（为什么，不是是什么）

### 错误处理
- [ ] 所有外部调用有错误处理
- [ ] 不吞掉异常（至少 log）
- [ ] 边界条件检查
- [ ] 资源释放（defer/finally/try-with-resources）

### 测试
- [ ] 新功能有单元测试
- [ ] 修复有回归测试
- [ ] 关键路径有集成测试
- [ ] 测试覆盖率 > 80%

### 安全
- [ ] 输入验证
- [ ] 输出编码（防止 XSS）
- [ ] SQL 参数化（防止注入）
- [ ] 敏感数据不硬编码

## 自动化命令

```bash
# 初始化项目
serious-code init <project-path>

# 创建变更文件
serious-code new <title> [--type=Added|Changed|Fixed|Removed|Security|Deprecated]

# 验证提交信息
serious-code validate-commit "<commit-msg>"

# 验证变更文件
serious-code validate-change <change-file>

# 生成 CHANGELOG
serious-code gen-changelog

# 安装 git hooks
serious-code install-hooks
```

## 工作流集成

### Git Hooks

```bash
# 安装后自动执行
# .git/hooks/commit-msg: 验证提交信息格式
# .git/hooks/pre-commit: 检查代码风格（可选）
```

### CI/CD 集成

```yaml
# .github/workflows/serious-code.yml
name: Serious Code Check
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate Commits
        run: serious-code validate-commits
      - name: Validate Changes
        run: serious-code validate-changes
      - name: Check Style
        run: serious-code check-style
```

## 最佳实践

1. **每次变更一个文件**
   - 文件名格式：`YYYY-MM-DD_NNN_descriptive-title.md`
   - NNN 是递增序号

2. **提交前先创建变更文件**
   - 在 `changes/` 目录创建文件
   - 填写背景、内容、风险
   - 提交后补充 commit SHA

3. **定期更新 CHANGELOG**
   - 每次发布前运行 `serious-code gen-changelog`
   - 将 changes/ 中的条目按版本汇总
   - 归档旧变更文件

4. **代码审查必查项**
   - 变更文件是否完整
   - 提交信息是否符合规范
   - 代码风格是否一致
   - 测试是否充分

## 相关资源

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Autolinked References](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls)

## 版本

- 版本：1.0.0
- 创建日期：2026-02-15
- 兼容性：所有编程语言、所有 Git 平台
