# 次元阅关 (HXLR) — AI 游戏平台

## 项目概览

次元阅关是一个基于 AI 的多人在线游戏平台，集成了**狼人杀**、**剧本杀**、**数字冒险**等玩法。
玩家可以与 AI 进行对战，AI 具备不同的人设特征，能够按照游戏规则进行发言和角色技能使用。

- **前端**：Vite + React 18 + TypeScript 5 + TailwindCSS + Radix UI，端口 `5200`
- **后端**：Node.js + Express + Socket.IO + WS，端口 `3001`
- **数据库/鉴权**：Supabase
- **AI**：LangChain/LangGraph + DeepSeek API
- **部署**：Vercel（前端）+ Docker（后端）

---

## 快速开始

### 环境要求

- Node.js >= 20
- npm >= 10

### 安装与启动

```bash
# 安装依赖
npm install

# 配置环境变量（复制模板并填入实际值）
cp .env.production.example .env

# 同时启动前端 + 后端
npm run dev:full

# 仅前端
npm run dev

# 仅后端
npm run server:dev

# 构建
npm run build
```

### 环境变量

| 变量 | 说明 |
|------|------|
| `VITE_APP_ID` | 应用标识 |
| `VITE_SUPABASE_URL` | Supabase 服务地址 |
| `VITE_SUPABASE_ANON_KEY` | Supabase 公钥 |
| `VITE_DEEPSEEK_API_KEY` | DeepSeek API 密钥 |
| `VITE_DEEPSEEK_API_URL` | DeepSeek API 地址 |
| `VITE_DEEPSEEK_MODEL` | DeepSeek 模型名称 |
| `PORT` | 后端端口（默认 3001） |
| `FRONTEND_ORIGIN` | 允许的前端来源（CORS） |

---

## 目录结构

```
hxlr-main/
├── index.html                     # Vite 入口
├── package.json                   # 依赖与脚本
├── vite.config.ts                 # Vite 配置（端口 5200，路径别名 @/）
├── tsconfig.json                  # TypeScript 配置
├── biome.json                     # Biome lint/format 配置
├── .env.production.example        # 环境变量模板
├── deploy/                        # Docker 部署文件
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── nginx.socket.conf
│   └── server.env.example
├── docs/                          # 项目文档
│   ├── prd.md                     # 产品需求文档
│   ├── deployment-guide.md        # 部署指南
│   └── jubensha-llm-config.md     # 剧本杀 LLM 配置
├── public/                        # 静态资源
│   ├── images/                    # 公共图片（logo、错误页等）
│   ├── scripts/                   # 剧本素材（PDF/音频）
│   └── sounds/                    # 音效资源
├── src/
│   ├── main.tsx                   # React 入口
│   ├── App.tsx                    # 根组件
│   ├── routes.tsx                 # 路由配置
│   ├── components/                # UI 组件库（shadcn/ui）
│   ├── pages/                     # 页面模块
│   │   ├── Home.tsx               # 首页
│   │   ├── Companions.tsx         # AI 伴侣中心
│   │   ├── Adventure.tsx          # 数字冒险
│   │   ├── Rankings.tsx           # 排行榜
│   │   ├── werewolf/              # 狼人杀模块
│   │   └── jubensha/              # 剧本杀模块
│   ├── server/                    # Node.js 游戏服务
│   │   ├── index.ts               # 服务入口
│   │   ├── RoomManager.ts         # 房间管理
│   │   ├── SocketHandlersEnhanced.ts  # Socket.IO 事件处理
│   │   ├── jubensha/              # 剧本杀后端
│   │   ├── scriptmurder/          # 剧本杀（旧版）
│   │   ├── services/              # 解析/AI/分析服务
│   │   ├── repositories/          # 数据仓库
│   │   ├── ai/                    # AI 角色提示
│   │   ├── memory/                # Agent 知识库
│   │   └── database/              # 数据库 schema
│   ├── contexts/                  # React Context
│   ├── hooks/                     # 自定义 Hooks
│   ├── lib/                       # 工具库
│   ├── services/                  # 前端服务（TTS 等）
│   ├── types/                     # 类型定义
│   └── config/                    # 配置文件
└── ecosystem.config.cjs           # PM2 配置
```

---

## 游戏模式

### 1. 狼人杀

**支持局数**：
- 6人局：2狼 + 1预言家 + 1女巫 + 2平民
- 9人局：3狼 + 1预言家 + 1女巫 + 1猎人 + 1守卫 + 2平民
- 12人局：4狼 + 1预言家 + 1女巫 + 1猎人 + 1守卫 + 4平民

**核心功能**：
- AI 人设系统（6 种预设 + 自定义创建）
- 顺位发言系统
- 角色技能（狼人杀人、预言家查验、女巫毒/救、猎人射击、守卫守护）
- 警长竞选与投票
- 语音输入（Chrome/Edge）
- 游戏回放

**AI 人设**：

