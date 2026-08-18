# Minecraft 数字人融合服务

## 快速开始

### 1. 安装依赖

```bash
# 安装 Mindcraft
cd third_party
git clone https://github.com/kolbytn/mindcraft.git
cd mindcraft
npm install

# 配置 API Keys
cp keys.example.json keys.json
# 编辑 keys.json，填入你的 API Key
```

### 2. 安装 Figura Mod

1. 安装 Fabric Loader
2. 下载 Figura Mod: https://modrinth.com/mod/figura
3. 将 mod 文件放入 `mods` 文件夹

### 3. 使用服务

```typescript
import {
  initializeDigitalHumanService,
  convertAllProfiles,
} from '@/services/minecraft';

// 初始化服务
const service = await initializeDigitalHumanService({
  mindcraftRoot: 'third_party/mindcraft',
  minecraftRoot: path.join(os.homedir(), 'AppData', 'Roaming', '.minecraft'),
  serverHost: '127.0.0.1',
  serverPort: 55916,
  minecraftVersion: '1.20.4',
});

// 注册所有角色
const profiles = convertAllProfiles();
await service.registerAgents(profiles);

// 启动角色
await service.startAgent('ren');

// 发送消息
const response = await service.sendMessage('ren', '我们去挖矿吧');

// 执行任务
const task = await service.executeTask('ren', {
  type: 'mine',
  target: 'diamond_ore',
  quantity: 10,
  priority: 1,
});

// 停止服务
await service.shutdown();
```

## API 参考

### MinecraftDigitalHumanService

| 方法 | 说明 |
|------|------|
| `initialize()` | 初始化服务，检查依赖 |
| `registerAgent(profile)` | 注册单个角色 |
| `registerAgents(profiles)` | 批量注册角色 |
| `startAgent(agentId)` | 启动角色 |
| `stopAgent(agentId)` | 停止角色 |
| `sendMessage(agentId, message)` | 发送消息 |
| `executeTask(agentId, task)` | 执行任务 |
| `getAgentStatus(agentId)` | 获取角色状态 |
| `shutdown()` | 关闭服务 |

### 支持的任务类型

| 类型 | 说明 |
|------|------|
| `mine` | 挖掘指定方块 |
| `build` | 建造结构 |
| `fight` | 战斗 |
| `follow` | 跟随玩家 |
| `collect` | 收集物品 |
| `explore` | 探索世界 |

## 配置文件

### 角色配置示例 (Ren)

```json
{
  "id": "ren",
  "name": "Ren",
  "title": "Main Companion",
  "model": {
    "api": "anthropic",
    "model": "claude-sonnet-4-20250514"
  },
  "personality": "你是 Ren，一个可靠的全能型陪玩伙伴...",
  "behaviors": {
    "canMine": true,
    "canBuild": true,
    "canFight": true,
    "canFollow": true,
    "canExplore": true
  }
}
```

## 架构

```
┌─────────────────────────────────────────┐
│           MinecraftDigitalHumanService   │
├─────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐       │
│  │ Mindcraft   │  │ Figura      │       │
│  │ Bridge      │  │ Integration │       │
│  │ (AI 核心)   │  │ (外观模型)  │       │
│  └─────────────┘  └─────────────┘       │
│  ┌─────────────────────────────────┐    │
│  │ Profile Converter               │    │
│  │ (角色配置转换)                  │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## 依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| Minecraft Java | 1.20.4 | 游戏本体 |
| Fabric Loader | 0.15+ | Mod 框架 |
| Figura | 0.1.5+ | 角色外观 |
| Node.js | 18+ | Mindcraft 运行时 |
| Mindcraft | latest | AI Bot 框架 |