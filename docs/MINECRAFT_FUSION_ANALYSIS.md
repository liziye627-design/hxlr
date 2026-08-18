# Minecraft 数字人融合方案 - 深度分析

## 一、各项目优劣势深度分析

### 1. Mindcraft

| 维度 | 优势 | 劣势 |
|------|------|------|
| **LLM 集成** | ✅ 支持 20+ API 提供商 (OpenAI, Anthropic, Google, Ollama, DeepSeek, Novita 等) | ❌ 需要 API key 配置，有成本 |
| **Profile 系统** | ✅ JSON 配置完整，支持多模型分工 (chat/code/vision/embedding) | ❌ 配置复杂度高 |
| **Agent 架构** | ✅ 多 Agent 分层 (Brain → Task/RP → Code) | ❌ 架构复杂，调试困难 |
| **工具系统** | ✅ 动态 Tools + Skills 扩展机制 | ❌ 需要编码实现自定义工具 |
| **游戏操作** | ✅ Mineflayer 完整 API 覆盖 | ❌ 需要打开 LAN 端口 |
| **记忆系统** | ✅ Embedding + History + Context 管理 | ❌ 上下文过大时性能下降 |
| **语音支持** | ✅ TTS/STT 集成 | ❌ 依赖外部服务 |
| **部署** | ✅ Docker 支持，跨平台 | ❌ 需要单独 Node.js 进程 |

**关键代码结构**:
```
mindcraft/
├── src/
│   ├── agent/           # Agent 核心逻辑
│   ├── models/          # LLM 提供商适配器
│   ├── library/         # 工具和命令库
│   └── utils/           # 辅助函数
├── profiles/            # 角色配置文件
│   └── andy.json        # 默认角色
└── keys.json            # API 密钥配置
```

**Profile 配置示例**:
```json
{
  "name": "Ren",
  "model": {
    "api": "anthropic",
    "model": "claude-sonnet-4-20250514"
  },
  "code_model": { "api": "anthropic", "model": "claude-sonnet-4-20250514" },
  "vision_model": { "api": "anthropic", "model": "claude-sonnet-4-20250514" },
  "embedding": { "api": "openai", "model": "text-embedding-3-small" },
  "speak_model": "openai/tts-1/echo",
  "examples": [...],
  "conversation_examples": [...]
}
```

---

### 2. Figura

| 维度 | 优势 | 劣势 |
|------|------|------|
| **模型系统** | ✅ Blockbench 完美集成，所见即所得 | ❌ 需要学习建模 |
| **脚本能力** | ✅ Lua API 丰富，可控制动画/粒子/声音 | ❌ 沙盒限制，无法调用外部 API |
| **客户端特性** | ✅ 纯客户端 Mod，其他人无需安装即可看到 | ❌ 无法影响游戏逻辑 |
| **动画系统** | ✅ 支持 Blockbench 动画导入和脚本控制 | - |
| **权限系统** | ✅ 细粒度权限控制 (隐形/大小/等) | - |
| **纹理** | ✅ 自发光纹理，着色器兼容 | - |
| **网络同步** | ✅ Ping 系统同步状态 | ❌ 数据大小和频率受限 |
| **文件限制** | - | ❌ 100kb 文件大小限制 |

**关键代码结构**:
```
figura_avatar/
├── avatar.json          # 元数据
├── model.bbmodel        # Blockbench 模型
├── texture.png          # 主纹理
├── texture_e.png        # 自发光纹理
└── script.lua           # Lua 脚本
```

**Lua 脚本示例**:
```lua
-- 隐藏原版模型
vanilla_model.ALL:setVisible(false)

-- 播放动画
function events.tick()
  local pose = player:getPose()
  if pose == "CROUCHING" then
    animations.model.crouch:play()
  else
    animations.model.idle:play()
  end
end

-- 网络同步
function pings.setExpression(expressionType)
  -- 切换表情
  models.model.Face:setUV(...)
end
```

---

### 3. SecondBrain

