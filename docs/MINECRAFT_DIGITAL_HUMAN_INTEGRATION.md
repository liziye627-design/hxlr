# Minecraft 数字人集成方案

## 概述

本文档整理了在 Minecraft 中接入 AI 数字人/虚拟角色的主流方案和模组，适用于将本项目的 AI 陪玩角色接入 Minecraft 世界。

---

## 推荐方案

### 1. Mindcraft (当前项目已集成)

**仓库**: https://github.com/karpathy/mindcraft (社区维护)

**特点**:
- 基于 Node.js 的 Minecraft 机器人框架
- 支持多种 LLM 提供商 (OpenAI, Anthropic, DeepSeek 等)
- 可自定义 bot profile，实现角色个性化
- 支持多 bot 同时运行

**集成方式**:
```json
// profiles/companion-ren.json
{
  "name": "Ren",
  "model": {
    "api": "anthropic",
    "model": "claude-sonnet-4-20250514"
  },
  "embedding": {
    "api": "openai",
    "model": "text-embedding-3-small"
  },
  "personality": "你是一个可靠的陪玩伙伴..."
}
```

**启动命令**:
```bash
node main.js --profiles profiles/companion-ren.json
```

---

### 2. SecondBrain - AI NPC Mod

**仓库**: https://github.com/sailex428/SecondBrain

**特点**:
- Fabric 模组，支持 Minecraft 1.21.x
- 内置 LLM 集成，NPC 可响应聊天消息
- 支持基本玩家行为 (移动、攻击等)
- 45+ 版本发布，活跃维护

**适用场景**: 创建智能 NPC 村民、任务发布者

**安装**:
1. 安装 Fabric Loader
2. 将 mod jar 放入 mods 文件夹
3. 配置 API key

---

### 3. Figura - 角色自定义模组

**仓库**: https://github.com/FiguraMC/Figura

**特点**:
- 客户端模组，深度自定义玩家模型
- 支持 Blockbench 模型导入
- 自定义动画和脚本
- 其他玩家无需安装模组即可看到你的角色

**适用场景**: 为 AI bot 创建独特的外观模型

**星标**: 462+ ⭐

---

### 4. CraftGPT - ChatGPT in Minecraft

**仓库**: https://github.com/zizmax/CraftGPT

**特点**:
- 将任何生物变成 AI 驱动的 NPC
- 支持多 API 提供商 (OpenAI, Anthropic, Google, Ollama)
- 自动生成角色名称和个性
- AI 生物会响应周围发生的事件

**适用场景**: 让游戏中的生物变成可交互的 AI 角色

---

### 5. FancyNpcs - NPC 插件

**仓库**: https://github.com/FancyMcPlugins/FancyNpcs

**特点**:
- Paper 服务器插件
- 轻量级，高性能
- 支持皮肤自定义
- 支持对话和命令

**适用场景**: 服务器端 NPC 管理

**星标**: 148+ ⭐

---

### 6. Speaking Villagers - ChatGPT + TTS

**来源**: https://www.curseforge.com/minecraft/mc-mods/speaking-villagers

**特点**:
- Fabric 模组
- 村民可通过 ChatGPT 对话
- 内置语音合成 (TTS)
- 下载量 25,000+

**适用场景**: 创建会说话的智能村民

---

### 7. Taterzens - 服务端 NPC

**仓库**: https://github.com/samolego/Taterzens

**特点**:
- Fabric/Forge 服务端模组
- Citizens 风格的 NPC 系统
- 支持皮肤、动作、对话
- 可与脚本系统集成

**适用场景**: 服务端 AI NPC 托管

**星标**: 69+ ⭐

---

### 8. Player2NPC - PlayerEngine 框架

**仓库**: https://github.com/Goodbird-git/Player2NPC

**特点**:
- 展示 PlayerEngine 框架能力
- 创建玩家般的 AI NPC
- 支持 AI 游戏玩法

**适用场景**: 创建行为接近真实玩家的 AI

---

## 技术对比

| 方案 | 类型 | LLM 集成 | 多人支持 | 自定义程度 | 推荐指数 |
|------|------|----------|----------|------------|----------|
| Mindcraft | 框架 | ✅ 内置 | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| SecondBrain | 模组 | ✅ 内置 | ✅ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Figura | 模组 | ❌ | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| CraftGPT | 模组 | ✅ 内置 | ✅ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| FancyNpcs | 插件 | ❌ | ✅ | ⭐⭐⭐ | ⭐⭐⭐ |
| Speaking Villagers | 模组 | ✅ 内置 | ✅ | ⭐⭐⭐ | ⭐⭐⭐ |
| Taterzens | 模组 | ❌ | ✅ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Player2NPC | 框架 | ❌ | ✅ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 推荐集成架构

