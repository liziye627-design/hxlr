---
name: video-note-system
description: 本地视频转 Obsidian 友好的 Markdown 笔记（ffmpeg + faster-whisper）
category: productivity
tags: [video, notes, ffmpeg, whisper, obsidian]
priority: high
---

# Video Note System

## 概述

将本地视频文件（如课程录屏）自动转换为：
- 带时间戳的转写文本（`segments.json`）
- 关键节点（`keyframes.json`）
- 可选截图（`frames/`）
- 结构化 Markdown 笔记（`notes.md`，图片使用相对路径，适配 Obsidian）

实现位于：`/mnt/c/Users/llwxy/opencode/tools/video-note-system`

## 使用场景

- 你有一段本地视频（录屏/课程），想快速得到“可回看”的结构化笔记
- 你希望笔记可直接拷贝进 Obsidian Vault 并正常显示图片

## 前置条件

- 系统已安装 `ffmpeg`（建议同时有 `ffprobe`）
- Python >= 3.9

## 操作方式（CLI）

### 模式 A：结构化笔记（推荐）

该模式会：
1) 先转写得到 `segments.json`
2) 调用 OpenCode 模型把转写整理成“章节化要点笔记”（生成 `final_notes.md`）
3) 按每个章节的时间戳自动截图并嵌入对应章节

```bash
python -m video_note_system.cli /path/to/video.mp4 \
  --out /path/to/output_dir \
  --structured-notes \
  --llm-model opencode/minimax-m2.1-free \
  --screenshots-per-section 2 \
  --candidates-per-section 6 \
  --dedup-threshold 6 \
  --ocr-lang chi_sim+eng
```

你也可以切换模型：
- `opencode/minimax-m2.1-free`
- `opencode/glm-4.7-free`

### OCR 依赖（可选但推荐）

结构化笔记模式的“智能截图选择”会调用 `tesseract` 做 OCR 评分，帮助挑出信息量更高的帧，并配合 dHash 去重避免重复卡片。

Ubuntu/Debian:
```bash
sudo apt-get install tesseract-ocr tesseract-ocr-eng tesseract-ocr-chi-sim
```

### 模式 B：原始时间线稿件（基础）

### 1) 安装

```bash
cd /mnt/c/Users/llwxy/opencode/tools/video-note-system
python3 -m venv .venv
# Debian/Ubuntu: if you see "ensurepip is not available", run:
#   sudo apt install python3-venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2) 生成笔记

```bash
python -m video_note_system.cli /path/to/video.mp4 --out /path/to/output_dir
```

常用参数：
- `--model base`：模型大小（tiny/base/small/medium/large-v3）
- `--device auto|cpu|cuda`：转写设备
- `--no-screenshots`：关闭截图
- `--min-interval 5`：关键节点最小间隔（秒）
- `--min-text-length 50`：文本阈值
- `--max-keyframes 20`：关键节点数量上限

## 输出结构

输出目录包含：
- `audio.wav`：16kHz 单声道音频（中间产物）
- `segments.json`：转写段落（start/end/text）
- `keyframes.json`：关键节点列表（timestamp/text/screenshot_relpath）
- `frames/`：截图目录（可选）
- `notes.md`：最终笔记

## Obsidian 导入建议

- 推荐：直接在生成时使用 `--obsidian-out` 参数自动导出（见 Skill：`video-note-system-obsidian-export`）
- 或者把整个输出目录手动拷贝到你的 Vault 某个文件夹（例如 `VideoNotes/<video_name>/`）
- 用 Obsidian 打开 `notes.md`，图片路径是 `frames/...`，应能正常渲染

## 排障

### 1) ffmpeg 缺失
现象：报错 "Missing dependency: 'ffmpeg'"
- 解决：安装 ffmpeg 并加入 PATH

### 2) 转写很慢 / OOM
- 解决：先用更小模型（`--model tiny` 或 `base`）
- 没有 GPU：建议 `--device cpu`，并保持模型较小

### 3) 截图失败
- 解决：先用 `--no-screenshots` 跑通文本流程，确认视频格式可被 ffmpeg 正常解码