| 人设 | 逻辑性 | 情绪化 | 激进度 | 谨慎度 | 特点 |
|------|--------|--------|--------|--------|------|
| 逻辑大师 | 90% | 30% | 50% | 80% | 理性分析，条理清晰 |
| 情感玩家 | 50% | 85% | 60% | 40% | 情绪丰富，善于引导 |
| 激进派 | 50% | 70% | 90% | 30% | 主动带节奏 |
| 谨慎派 | 75% | 30% | 20% | 95% | 稳健保守 |
| 新手友好 | 50% | 50% | 50% | 50% | 平衡型 |
| 老狐狸 | 85% | 40% | 50% | 90% | 深藏不露 |

**使用流程**：
1. 访问 `/werewolf` 进入狼人杀大厅
2. 选择局数（6/9/12 人）
3. 选择 AI 人设（最多 局数-1 个）
4. 点击开始游戏 → 弹出角色卡片
5. 按顺位发言，天黑后执行角色技能
6. 投票放逐，直到一方获胜

### 2. 剧本杀 (Jubensha)

**支持剧本**：

| 剧本 | 类型 | 难度 | 人数 |
|------|------|------|------|
| 第二十二条校规 | 悬疑/恐怖 | 普通 | 4-7 |
| 收获日 | 犯罪 | 困难 | 5-7 |
| 病娇男孩的精分日记 | 恐怖 | 普通 | 4-7 |
| 小丑回魂 (IT) | 恐怖 | 疯狂 | 4-6 |

**核心功能**：
- AI 主持人引导剧情
- 多角色 AI 对话
- 场景切换与背景音乐
- TTS 语音播报
- 剧本上传解析（PDF/TXT/DOCX）
- 恐惧值/理智值系统

**使用流程**：
1. 访问 `/script-murder` 进入剧本杀大厅
2. 选择剧本或上传自定义剧本
3. 创建/加入房间
4. AI 主持人引导游戏流程
5. 通过对话探索剧情，推理真相

### 3. 数字冒险

通过对话选择推动故事发展的文本冒险模式，支持多重结局。

### 4. AI 伴侣系统

四种 AI 伴侣性格：
- **阿尔法**（策略型）：逻辑清晰，善于分析
- **水蓝**（社交型）：热情活跃，善于调动气氛
- **暗影**（神秘型）：沉着冷静，深思熟虑
- **小新**（辅助型）：热心肠，适合新手

### 5. 排行榜

战斗力榜、魅力榜、配合榜。

---

## 路由表

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | Home | 首页 |
| `/companions` | Companions | AI 伴侣中心 |
| `/werewolf` | WerewolfLobby | 狼人杀大厅 |
| `/werewolf/game` | MultiplayerGameRoom | 狼人杀游戏 |
| `/werewolf/multiplayer` | MultiplayerGameRoom | 狼人杀联机 |
| `/script-murder` | JubenshaLobby | 剧本杀大厅 |
| `/script-murder/room/:roomId` | JubenshaGameRoom | 剧本杀房间 |
| `/script-murder/it` | ITGameRoom | 小丑回魂 |
| `/script-murder/payday` | PaydayGame | 收获日 |
| `/script-murder/school-rules` | SchoolRulesGame | 第二十二条校规 |
| `/script-murder/yandere` | YandereGame | 病娇男孩 |
| `/adventure` | Adventure | 数字冒险 |
| `/rankings` | Rankings | 排行榜 |

---

## 后端 API

### REST

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET/POST | `/api/jubensha/*` | 剧本杀 API |

### WebSocket

- **Socket.IO**：通用房间管理 + 剧本场景
- **原生 WS**：`/jubensha/:roomId/:playerId` 剧本杀实时通信

---

## 开发指南

### 代码规范

- 使用 Biome 进行 lint 和 format
- 文件不超过 500 行
- 组件化设计，关注点分离

```bash
npm run lint        # 类型检查 + Biome
npm run format      # 格式化代码
npm run format:check # 检查格式
```

### 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | React 18 + TypeScript 5 |
| 构建工具 | Vite 5 |
| 样式 | TailwindCSS 3 + Radix UI |
| 动画 | Framer Motion |
| 路由 | React Router 7 |
| 状态管理 | React Context |
| HTTP 客户端 | axios |
| 实时通信 | Socket.IO + WebSocket |
| 数据库 | Supabase (PostgreSQL) |
| AI | LangChain + LangGraph + DeepSeek |
| 代码质量 | Biome + TypeScript |

---

## 部署

### 前端 (Vercel)

项目已配置 Vercel 自动部署，推送到 `main` 分支即触发构建。

### 后端 (Docker)

```bash
cd deploy
docker-compose up -d
```

详见 [`docs/deployment-guide.md`](docs/deployment-guide.md)。

### PM2

```bash
pm2 start ecosystem.config.cjs
```

---

## 常见问题

**端口被占用**：修改 `vite.config.ts` 或 `.env` 中 `PORT`，同步更新 CORS。

**Socket 连接失败**：检查浏览器控制台，确认 CORS 与端口一致。

**AI 接口报错**：确认 `.env` 中的 API 地址与密钥有效，避免前端暴露真实密钥。

**环境变量未生效**：`.env` 文件不应提交到仓库。从 `.env.production.example` 复制模板。

---

## 安全注意事项

- **禁止**将 `.env` 提交到 Git 仓库
- **禁止**在前端代码中硬编码 API 密钥
- 生产环境使用安全的密钥管理方案
- Supabase anon key 仅用于客户端，敏感操作通过 RLS 保护