```
┌─────────────────────────────────────────────────────────────┐
│                     前端应用 (本系统)                         │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │  角色选择   │  │  聊天界面   │  │  游戏面板   │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    后端服务 (Node.js)                        │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │ Agent API   │  │ Session Mgr │  │ Memory DB   │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Mindcraft 层                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  Bot Profiles (Ren, Haru, Hiyori, Mao, etc.)        │  │
│   │  - personality: 角色个性设定                          │  │
│   │  - model: LLM 配置                                    │  │
│   │  - embedding: 向量嵌入                                │  │
│   └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Minecraft 世界                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │  PCL 启动器  │  │  游戏实例   │  │  LAN 端口   │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 配置示例

### 1. Mindcraft Bot Profile (角色: Ren)

```json
{
  "name": "Ren",
  "model": {
    "api": "anthropic",
    "model": "claude-sonnet-4-20250514"
  },
  "embedding": {
    "api": "openai",
    "model": "text-embedding-3-small"
  },
  "code_model": {
    "api": "anthropic",
    "model": "claude-sonnet-4-20250514"
  },
  "vision_model": {
    "api": "anthropic",
    "model": "claude-sonnet-4-20250514"
  },
  "personality": "你是 Ren，一个可靠的全能型陪玩伙伴。你擅长聊天、推理游戏和冒险模式。你的性格温和、可靠，总是能在关键时刻给出有用的建议。你喜欢用轻松但专业的语气与玩家交流。",
  "examples": [
    {
      "role": "user",
      "content": "我们去挖矿吧"
    },
    {
      "role": "assistant",
      "content": "好主意！我建议先准备好足够的火把和食物。你知道洞穴在哪里吗？还是需要我帮你找一个？"
    }
  ]
}
```

### 2. Mindcraft Bot Profile (角色: Haru)

```json
{
  "name": "Haru",
  "model": {
    "api": "anthropic",
    "model": "claude-sonnet-4-20250514"
  },
  "personality": "你是 Haru，一个冷静果断的开局指挥官。你擅长把控游戏节奏，言辞犀利不拖泥带水。你总能在关键时刻做出决策，带领团队走向胜利。",
  "examples": [
    {
      "role": "user",
      "content": "我不知道该怎么开始"
    },
    {
      "role": "assistant",
      "content": "先收集木头，然后做工具，接下来找食物和 shelter。别浪费时间，我带你走最优路线。"
    }
  ]
}
```

---

## 快速开始

### 1. 环境准备

```bash
# 安装 Mindcraft
cd third_party
git clone https://github.com/karpathy/mindcraft.git
cd mindcraft
npm install

# 配置 API keys
echo '{
  "ANTHROPIC_API_KEY": "your-key-here",
  "OPENAI_API_KEY": "your-key-here"
}' > keys.json
```

### 2. 创建角色 Profile

```bash
cd profiles
# 复制并编辑角色配置
cp default.json companion-ren.json
# 编辑 companion-ren.json
```

### 3. 启动 Minecraft 并连接

```bash
# 先启动 Minecraft，打开 LAN 端口 55916
# 然后启动 bot
node main.js --profiles profiles/companion-ren.json --host 127.0.0.1 --port 55916
```

---

## 进阶配置

### 多角色同时运行

```bash
# 同时启动多个 bot
node main.js --profiles profiles/ren.json profiles/haru.json --host 127.0.0.1 --port 55916
```

### 与本系统集成

本系统已内置 Minecraft 集成：

1. 前端: `/adventure` 页面提供 MC 启动控制台
2. 后端: `MinecraftCompanionService` 处理 bot 生命周期
3. API: `/api/minecraft/*` 提供 bootstrap 和状态查询

---

## 参考资料

- [Mindcraft Wiki](https://github.com/karpathy/mindcraft/wiki)
- [Figura Documentation](https://figuramc.org/)
- [Fabric Mod Development](https://fabricmc.net/wiki/start:introduction)
- [Minecraft Protocol](https://wiki.vg/Protocol)

---

## 更新日志

- 2026-03-16: 初始版本，整理主流 MC 数字人方案