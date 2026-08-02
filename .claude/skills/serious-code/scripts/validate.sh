#!/bin/bash
# serious-code validate - 验证提交信息和变更文件
# 使用方法: serious-code validate-commit "message" 或 serious-code validate-change <file>

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 显示帮助
show_help() {
  cat << EOF
严肃代码 - 验证工具

使用方法:
  serious-code validate-commit "message"
  serious-code validate-change <file>

命令:
  validate-commit  验证提交信息格式（Conventional Commits）
  validate-change  验证变更文件完整性

示例:
  serious-code validate-commit "feat(auth): 添加用户登录"
  serious-code validate-change changes/2026-02-15_001_login-auth.md
EOF
}

# 获取命令
if [ $# -lt 1 ]; then
  show_help
  exit 1
fi

COMMAND=$1
shift

case $COMMAND in
  validate-commit)
      if [ $# -lt 1 ]; then
        error "请提供提交信息"
      fi
      COMMIT_MSG="$1"

      # Conventional Commits 正则表达式
      PATTERN='^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(\(.+\))?\!?:\s.+'


      if [[ $COMMIT_MSG =~ $PATTERN ]]; then
        success "✅ 提交信息格式正确"
        echo ""
        echo "解析结果:"
        echo "  类型: ${BASH_REMATCH[1]}"
        if [ -n "${BASH_REMATCH[2]}" ]; then
          echo "  范围: ${BASH_REMATCH[2]}"
        fi
        if [ -n "${BASH_REMATCH[3]}" ]; then
          if [[ ${BASH_REMATCH[3]} == "!" ]]; then
            echo "  破坏性变更: 是"
          fi
        fi
        echo "  描述: ${COMMIT_MSG##*: }"
        exit 0
      else
        error "提交信息格式错误"
        ;;
  validate-change)
      if [ $# -lt 1 ]; then
        error "请提供变更文件路径"
      fi

      CHANGE_FILE="$1"

      if [ ! -f "$CHANGE_FILE" ]; then
        error "文件不存在: $CHANGE_FILE"
      fi

      WARNINGS=0
      ERRORS=0

      echo "验证变更文件: $CHANGE_FILE"
      echo ""

      # 检查是否使用了模板
      if grep -q "一句话标题" "$CHANGE_FILE" 2>/dev/null; then
        warn "文件包含模板内容，请填完整"
        WARNINGS=$((WARNINGS + 1))
      fi

      # 检查必需章节
      REQUIRED_SECTIONS=(
        "## 背景 / 为什么要改"
        "## 做了什么"
        "## 风险与回滚"
        "## Git 关联"
      )

      for section in "${REQUIRED_SECTIONS[@]}"; do
        if ! grep -q "$section" "$CHANGE_FILE" 2>/dev/null; then
          error "缺少必需章节: $section"
          ERRORS=$((ERRORS + 1))
        fi
      done

      # 检查是否有 commit SHA
      if ! grep -qE '\`[a-f0-9]+\`' "$CHANGE_FILE" 2>/dev/null; then
        warn "未找到 Git commit SHA，请在完成 Git 提交后补充"
        WARNINGS=$((WARNINGS + 1))
      fi

      echo ""
      if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
        success "✅ 变更文件验证通过"
        exit 0
      elif [ $ERRORS -eq 0 ]; then
        warn "⚠️  验证通过，但有 $WARNINGS 个警告"
        exit 0
      else
        error "验证失败: $ERRORS 个错误, $WARNINGS 个警告"
        fi
      ;;
  -h|--help|help)
      show_help
      exit 0
      ;;
  *)
      error "未知命令: $COMMAND"
      ;;
esac