| 维度 | 优势 | 劣势 |
|------|------|------|
| **集成方式** | ✅ Fabric Mod，直接在游戏中运行 | ❌ 仅支持 1.20.1 |
| **服务端特性** | ✅ 完全服务端运行，客户端只需安装 | - |
| **LLM 支持** | ✅ 支持 Ollama/OpenAI | ❌ 提供商有限 |
| **GUI** | ✅ 游戏内 GUI 管理 NPC | - |
| **实体系统** | ✅ NPC 作为独立实体存在 | ❌ 行为有限 |
| **权限** | - | ❌ 需要操作员权限 |
| **外部依赖** | - | ❌ Player2 App 同步 |

**架构**:
```
SecondBrain Mod
├── NPC Entity (服务端)
│   ├── AI Controller
│   ├── Task Executor
│   └── Chat Handler
├── LLM Bridge
│   ├── Ollama Client
│   └── OpenAI Client
└── GUI System
```

---

### 4. PlayerEngine / Player2NPC

| 维度 | 优势 | 劣势 |
|------|------|------|
| **框架设计** | ✅ 确定性游戏逻辑执行层 | ❌ 早期阶段，不稳定 |
| **行为系统** | ✅ 基于 AltoClef 的任务执行 | ❌ 依赖外部 API |
| **实体管理** | ✅ 完整的实体生命周期 | - |
| **任务执行** | ✅ 资源收集/战斗/跟随 | ❌ 任务类型有限 |
| **API 依赖** | - | ❌ 必须使用 Player2 API |

**核心概念**:
```
PlayerEngine Framework
├── Entity Controller
│   ├── Hunger Manager
│   ├── Inventory Manager
│   └── Movement Controller
├── Task System
│   ├── MineAndCollectTask
│   ├── AttackTask
│   └── FollowTask
└── LLM Interface
    └── Player2 API Client
```

---

## 二、融合方案设计

### 融合架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           融合系统架构                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Layer 1: 外观表现层 (Figura)                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │ Blockbench  │  │ Lua Script  │  │ Emissive    │              │   │
│  │  │ 模型文件    │  │ 动画控制    │  │ 纹理效果    │              │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │   │
│  │  优势: 纯客户端，其他玩家可见，动画丰富                            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│                                   ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                 Layer 2: 智能核心层 (Mindcraft)                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │ Profile     │  │ Multi-Agent │  │ Tools/      │              │   │
│  │  │ 配置系统    │  │ 架构        │  │ Skills      │              │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │ LLM Bridge  │  │ Memory      │  │ TTS/STT     │              │   │
│  │  │ 20+ APIs    │  │ Embedding   │  │ Voice       │              │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │   │
│  │  优势: LLM 集成完善，多角色支持，记忆系统                          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│                                   ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                Layer 3: 游戏交互层 (Mineflayer + PlayerEngine)    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │ Mineflayer  │  │ Task        │  │ World       │              │   │
│  │  │ API 封装    │  │ Executor    │  │ Perception  │              │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │   │
│  │  优势: 完整游戏操作，任务执行可靠                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│                                   ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Layer 4: 前端集成层 (本系统)                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │ 角色选择    │  │ 聊天界面    │  │ 游戏面板    │              │   │
│  │  │ 翻牌卡片    │  │ 实时对话    │  │ MC 控制     │              │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │   │
│  │  优势: 统一 UI，角色管理，状态同步                                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 融合策略

| 来源 | 融合内容 | 融合方式 |
|------|----------|----------|
| **Mindcraft** | LLM 集成、Profile 系统、Agent 架构、记忆系统 | 作为核心服务运行 |
| **Figura** | 角色外观模型、动画系统 | 作为客户端 Mod 安装 |
| **SecondBrain** | 服务端实体概念 | 参考，不直接集成 |
| **PlayerEngine** | 任务执行框架 | 借鉴任务系统设计 |

---

### 依赖关系

