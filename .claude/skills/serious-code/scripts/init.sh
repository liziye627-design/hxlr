#!/bin/bash
# serious-code init - 初始化严肃代码项目结构
# 使用方法: serious-code init <project-path>

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 技能目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERIOUS_CODE_ROOT="$(dirname "$SCRIPT_DIR")"

# 打印消息
info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

# 显示帮助
show_help() {
  cat << EOF
严肃代码 - 项目初始化

使用方法:
  serious-code init <project-path>

参数:
  project-path  项目路径（默认：当前目录）

选项:
  -h, --help     显示帮助信息
  --no-hooks      不安装 git hooks

示例:
  serious-code init .
  serious-code init ~/my-project
  serious-code init . --no-hooks
EOF
}

# 解析参数
PROJECT_PATH="."
INSTALL_HOOKS=true

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_help
      exit 0
      ;;
    --no-hooks)
      INSTALL_HOOKS=false
      ;;
    -*)
      error "未知选项: $1"
      ;;
    *)
      PROJECT_PATH="$1"
      ;;
  esac
  shift
done

# 检查项目路径
if [ ! -d "$PROJECT_PATH" ]; then
  error "项目路径不存在: $PROJECT_PATH"
fi

# 转换为绝对路径
PROJECT_PATH="$(cd "$PROJECT_PATH" && pwd)"

info "初始化严肃代码项目..."
info "项目路径: $PROJECT_PATH"

# 创建目录结构
info "创建目录结构..."

mkdir -p "$PROJECT_PATH/docs"
mkdir -p "$PROJECT_PATH/changes"
mkdir -p "$PROJECT_PATH/changes/_archived"

# 复制模板文件
info "复制模板文件..."

cp "$SERIOUS_CODE_ROOT/templates/_template.md" "$PROJECT_PATH/changes/_template.md"
cp "$SERIOUS_CODE_ROOT/templates/README.md" "$PROJECT_PATH/changes/README.md"
cp "$SERIOUS_CODE_ROOT/templates/CODING_STYLE.md" "$PROJECT_PATH/docs/CODING_STYLE.md"

# 创建 CHANGELOG.md
if [ ! -f "$PROJECT_PATH/CHANGELOG.md" ]; then
  info "创建 CHANGELOG.md..."
  cat > "$PROJECT_PATH/CHANGELOG.md" << 'EOF'
# 变更日志 (CHANGELOG)

本文件记录项目的所有重要变更。

格式遵循 [Keep a Changelog](https://keepachangelog.com/) 规范。

## [Unreleased]

### Added
- 变更记录目录结构初始化

## [1.0.0] - 2026-02-15

### Added
- 初始版本
EOF
else
  warn "CHANGELOG.md 已存在，跳过创建"
fi

# 创建 .gitignore 条目
if [ -d "$PROJECT_PATH/.git" ]; then
  info "更新 .gitignore..."
  if ! grep -q "^changes/_archived/" "$PROJECT_PATH/.gitignore" 2>/dev/null; then
    echo "changes/_archived/" >> "$PROJECT_PATH/.gitignore"
  fi
else
  warn "不是 Git 仓库，跳过 .gitignore 更新"
fi

# 安装 git hooks
if [ "$INSTALL_HOOKS" = true ] && [ -d "$PROJECT_PATH/.git" ]; then
  info "安装 git hooks..."

  HOOKS_DIR="$PROJECT_PATH/.git/hooks"
  COMMIT_MSG_HOOK="$HOOKS_DIR/commit-msg"
  PRE_COMMIT_HOOK="$HOOKS_DIR/pre-commit"

  # commit-msg hook
  cat > "$COMMIT_MSG_HOOK" << 'EOF'
#!/bin/bash
# commit-msg hook - 验证 Conventional Commits 格式

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Conventional Commits 正则表达式
# 格式: type(scope): description
PATTERN='^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(\(.+\))?\!?:\s.+'

if ! [[ $COMMIT_MSG =~ $PATTERN ]]; then
  echo "❌ 提交信息格式错误!"
  echo ""
  echo "请使用 Conventional Commits 格式:"
  echo "  type(scope): description"
  echo ""
  echo "类型 (type):"
  echo "  feat     - 新功能"
  echo "  fix      - 修复 bug"
  echo "  docs     - 文档变更"
  echo "  style    - 代码风格"
  echo "  refactor - 重构"
  echo "  perf     - 性能优化"
  echo "  test     - 测试相关"
  echo "  chore    - 构建/工具"
  echo ""
  echo "示例:"
  echo "  feat(auth): 添加用户登录"
  echo "  fix(api): 修复空指针异常"
  echo "  docs(readme): 更新安装说明"
  echo ""
  echo "详见: https://www.conventionalcommits.org/"
  exit 1
fi

echo "✅ 提交信息格式验证通过"
EOF

  chmod +x "$COMMIT_MSG_HOOK"

  # pre-commit hook (可选)
  cat > "$PRE_COMMIT_HOOK" << 'EOF'
#!/bin/bash
# pre-commit hook - 检查变更文件

# 检查是否有新变更文件
STAGED_FILES=$(git diff --cached --name-only | grep -E '^changes/' || true)

if [ -n "$STAGED_FILES" ]; then
  for file in $STAGED_FILES; do
    # 检查是否使用了模板
    if grep -q "一句话标题" "$file" 2>/dev/null; then
      echo "⚠️  警告: 变更文件 $file 似乎使用了模板内容"
      echo "请确保已填完整内容"
    fi
  done
fi

echo "✅ 变更文件检查通过"
EOF

  chmod +x "$PRE_COMMIT_HOOK"

  info "Git hooks 安装完成"
else
  info "跳过 git hooks 安装"
fi

# 完成
echo ""
info "✅ 严肃代码项目初始化完成!"
echo ""
info "下一步:"
echo "  1. 阅读 docs/CODING_STYLE.md 了解代码风格"
echo "  2. 阅读 changes/README.md 了解变更记录规范"
echo "  3. 使用 'serious-code new' 创建变更文件"
echo ""
