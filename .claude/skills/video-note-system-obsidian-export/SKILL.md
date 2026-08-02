---
name: video-note-system-obsidian-export
description: 将 video-note-system 输出目录一键导出到 Obsidian Vault 指定目录
category: productivity
tags: [video, notes, obsidian, export]
priority: medium
---

# Video Note System - Obsidian Export

## 概述

本 Skill 负责把 `video-note-system` 生成的输出目录（包含 `notes.md` / `frames/` / json）复制到 Obsidian Vault 的目标文件夹下，形成一个独立的可回看笔记目录。

实现方式是纯文件系统复制，不依赖 Obsidian MCP。

## 使用场景

- 你已经生成了一份视频笔记输出目录
- 你想把它放进 Vault 的某个文件夹（例如 `.../VideoNotes/`）并让图片正常显示

## 使用方法

### 方式 1：生成时直接导出

```bash
python -m video_note_system.cli /path/to/video.mp4 \
  --out /tmp/my_video_notes \
  --obsidian-out "/mnt/c/Users/llwxy/ObsidianVault/LZY_CyberSprout/VideoNotes" \
  --overwrite
```

说明：
- 会在 `--obsidian-out` 下创建一个新子目录：`<out_dir.name>-YYYYmmdd-HHMMSS/`
- `--overwrite` 仅在目标子目录已存在时生效（一般不需要）

### 方式 2：先生成后再手动复制

如果你不想走 CLI 参数，也可以手动把整个输出目录拷贝到 Vault。

## 注意事项

- `--obsidian-out` 必须是一个已存在的目录（建议你先在 Vault 内新建 `VideoNotes/`）。
- 输出目录内图片使用相对路径 `frames/...`，在 Obsidian 内渲染稳定。