```
                    ┌─────────────────┐
                    │   Minecraft     │
                    │   (Java 1.20.4) │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
      ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
      │   Figura      │ │   Fabric API  │ │  PCL 启动器   │
      │   (客户端)    │ │   (Mod 框架)  │ │   (可选)      │
      └───────────────┘ └───────────────┘ └───────────────┘
              │
              │ 外观模型
              ▼
      ┌───────────────────────────────────────────────┐
      │              Mindcraft 服务                   │
      │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
      │  │ Node.js │ │ Mineflayer │ │ LLM APIs │     │
      │  └─────────┘ └─────────┘ └─────────┘        │
      └───────────────────────┬───────────────────────┘
                              │
                              │ WebSocket / HTTP
                              ▼
      ┌───────────────────────────────────────────────┐
      │              本系统后端                       │
      │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
      │  │ Express │ │ Socket.io │ │ Profile Mgr │   │
      │  └─────────┘ └─────────┘ └─────────┘        │
      └───────────────────────┬───────────────────────┘
                              │
                              │ REST API / WebSocket
                              ▼
      ┌───────────────────────────────────────────────┐
      │              前端应用                         │
      │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
      │  │ React   │ │ 角色选择 │ │ 聊天界面 │       │
      │  └─────────┘ └─────────┘ └─────────┘        │
      └───────────────────────────────────────────────┘
```

---

## 三、实现方案

### 1. 统一 Profile 系统

融合 Mindcraft 的 Profile 格式，扩展支持本系统角色：

```typescript
// src/config/UnifiedProfile.ts
export interface UnifiedAgentProfile {
  // 基础信息 (来自本系统)
  id: string;
  name: string;
  title: string;
  tagline: string;
  description: string;
  previewImage: string;

  // 类型分类
  type: 'alpha' | 'aqua' | 'shadow' | 'rookie';
  modes: ('chat' | 'werewolf' | 'script_murder' | 'mc')[];

  // LLM 配置 (来自 Mindcraft)
  model: ModelConfig;
  code_model?: ModelConfig;
  vision_model?: ModelConfig;
  embedding?: ModelConfig;
  speak_model?: string;

  // 角色设定
  personality: string;
  examples: ConversationExample[];
  conversation_examples?: ConversationExample[];

  // 外观配置 (来自 Figura)
  figura?: {
    modelPath: string;
    texturePath: string;
    emissiveTexturePath?: string;
    scriptPath: string;
  };

  // 行为配置 (来自 PlayerEngine)
  behaviors?: {
    canMine: boolean;
    canBuild: boolean;
    canFight: boolean;
    canFollow: boolean;
    preferredTasks: string[];
  };

  // 记忆配置
  memory?: {
    maxHistoryTurns: number;
    embeddingModel: string;
    longTermMemory: boolean;
  };
}

export interface ModelConfig {
  api: string;
  model: string;
  url?: string;
  params?: Record<string, unknown>;
}

export interface ConversationExample {
  role: 'user' | 'assistant';
  content: string;
}
```

### 2. Mindcraft 桥接服务

```typescript
// src/services/MindcraftBridge.ts
import { spawn, ChildProcess } from 'child_process';
import WebSocket from 'ws';
import type { UnifiedAgentProfile } from '@/config/UnifiedProfile';

export class MindcraftBridge {
  private process: ChildProcess | null = null;
  private ws: WebSocket | null = null;
  private port: number;
  private mindcraftRoot: string;

  constructor(port: number = 55916, mindcraftRoot: string = 'third_party/mindcraft') {
    this.port = port;
    this.mindcraftRoot = mindcraftRoot;
  }

  // 启动 Mindcraft 服务
  async start(profiles: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const profileArgs = profiles.map(p => `profiles/${p}.json`).join(' ');

      this.process = spawn('node', [
        'main.js',
        '--profiles', profileArgs,
        '--port', String(this.port)
      ], {
        cwd: this.mindcraftRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.process.stdout?.on('data', (data) => {
        console.log('[Mindcraft]', data.toString());
        if (data.toString().includes('Bot spawned')) {
          resolve();
        }
      });

      this.process.stderr?.on('data', (data) => {
        console.error('[Mindcraft Error]', data.toString());
      });

      this.process.on('error', (error) => {
        reject(error);
      });

      // 超时处理
      setTimeout(() => reject(new Error('Mindcraft startup timeout')), 30000);
    });
  }

  // 生成 Profile 文件
  async generateProfile(agent: UnifiedAgentProfile): Promise<string> {
    const profile = {
      name: agent.name,
      model: agent.model,
      code_model: agent.code_model,
      vision_model: agent.vision_model,
      embedding: agent.embedding,
      speak_model: agent.speak_model,
      personality: agent.personality,
      examples: agent.examples,
      conversation_examples: agent.conversation_examples || []
    };

    const profilePath = `${this.mindcraftRoot}/profiles/${agent.id}.json`;
    await fs.promises.writeFile(profilePath, JSON.stringify(profile, null, 2));
    return profilePath;
  }

  // 发送消息给 Bot
  async sendMessage(botName: string, message: string): Promise<string> {
    // Mindcraft 通过游戏内聊天接收消息
    // 这里需要通过 Mineflayer API 或 WebSocket
    return new Promise((resolve) => {
      // 实现消息发送逻辑
    });
  }

  // 停止服务
  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

### 3. Figura 集成

```typescript
// src/services/FiguraIntegration.ts
import path from 'path';
import fs from 'fs';

