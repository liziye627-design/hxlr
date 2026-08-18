# Minecraft 数字人融合系统 - 部署指南

## 完整架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              完整系统架构                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          前端层 (React)                              │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │   │
│  │  │ MinecraftAdventure │  MinecraftAgentCard │  TaskPanel    │        │   │
│  │  │ (页面)              │  (角色卡片)          │  (任务面板)  │        │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘        │   │
│  │  ┌────────────────┐  ┌────────────────┐                            │   │
│  │  │ minecraftApi.ts │  │ ChatInterface │                            │   │
│  │  │ (API 客户端)    │  │ (聊天界面)     │                            │   │
│  │  └────────────────┘  └────────────────┘                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    │ REST API                              │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          后端层 (Node.js/Express)                   │   │
│  │  ┌────────────────────────────────────────────────────────────┐    │   │
│  │  │          minecraftDigitalHuman.ts (API 路由)               │    │   │
│  │  │  /api/minecraft/* → 初始化/启动/消息/任务/状态             │    │   │
│  │  └────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       服务层 (TypeScript)                           │   │
│  │  ┌────────────────────────────────────────────────────────────┐    │   │
│  │  │              DigitalHumanService (统一服务)                 │    │   │
│  │  │  - 角色注册/启动/停止                                       │    │   │
│  │  │  - 消息发送/任务执行                                        │    │   │
│  │  │  - 状态管理                                                 │    │   │
│  │  └────────────────────────────────────────────────────────────┘    │   │
│  │  ┌──────────────────┐  ┌──────────────────┐                       │   │
│  │  │ MindcraftBridge  │  │ FiguraIntegration │                       │   │
│  │  │ (AI 核心桥接)    │  │ (外观管理)        │                       │   │
│  │  └──────────────────┘  └──────────────────┘                       │   │
│  │  ┌──────────────────┐                                              │   │
│  │  │ profileConverter │                                              │   │
│  │  │ (配置转换)       │                                              │   │
│  │  └──────────────────┘                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          外部依赖层                                  │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │   │
│  │  │ Mindcraft        │  │ Minecraft        │  │ Figura Mod       │  │   │
│  │  │ (Node.js Bot)    │  │ (Java 1.20.4)    │  │ (Fabric Client)  │  │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 文件结构

```
app-7gn2vl8qe60x/
├── config/
│   └── minecraft/
│       ├── minecraft.config.json    # 主配置
│       └── profiles/
│           ├── ren.json             # Ren 角色配置
│           └── haru.json            # Haru 角色配置
│
├── src/
│   ├── components/
│   │   └── minecraft/
│   │       ├── index.ts             # 组件导出
│   │       ├── MinecraftAgentCard.tsx  # 角色选择卡片
│   │       └── TaskPanel.tsx        # 任务执行面板
│   │
│   ├── pages/
│   │   └── MinecraftAdventure.tsx   # 冒险页面
│   │
│   ├── services/
│   │   └── minecraft/
│   │       ├── index.ts             # 服务导出
│   │       ├── types.ts             # 类型定义
│   │       ├── MindcraftBridge.ts   # Mindcraft 桥接
│   │       ├── FiguraIntegration.ts # Figura 集成
│   │       ├── DigitalHumanService.ts # 统一服务
│   │       ├── profileConverter.ts  # 配置转换
│   │       └── README.md            # 服务文档
│   │
│   ├── services/
│   │   └── minecraftApi.ts          # 前端 API 客户端
│   │
│   └── server/
│       └── routes/
│           └── minecraftDigitalHuman.ts # API 路由
│
└── docs/
    ├── MINECRAFT_DIGITAL_HUMAN_INTEGRATION.md  # 集成方案
    └── MINECRAFT_FUSION_ANALYSIS.md            # 融合分析
```

---

## 快速部署

### 1. 安装 Minecraft

```bash
# 下载 Minecraft Java Edition 1.20.4
# 推荐使用 PCL 启动器 (Windows) 或官方启动器
```

### 2. 安装 Fabric + Figura

```bash
# 1. 安装 Fabric Loader
# 下载: https://fabricmc.net/use/installer/

# 2. 下载 Figura Mod
# 下载: https://modrinth.com/mod/figura

# 3. 将 Figura 放入 mods 文件夹
# Windows: %APPDATA%\.minecraft\mods\
# macOS: ~/Library/Application Support/minecraft/mods/
# Linux: ~/.minecraft/mods/
```

### 3. 安装 Mindcraft

```bash
# 克隆 Mindcraft
cd third_party
git clone https://github.com/kolbytn/mindcraft.git
cd mindcraft

# 安装依赖
npm install

# 配置 API Keys
cp keys.example.json keys.json
# 编辑 keys.json，填入你的 API Key
```

### 4. 配置环境变量

```bash
# .env 文件
MINECRAFT_ROOT=/path/to/.minecraft
MINECRAFT_LOCAL_CONFIG=config/minecraft.config.json
```

### 5. 启动服务

```bash
# 启动后端
npm run server

# 启动前端
npm run dev
```

---

## API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/minecraft/status` | GET | 获取服务状态 |
| `/api/minecraft/agents` | GET | 获取所有角色 |
| `/api/minecraft/agents/:id` | GET | 获取单个角色详情 |
| `/api/minecraft/agents/register` | POST | 注册所有角色 |
| `/api/minecraft/agents/:id/start` | POST | 启动角色 |
| `/api/minecraft/agents/:id/stop` | POST | 停止角色 |
| `/api/minecraft/agents/:id/message` | POST | 发送消息 |
| `/api/minecraft/agents/:id/task` | POST | 执行任务 |
| `/api/minecraft/agents/:id/world` | GET | 获取世界状态 |
| `/api/minecraft/initialize` | POST | 初始化服务 |
| `/api/minecraft/shutdown` | POST | 关闭服务 |

---

## 使用流程

### 1. 初始化服务

```typescript
import { initializeDigitalHumanService, convertAllProfiles } from '@/services/minecraft';

// 初始化
const service = await initializeDigitalHumanService({
  mindcraftRoot: 'third_party/mindcraft',
  minecraftRoot: '/path/to/.minecraft',
  serverHost: '127.0.0.1',
  serverPort: 55916,
  minecraftVersion: '1.20.4',
});

// 注册角色
await service.registerAgents(convertAllProfiles());
```

### 2. 启动 Minecraft 并开放 LAN

1. 启动 Minecraft Java 1.20.4
2. 进入单人世界
3. 按 ESC → 对局域网开放
4. 设置端口为 55916

### 3. 启动角色

```typescript
// 启动 Ren
await service.startAgent('ren');

// 发送消息
await service.sendMessage('ren', '我们去挖矿吧');

// 执行任务
await service.executeTask('ren', {
  type: 'mine',
  target: 'diamond_ore',
  quantity: 10,
  priority: 1,
});
```

---

## 角色能力

| 角色 | 挖掘 | 建造 | 战斗 | 探索 | 擅长任务 |
|------|------|------|------|------|----------|
| Haru | ✅ | ✅ | ✅ | ✅ | 挖掘, 战斗, 探索 |
| Hiyori | ✅ | ✅ | ❌ | ✅ | 探索, 收集 |
| Mao Pro | ✅ | ❌ | ✅ | ❌ | 战斗, 挖掘 |
| Mark | ✅ | ✅ | ❌ | ✅ | 收集, 探索 |
| Natori | ✅ | ✅ | ❌ | ✅ | 探索, 收集 |
| Ren | ✅ | ✅ | ✅ | ✅ | 全部 |
| Rice | ✅ | ✅ | ❌ | ✅ | 收集, 挖掘 |
| Shizuku | ✅ | ✅ | ❌ | ✅ | 探索, 建造 |
| Wanko | ✅ | ❌ | ✅ | ✅ | 战斗, 探索 |

---

## 常见问题

### Q: Mindcraft 无法连接 Minecraft?

A: 确保:
1. Minecraft 已启动并进入世界
2. 已开放局域网 (端口 55916)
3. 防火墙允许本地连接

### Q: Figura 外观不显示?

A: 确保:
1. Fabric Loader 正确安装
2. Figura Mod 版本匹配 Minecraft 版本
3. 外观文件放在正确目录

### Q: API Key 无效?

A: 检查 `keys.json`:
1. 确保格式正确
2. 确保没有多余空格
3. 确保使用正确的 API Key

---

## 下一步

1. **添加更多角色**: 编辑 `config/minecraft/profiles/` 添加新角色配置
2. **自定义外观**: 使用 Blockbench 创建自定义模型
3. **扩展任务**: 在 `TaskPanel` 中添加更多任务类型
4. **集成语音**: 启用 TTS/STT 功能

---

## 相关链接

- [Mindcraft GitHub](https://github.com/kolbytn/mindcraft)
- [Figura Mod](https://modrinth.com/mod/figura)
- [Fabric Loader](https://fabricmc.net/)
- [Blockbench](https://www.blockbench.net/)