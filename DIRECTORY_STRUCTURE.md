# 项目目录结构

```
app-7gn2vl8qe60x_app_version-7r0unkm6hkhs/
│
├── README.md                          # 根目录说明（项目入口）
├── PROJECT_STRUCTURE.md               # 项目架构详细文档
│
├─┬ app-7gn2vl8qe60x/                 # 🐺 狼人杀项目（独立）
│ │
│ ├── package.json                     # Node.js 依赖
│ ├── tsconfig.json                    # TypeScript 配置
│ ├── vite.config.ts                   # Vite 配置
│ ├── INTEGRATION_GUIDE.md             # 狼人杀文档
│ │
│ ├─┬ src/
│ │ ├─┬ server/                        # 后端（Node.js + Socket.IO）
│ │ │ ├── index.ts                     # 服务器入口
│ │ │ ├── RoomManager.ts               # 房间管理
│ │ │ ├── GameStateMachine.ts          # 游戏状态机
│ │ │ ├── ReplayRecorder.ts            # 回放记录器 ✅
│ │ │ ├── SocketHandlersEnhanced.ts    # Socket 处理
│ │ │ └── types.ts                     # 类型定义
│ │ │
│ │ ├─┬ pages/
│ │ │ └─┬ werewolf/                    # 狼人杀前端页面
│ │ │   ├── WerewolfLobby.tsx          # 大厅
│ │ │   ├── MultiplayerGameRoom.tsx    # 游戏房间
│ │ │   └── ReplayViewer.tsx           # 回放查看器 ✅
│ │ │
│ │ └─┬ components/
│ │   └── werewolf/                    # 狼人杀组件
│ │       ├── SubtitleOverlay.tsx      # 字幕
│ │       ├── SpeechWave.tsx           # 波形
│ │       └── VoiceSettingsDialog.tsx  # 语音设置
│ │
│ └── node_modules/                    # Node.js 依赖（独立）
│
└─┬ jubensha-backend/                  # 🎭 剧本杀项目（独立）
  │
  ├── requirements.txt                  # Python 依赖
  ├── README.md                         # 剧本杀文档
  │
  ├─┬ parsers/                          # ✅ Phase 1: 解析层
  │ ├── character_profiler.py           # 角色侧写器
  │ └── scene_extractor.py              # 场景提取器
  │
  ├─┬ knowledge/                        # ✅ Phase 2: 知识库
  │ └── kb_builder.py                   # 知识库构建器
  │
  ├─┬ agents/                           # ⏳ Phase 3: Agent 系统
  │ └── (待开发)
  │
  ├─┬ prompts/                          # Prompt 模板
  │ └── (待开发)
  │
  ├─┬ tests/                            # 测试文件
  │ └── (待开发)
  │
  ├─┬ output/                           # 输出目录（运行时生成）
  │ ├── characters.json
  │ ├── scene.json
  │ └── integrated_config.json
  │
  ├── demo.py                           # Phase 1 演示
  └── integrated_demo.py                # Phase 1+2 集成演示
```

## 🔑 关键说明

### 狼人杀 (`app-7gn2vl8qe60x/`)
- **语言**：TypeScript/JavaScript
- **运行方式**：`npm run dev`
- **端口**：5173 (前端), 3001 (后端)
- **依赖管理**：`package.json` + `node_modules/`

### 剧本杀 (`jubensha-backend/`)
- **语言**：Python
- **运行方式**：`python integrated_demo.py`
- **依赖服务**：Qdrant (Docker)
- **依赖管理**：`requirements.txt` + `pip`

## ✅ 分隔验证

两个项目完全独立，满足以下条件：

1. ✅ **目录独立**：各自在独立文件夹
2. ✅ **依赖独立**：不共享 node_modules 或 Python 包
3. ✅ **端口独立**：无端口冲突
4. ✅ **文档独立**：各自有 README
5. ✅ **配置独立**：各自有配置文件

## 🚀 同时运行

可以同时启动两个项目：

**终端 1 (狼人杀)**:
```bash
cd app-7gn2vl8qe60x
npm run dev
```

**终端 2 (Qdrant)**:
```bash
docker run -p 6333:6333 qdrant/qdrant
```

**终端 3 (剧本杀)**:
```bash
cd jubensha-backend
python integrated_demo.py
```

互不干扰！✨