export interface FiguraAvatar {
  name: string;
  modelPath: string;
  texturePath: string;
  scriptPath: string;
}

export class FiguraIntegration {
  private figuraRoot: string;

  constructor(minecraftRoot: string) {
    this.figuraRoot = path.join(minecraftRoot, 'config', 'figura');
  }

  // 安装角色外观
  async installAvatar(avatar: FiguraAvatar): Promise<void> {
    const avatarDir = path.join(this.figuraRoot, 'avatars', avatar.name);

    // 创建目录
    await fs.promises.mkdir(avatarDir, { recursive: true });

    // 复制模型文件
    if (fs.existsSync(avatar.modelPath)) {
      await fs.promises.copyFile(
        avatar.modelPath,
        path.join(avatarDir, 'model.bbmodel')
      );
    }

    // 复制纹理
    if (fs.existsSync(avatar.texturePath)) {
      await fs.promises.copyFile(
        avatar.texturePath,
        path.join(avatarDir, 'texture.png')
      );
    }

    // 生成 Lua 脚本
    await this.generateScript(avatar);
  }

  // 生成 Lua 脚本
  private async generateScript(avatar: FiguraAvatar): Promise<void> {
    const scriptContent = `
-- ${avatar.name} Avatar Script
-- 自动生成于 ${new Date().toISOString()}

-- 初始化
function events.entity_init()
  -- 隐藏原版模型
  vanilla_model.PLAYER:setVisible(false)
end

-- 游戏循环
function events.tick()
  -- 检测玩家状态
  local pose = player:getPose()
  local isMoving = player:getVelocity():length() > 0.1

  -- 动画控制
  if pose == "CROUCHING" then
    animations.model.crouch:setPlaying(true)
  elseif isMoving then
    animations.model.walk:setPlaying(true)
  else
    animations.model.idle:setPlaying(true)
  end
end

-- 渲染循环
function events.render(delta, context)
  -- 自定义渲染逻辑
end

-- 网络同步 - 表情切换
function pings.setExpression(type)
  -- 根据类型切换表情
  if type == "happy" then
    models.model.Face.Mouth:setUV(0, 0)
  elseif type == "sad" then
    models.model.Face.Mouth:setUV(8, 0)
  end
end

-- 接收来自 AI 的表情指令
function pings.receiveAIExpression(expression)
  pings.setExpression(expression)
end
`;

    const scriptPath = path.join(this.figuraRoot, 'avatars', avatar.name, 'script.lua');
    await fs.promises.writeFile(scriptPath, scriptContent);
  }
}
```

### 4. 统一任务执行器

```typescript
// src/services/TaskExecutor.ts
export type TaskType = 'mine' | 'build' | 'fight' | 'follow' | 'collect' | 'explore';

export interface Task {
  id: string;
  type: TaskType;
  target?: string;
  quantity?: number;
  position?: { x: number; y: number; z: number };
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export class TaskExecutor {
  private taskQueue: Task[] = [];
  private currentTask: Task | null = null;
  private bot: any; // Mineflayer bot instance

  constructor(bot: any) {
    this.bot = bot;
  }

  // 添加任务
  addTask(task: Omit<Task, 'id' | 'status'>): string {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      status: 'pending'
    };
    this.taskQueue.push(newTask);
    this.sortQueue();
    return newTask.id;
  }

