#!/bin/bash
# serious-code new - 创建新的变更记录文件
# 使用方法: serious-code new <title> [--type=TYPE]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
严肃代码 - 创建变更记录

使用方法:
  serious-code new <title> [--type=TYPE]

参数:
  title        变更标题（描述性，小写，连字符分隔）

选项:
  --type=TYPE   变更类型: Added|Changed|Deprecated|Removed|Fixed|Security
  -h, --help    显示帮助信息

类型说明:
  Added      新增功能
  Changed    功能变更
  Deprecated 即将废弃
  Removed     已删除功能
  Fixed       问题修复
  Security    安全相关

示例:
  serious-code new "添加用户登录" --type=Added
  serious-code new "fix-null-pointer" --type=Fixed
  serious-code new "重构API接口" --type=Changed
EOF
}

# 解析参数
TITLE=""
TYPE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_help
      exit 0
      ;;
    --type=*)
      TYPE="${1#--type=}"
      ;;
    -*)
      error "未知选项: $1"
      ;;
    *)
      if [ -z "$TITLE" ]; then
        TITLE="$1"
      else
        error "多余的参数: $1"
      fi
      ;;
  esac
  shift
done

# 检查标题
if [ -z "$TITLE" ]; then
  error "请提供变更标题"
fi

# 标准化标题（小写、空格转连字符）
TITLE_NORMALIZED=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

# 获取当前日期
DATE=$(date +%Y-%m-%d)

# 查找今日序号
PROJECT_PATH="$(pwd)"
CHANGES_DIR="$PROJECT_PATH/changes"

if [ ! -d "$CHANGES_DIR" ]; then
  error "变更目录不存在: $CHANGES_DIR"
fi

# 查找今日已有的变更文件
EXISTING_FILES=$(find "$CHANGES_DIR" -maxdepth 1 -name "${DATE}_*.md" 2>/dev/null || true)

if [ -n "$EXISTING_FILES" ]; then
  # 获取最大序号
  LAST_NUM=$(ls "$CHANGES_DIR"/${DATE}_*.md 2>/dev/null | sed "s|.*${DATE}_||" | sed "s|_.*||" | sort -n | tail -1)
  if [ -n "$LAST_NUM" ]; then
    NEXT_NUM=$((LAST_NUM + 1))
  else
    NEXT_NUM=1
  fi
else
  NEXT_NUM=1
fi

# 格式化序号（3 位数字）
NUM=$(printf "%03d" $NEXT_NUM)

# 生成文件名
FILENAME="${DATE}_${NUM}_${TITLE_NORMALIZED}.md"
FILEPATH="$CHANGES_DIR/$FILENAME"

# 检查文件是否已存在
if [ -f "$FILEPATH" ]; then
  error "文件已存在: $FILEPATH"
fi

# 复制模板
TEMPLATE_PATH="$SERIOUS_CODE_ROOT/templates/_template.md"
if [ ! -f "$TEMPLATE_PATH" ]; then
  error "模板文件不存在: $TEMPLATE_PATH"
fi

cp "$TEMPLATE_PATH" "$FILEPATH"

# 替换模板内容
sed -i "s/\[一句话标题\]/$TITLE/g" "$FILEPATH"
sed -i "s/YYYY-MM-DD/$DATE/g" "$FILEPATH"

if [ -n "$TYPE" ]; then
  # 更新类型复选框
  case $TYPE in
    Added)
      sed -i 's/- \[ \] 新增功能/- [x] 新增功能/' "$FILEPATH"
      ;;
    Changed)
      sed -i 's/- \[ \] Bug 修复/- [x] 功能变更/' "$FILEPATH"
      ;;
    Deprecated)
      sed -i 's/- \[ \] 其他：__________/- [x] 即将废弃/' "$FILEPATH"
      ;;
    Removed)
      sed -i 's/- \[ \] 新增功能/- [x] 删除功能/' "$FILEPATH"
      ;;
    Fixed)
      sed -i 's/- \[ \] Bug 修复/- [x] Bug 修复/' "$FILEPATH"
      ;;
    Security)
      sed -i 's/- \[ \] 其他：__________/- [x] 安全加固/' "$FILEPATH"
      ;;
  esac
fi

# 完成
echo ""
info "✅ 变更文件已创建: $FILENAME"
echo ""
info "文件路径: $FILEPATH"
echo ""
info "下一步:"
echo "  1. 编辑变更文件，填完整内容"
echo "  2. 提交代码时使用 Conventional Commits 格式"
echo "  3. 在变更文件中记录 commit SHA"
echo ""

# 可选：打开编辑器
if command -v code &> /dev/null; then
  read -p "是否打开编辑器？(Y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    code "$FILEPATH"
  fi
fi
