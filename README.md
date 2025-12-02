# 项目README

**项目概览**
- 前端使用 `Vite + React + TypeScript`，端口 `5200`。
- 后端为 `Node.js + Express + Socket.IO + WS` 游戏服务，端口默认 `3001`。
- 集成 `Supabase` 数据与鉴权，以及 AI 相关能力（LangChain/LangGraph）。
- 提供剧本杀/狼人杀等玩法支持，含房间管理、实时通信与AI叙事管理。

**核心功能**
- 实时房间与玩家管理，支持 Socket.IO 与原生 WebSocket。
- 剧本杀（Jubensha）上传解析、房间流程控制与事件处理。
- AI 剧本角色/旁白/法官等智能体编排与知识库管理。
- 前后端联动的开发模式，一键并行启动前端与游戏服务。

**技术栈**
- 前端：`React 18`、`Vite 5`、`TypeScript 5`、`TailwindCSS`、`Radix UI`。
- 后端：`Express`、`Socket.IO`、`WS`、`LangChain/LangGraph`、`Supabase`。
- 质量工具：`Biome`（lint/format）、`Vitest`（测试）、`TypeScript` 类型检查。

**目录结构（简要）**
```
├── README.md
├── index.html
├── package.json
├── vite.config.ts               # Vite 配置（端口 5200，路径别名）
├── .env                         # 环境变量（前后端）
├── src/
│   ├── main.tsx                # React 入口（StrictMode）
│   ├── App.tsx                 # 应用根组件
│   ├── components/             # 组件库
│   ├── pages/                  # 页面模块
│   ├── server/                 # Node 游戏服务源码
│   │   ├── index.ts            # Express + Socket.IO + WS 入口
│   │   ├── RoomManager.ts      # 房间管理
│   │   ├── SocketHandlers*.ts  # Socket 事件处理
│   │   ├── jubensha/           # 剧本杀相关路由/WS管理/智能体
│   │   └── services/           # 解析/AI/脚本分析等服务
│   └── ...
├── public/                     # 静态资源（图片/音频/视频等）
└── scripts/                    # 数据导入、工具与测试脚本
```

**环境要求**
- `Node.js ≥ 20`、`npm ≥ 10`。
- 前端默认运行于 `http://127.0.0.1:5200`，后端默认运行于 `http://127.0.0.1:3001`。

**快速开始**
- 安装依赖：`npm i`
- 同时启动前端与后端：`npm run dev:full`
- 仅前端：`npm run dev`
- 仅后端（监视模式）：`npm run server:dev`
- 构建前端产物：`npm run build`
- 预览构建产物：`npm run preview` 或 `npm run serve`

**关键脚本说明（来自 package.json）**
- `dev`：启动 Vite，`--host 127.0.0.1 --port 5200`
- `dev:full`：并行运行前端与 `src/server/index.ts`（`concurrently`）
- `server:dev`：使用 `tsx watch` 监视并启动后端服务
- `lint`：类型检查与 `Biome` 依赖声明校验
- `format` / `format:check`：`Biome` 代码格式化/检查

**环境变量（.env）**
- 前端（以 `VITE_` 开头，由 Vite 注入）：
  - `VITE_APP_ID`：应用标识
  - `VITE_SUPABASE_URL`：Supabase 服务地址
  - `VITE_SUPABASE_ANON_KEY`：Supabase 公钥（请在生产环境妥善保管）
  - `VITE_DEEPSEEK_API_KEY`、`VITE_DEEPSEEK_API_URL`、`VITE_DEEPSEEK_MODEL`：AI 接口配置
- 后端：
  - `PORT`：后端服务端口（可选，默认 `3001`）
  - `FRONTEND_ORIGIN`：允许的前端来源（用于 CORS）
  - `DEEPSEEK_API_KEY`、`DEEPSEEK_API_URL`、`DEEPSEEK_MODEL`：AI 接口配置
- 安全提示：勿在公开仓库提交真实密钥；生产环境请改用安全的密钥管理。

**后端通信与路由**
- 健康检查：`GET /health`
- 剧本杀 API：`/api/jubensha/*`
- WebSocket（剧本杀）：路径以 `/jubensha/:roomId/:playerId` 开头，由 `JubenshaWebSocketManager` 处理。
- Socket.IO：用于通用房间与脚本场景管理，见 `SocketHandlersEnhanced` 与 `ScriptSocketHandlers`。

**开发建议**
- 在本地同时运行前后端，便于调试 Socket 与 API 流程。
- 若前端非默认端口或来源，请在 `.env` 设置 `FRONTEND_ORIGIN` 以放通 CORS。
- 使用 `Biome` 保持一致的代码风格；提交前运行 `npm run lint` 与 `npm run format:check`。

**常见问题**
- 端口被占用：修改 `vite.config.ts` 或 `.env` 中 `PORT`，并同步更新 CORS 来源。
- Socket 连接失败：检查浏览器控制台与后端日志，确认 CORS 与端口配置一致。
- AI 接口报错：确认 `.env` 中的接口地址与密钥有效，避免前端暴露真实密钥。

**相关文档**
- `PROJECT_STRUCTURE.md`、`DIRECTORY_STRUCTURE.md`：更详细的项目结构说明。
- `WEREWOLF_*` 与 `README_Jubensha_Integration.md`：玩法与集成说明。
- `QUICKSTART.md`、`USAGE.md`：快速上手与使用指南。