  // 排序队列
  private sortQueue(): void {
    this.taskQueue.sort((a, b) => b.priority - a.priority);
  }

  // 执行下一个任务
  async executeNext(): Promise<void> {
    if (this.currentTask) return;

    const task = this.taskQueue.find(t => t.status === 'pending');
    if (!task) return;

    this.currentTask = task;
    task.status = 'running';

    try {
      switch (task.type) {
        case 'mine':
          await this.executeMine(task);
          break;
        case 'build':
          await this.executeBuild(task);
          break;
        case 'fight':
          await this.executeFight(task);
          break;
        case 'follow':
          await this.executeFollow(task);
          break;
        case 'collect':
          await this.executeCollect(task);
          break;
        case 'explore':
          await this.executeExplore(task);
          break;
      }
      task.status = 'completed';
    } catch (error) {
      task.status = 'failed';
      console.error(`Task ${task.id} failed:`, error);
    } finally {
      this.currentTask = null;
    }
  }

  private async executeMine(task: Task): Promise<void> {
    // 实现 mining 逻辑
  }

  private async executeBuild(task: Task): Promise<void> {
    // 实现 building 逻辑
  }

  private async executeFight(task: Task): Promise<void> {
    // 实现 fighting 逻辑
  }

  private async executeFollow(task: Task): Promise<void> {
    // 实现 following 逻辑
  }

  private async executeCollect(task: Task): Promise<void> {
    // 实现 collecting 逻辑
  }

  private async executeExplore(task: Task): Promise<void> {
    // 实现 exploring 逻辑
  }
}
```

---

## 四、完整集成服务

```typescript
// src/services/MinecraftDigitalHumanService.ts
import { MindcraftBridge } from './MindcraftBridge';
import { FiguraIntegration } from './FiguraIntegration';
import { TaskExecutor } from './TaskExecutor';
import type { UnifiedAgentProfile } from '@/config/UnifiedProfile';

export class MinecraftDigitalHumanService {
  private mindcraft: MindcraftBridge;
  private figura: FiguraIntegration;
  private profiles: Map<string, UnifiedAgentProfile> = new Map();
  private activeAgents: Set<string> = new Set();

  constructor(config: {
    mindcraftRoot: string;
    minecraftRoot: string;
    port: number;
  }) {
    this.mindcraft = new MindcraftBridge(config.port, config.mindcraftRoot);
    this.figura = new FiguraIntegration(config.minecraftRoot);
  }

  // 注册角色
  async registerAgent(profile: UnifiedAgentProfile): Promise<void> {
    // 生成 Mindcraft profile
    await this.mindcraft.generateProfile(profile);

    // 安装 Figura 外观
    if (profile.figura) {
      await this.figura.installAvatar({
        name: profile.id,
        modelPath: profile.figura.modelPath,
        texturePath: profile.figura.texturePath,
        scriptPath: profile.figura.scriptPath
      });
    }

    this.profiles.set(profile.id, profile);
  }

  // 启动角色
  async startAgent(agentId: string): Promise<void> {
    const profile = this.profiles.get(agentId);
    if (!profile) throw new Error(`Agent ${agentId} not registered`);

    if (this.activeAgents.size === 0) {
      // 首次启动 Mindcraft
      await this.mindcraft.start([agentId]);
    }

    this.activeAgents.add(agentId);
  }

  // 停止角色
  async stopAgent(agentId: string): Promise<void> {
    this.activeAgents.delete(agentId);
    if (this.activeAgents.size === 0) {
      await this.mindcraft.stop();
    }
  }

  // 发送消息
  async sendMessage(agentId: string, message: string): Promise<string> {
    const profile = this.profiles.get(agentId);
    if (!profile) throw new Error(`Agent ${agentId} not registered`);

    return this.mindcraft.sendMessage(profile.name, message);
  }

