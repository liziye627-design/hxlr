#!/bin/bash
# serious-code gen-changelog - 生成 CHANGELOG
# 使用方法: serious-code gen-changelog

set -e

# 颜色定义
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# 打印消息
info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

# 项目路径
PROJECT_PATH="$(pwd)"
CHANGES_DIR="$PROJECT_PATH/changes"
CHANGELOG_FILE="$PROJECT_PATH/CHANGELOG.md"

info "生成 CHANGELOG..."
info "项目路径: $PROJECT_PATH"

# 检查目录
if [ ! -d "$CHANGES_DIR" ]; then
  echo "错误: 变更目录不存在: $CHANGES_DIR"
  exit 1
fi

# 查找所有变更文件（排除模板和归档）
CHANGE_FILES=$(find "$CHANGES_DIR" -maxdepth 1 -name "*.md" \
  ! -name "_template.md" \
  ! -name "README.md" \
  2>/dev/null | sort)

if [ -z "$CHANGE_FILES" ]; then
  echo "警告: 未找到变更文件"
  exit 0
fi

# 分类统计
declare -A ADDED
declare -A CHANGED
declare -A DEPRECATED
declare -A REMOVED
declare -A FIXED
declare -A SECURITY

# 解析变更文件
for file in $CHANGE_FILES; do
  filename=$(basename "$file")

  # 提取类型
  if grep -q "> \*\*类型\*\*: Added" "$file" 2>/dev/null; then
    ADDED+=("$filename")
  elif grep -q "> \*\*类型\*\*: Changed" "$file" 2>/dev/null; then
    CHANGED+=("$filename")
  elif grep -q "> \*\*类型\*\*: Deprecated" "$file" 2>/dev/null; then
    DEPRECATED+=("$filename")
  elif grep -q "> \*\*类型\*\*: Removed" "$file" 2>/dev/null; then
    REMOVED+=("$filename")
  elif grep -q "> \*\*类型\*\*: Fixed" "$file" 2>/dev/null; then
    FIXED+=("$filename")
  elif grep -q "> \*\*类型\*\*: Security" "$file" 2>/dev/null; then
    SECURITY+=("$filename")
  fi
done

# 生成输出
OUTPUT=""
NEW_LINE=$'\n'

# Added
if [ ${#ADDED[@]} -gt 0 ]; then
  OUTPUT+="### Added${NEW_LINE}"
  for file in "${ADDED[@]}"; do
    # 提取标题（第一行 # 变更：之后的内容）
    title=$(grep "^# 变更：" "$file" | sed 's/^# 变更：//' | head -1)
    OUTPUT+="  - $title ([${file}](${CHANGES_DIR}/${file}))${NEW_LINE}"
  done
  OUTPUT+="${NEW_LINE}"
fi

# Changed
if [ ${#CHANGED[@]} -gt 0 ]; then
  OUTPUT+="### Changed${NEW_LINE}"
  for file in "${CHANGED[@]}"; do
    title=$(grep "^# 变更：" "$file" | sed 's/^# 变更：//' | head -1)
    OUTPUT+="  - $title ([${file}](${CHANGES_DIR}/${file}))${NEW_LINE}"
  done
  OUTPUT+="${NEW_LINE}"
fi

# Deprecated
if [ ${#DEPRECATED[@]} -gt 0 ]; then
  OUTPUT+="### Deprecated${NEW_LINE}"
  for file in "${DEPRECATED[@]}"; do
    title=$(grep "^# 变更：" "$file" | sed 's/^# 变更：//' | head -1)
    OUTPUT+="  - $title ([${file}](${CHANGES_DIR}/${file}))${NEW_LINE}"
  done
  OUTPUT+="${NEW_LINE}"
fi

# Removed
if [ ${#REMOVED[@]} -gt 0 ]; then
  OUTPUT+="### Removed${NEW_LINE}"
  for file in "${REMOVED[@]}"; do
    title=$(grep "^# 变更：" "$file" | sed 's/^# 变更：//' | head -1)
    OUTPUT+="  - $title ([${file}](${CHANGES_DIR}/${file}))${NEW_LINE}"
  done
  OUTPUT+="${NEW_LINE}"
fi

# Fixed
if [ ${#FIXED[@]} -gt 0 ]; then
  OUTPUT+="### Fixed${NEW_LINE}"
  for file in "${FIXED[@]}"; do
    title=$(grep "^# 变更：" "$file" | sed 's/^# 变更：//' | head -1)
    OUTPUT+="  - $title ([${file}](${CHANGES_DIR}/${file}))${NEW_LINE}"
  done
  OUTPUT+="${NEW_LINE}"
fi

# Security
if [ ${#SECURITY[@]} -gt 0 ]; then
  OUTPUT+="### Security${NEW_LINE}"
  for file in "${SECURITY[@]}"; do
    title=$(grep "^# 变更：" "$file" | sed 's/^# 变更：//' | head -1)
    OUTPUT+="  - $title ([${file}](${CHANGES_DIR}/${file}))${NEW_LINE}"
  done
  OUTPUT+="${NEW_LINE}"
fi

# 显示结果
echo ""
echo "=== CHANGELOG 内容 ==="
echo ""
echo "$OUTPUT"
echo ""

# 询问是否写入文件
read -p "是否写入 CHANGELOG.md？(Y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  # 获取当前日期
  DATE=$(date +%Y-%m-%d)

  # 追加到 CHANGELOG.md（在 [Unreleased] 之后）
  if [ -f "$CHANGELOG_FILE" ]; then
    # 创建备份
    cp "$CHANGELOG_FILE" "${CHANGELOG_FILE}.bak"

    # 在 [Unreleased] 后插入内容
    awk -v content="$OUTPUT" -v date="$DATE" '
      /^\[Unreleased\]/ {
        print
        print ""
        print "## [" date "]"
        print ""
        print content
        next
      }
      { print }
    ' "${CHANGELOG_FILE}.bak" > "$CHANGELOG_FILE"

    info "✅ CHANGELOG.md 已更新"
    info "备份: ${CHANGELOG_FILE}.bak"
  else
    # 创建新文件
    cat > "$CHANGELOG_FILE" << EOF
# 变更日志 (CHANGELOG)

本文件记录项目的所有重要变更。

格式遵循 [Keep a Changelog](https://keepachangelog.com/) 规范。

## [Unreleased]

## [$DATE]

$OUTPUT
EOF
    info "✅ CHANGELOG.md 已创建"
  fi
fi
