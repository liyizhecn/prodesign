#!/usr/bin/env bash
# prodesign skill 套件安装器
# 用法：bash install.sh /path/to/project   # 安装为项目级 skill（<project>/.claude/skills/）
#       bash install.sh --global           # 安装为全局 skill（~/.claude/skills/）
set -euo pipefail

SRC="$(cd "$(dirname "$0")/skills" && pwd)"

if [ "${1:-}" = "--global" ]; then
  DEST="$HOME/.claude/skills"
else
  TARGET="${1:-.}"
  [ -d "$TARGET" ] || { echo "✖ 目标项目目录不存在：$TARGET" >&2; exit 1; }
  DEST="$(cd "$TARGET" && pwd)/.claude/skills"
fi

mkdir -p "$DEST"
for d in "$SRC"/prodesign*; do
  name="$(basename "$d")"
  rm -rf "$DEST/$name"
  cp -R "$d" "$DEST/$name"
  echo "  + $DEST/$name"
done

echo "✔ prodesign 套件已安装（$(ls -d "$SRC"/prodesign* | wc -l | tr -d ' ') 个 skill）"
echo "  重启 Claude Code 会话后即可使用 /prodesign-* 命令"