  // 获取角色状态
  getAgentStatus(agentId: string): {
    registered: boolean;
    active: boolean;
    profile?: UnifiedAgentProfile;
  } {
    return {
      registered: this.profiles.has(agentId),
      active: this.activeAgents.has(agentId),
      profile: this.profiles.get(agentId)
    };
  }
}
```

---

## 五、配置文件示例

### 角色配置: Ren

```json
{
  "id": "ren",
  "name": "Ren",
  "title": "Main Companion",
  "tagline": "Balanced all-rounder for everyday co-play",
  "description": "The default party partner when you want one agent that can chat, guide, and queue with you.",
  "previewImage": "/agent-portraits/ren.png",
  "type": "aqua",
  "modes": ["chat", "werewolf", "script_murder", "mc"],

  "model": {
    "api": "anthropic",
    "model": "claude-sonnet-4-20250514"
  },
  "code_model": {
    "api": "anthropic",
    "model": "claude-sonnet-4-20250514"
  },
  "vision_model": {
    "api": "anthropic",
    "model": "claude-sonnet-4-20250514"
  },
  "embedding": {
    "api": "openai",
    "model": "text-embedding-3-small"
  },
  "speak_model": "openai/tts-1/echo",

  "personality": "你是 Ren，一个可靠的全能型陪玩伙伴。你擅长聊天、推理游戏和冒险模式。你的性格温和、可靠，总是能在关键时刻给出有用的建议。你喜欢用轻松但专业的语气与玩家交流。在 Minecraft 中，你是一个经验丰富的玩家，熟悉各种游戏机制，能够帮助玩家收集资源、建造建筑、探索世界。",

  "examples": [
    {
      "role": "user",
      "content": "我们去挖矿吧"
    },
    {
      "role": "assistant",
      "content": "好主意！我建议先准备好足够的火把和食物。你知道洞穴在哪里吗？还是需要我帮你找一个？"
    },
    {
      "role": "user",
      "content": "帮我收集一些木头"
    },
    {
      "role": "assistant",
      "content": "没问题，我来帮你砍树。你需要多少木头？橡木还是桦木？"
    }
  ],

  "figura": {
    "modelPath": "assets/avatars/ren/model.bbmodel",
    "texturePath": "assets/avatars/ren/texture.png",
    "emissiveTexturePath": "assets/avatars/ren/texture_e.png",
    "scriptPath": "assets/avatars/ren/script.lua"
  },

  "behaviors": {
    "canMine": true,
    "canBuild": true,
    "canFight": true,
    "canFollow": true,
    "preferredTasks": ["collect", "explore", "build"]
  },

  "memory": {
    "maxHistoryTurns": 50,
    "embeddingModel": "text-embedding-3-small",
    "longTermMemory": true
  }
}
```

---

## 六、部署清单

### 必需组件

| 组件 | 版本 | 用途 |
|------|------|------|
| Minecraft Java | 1.20.4 | 游戏本体 |
| Fabric Loader | 0.15.x | Mod 框架 |
| Fabric API | 最新 | Fabric 核心 API |
| Figura | 0.1.5+ | 角色外观 |
| Node.js | 18+ | Mindcraft 运行时 |
| Mindcraft | 最新 | AI Bot 框架 |

### 可选组件

| 组件 | 用途 |
|------|------|
| PCL 启动器 | 简化 Minecraft 管理 |
| Sodium | 性能优化 |
| Iris | 光影支持 |

### API 密钥

| API | 用途 | 必需 |
|-----|------|------|
| Anthropic | Claude 模型 | 推荐主用 |
| OpenAI | Embedding/TTS | 推荐 |
| DeepSeek | 备选模型 | 可选 |
| Ollama | 本地模型 | 可选 |

---

## 七、总结

通过融合四个项目的优势：

1. **Mindcraft** 提供核心 AI 能力 - LLM 集成、记忆系统、多 Agent 架构
2. **Figura** 提供视觉表现 - 角色模型、动画、视觉效果
3. **SecondBrain** 提供服务端概念 - NPC 实体管理
4. **PlayerEngine** 提供行为框架 - 任务执行系统

实现了：
- ✅ 统一的 Profile 配置系统
- ✅ 多 LLM 提供商支持
- ✅ 角色外观自定义
- ✅ 游戏内任务执行
- ✅ 与本系统无缝集成