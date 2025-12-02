# 项目架构说明

本仓库包含两个完全独立的游戏系统项目。

---

## 📂 项目分隔

```
app-7gn2vl8qe60x_app_version-7r0unkm6hkhs/
│
├── app-7gn2vl8qe60x/              # 狼人杀项目 (Werewolf)
│   ├── src/
│   │   ├── server/                # 后端（Node.js + TypeScript）
│   │   ├── pages/                 # 前端页面（React）
│   │   └── components/            # UI 组件
│   ├── package.json
│   └── README.md
│
└── jubensha-backend/              # 剧本杀项目 (Jubensha)
    ├── parsers/                   # 剧本解析器（Python）
    ├── knowledge/                 # 知识库系统
    ├── agents/                    # AI Agent（待开发）
    ├── requirements.txt
    └── README.md
```

---

## 🎮 狼人杀项目 (Werewolf)

**技术栈**：Node.js + TypeScript + React + Socket.IO

### 目录
- **路径**：`app-7gn2vl8qe60x/`
- **文档**：`app-7gn2vl8qe60x/INTEGRATION_GUIDE.md`

### 功能状态
- ✅ 多人在线游戏
- ✅ AI 玩家（LLM 驱动）
- ✅ 语音增强（TTS + 字幕）
- ✅ 警长竞选
- ✅ 回放系统

### 启动
```bash
cd app-7gn2vl8qe60x
npm install
npm run dev
```

### 端口
- **前端**：http://localhost:5173
- **后端**：http://localhost:3001

---

## 🎭 剧本杀项目 (Jubensha)

**技术栈**：Python + LangChain + LangGraph + Qdrant

### 目录
- **路径**：`jubensha-backend/`
- **文档**：`jubensha-backend/README.md`

### 功能状态
- ✅ Phase 1: 剧本解析（角色 + 场景）
- ✅ Phase 2: 知识库系统（Vector DB + 权限隔离）
- ⏳ Phase 3: AI Agent 状态机
- ⏳ Phase 4: Web 接口

### 启动
```bash
# 1. 启动 Qdrant（必需）
docker run -p 6333:6333 qdrant/qdrant

# 2. 安装依赖
cd jubensha-backend
pip install -r requirements.txt

# 3. 运行 Demo
python integrated_demo.py
```

### 依赖服务
- **Qdrant**：http://localhost:6333

---

## 🔑 关键差异

| 方面 | 狼人杀 | 剧本杀 |
|------|--------|--------|
| **语言** | TypeScript/JavaScript | Python |
| **框架** | React + Node.js | LangChain + LangGraph |
| **数据库** | 内存（Map） | Qdrant (Vector DB) |
| **AI 技术** | 直接 LLM 调用 | Agent 状态机 + RAG |
| **通信** | Socket.IO | WebSocket (计划中) |
| **部署** | 单体应用 | 微服务架构 |

---

## 📋 独立开发指南

### 开发狼人杀
1. 只进入 `app-7gn2vl8qe60x/` 目录
2. 修改后端：`src/server/`
3. 修改前端：`src/pages/werewolf/`
4. 运行测试：`npm run dev`

### 开发剧本杀
1. 只进入 `jubensha-backend/` 目录
2. 修改解析器：`parsers/`
3. 修改知识库：`knowledge/`
4. 运行测试：`python integrated_demo.py`

---

## 🚀 后续规划

### 狼人杀
- [ ] 性能优化
- [ ] 更多角色（守卫、猎人变体）
- [ ] 排行榜系统

### 剧本杀
- [ ] Phase 3: LangGraph Agent
- [ ] Phase 4: FastAPI Web 接口
- [ ] 前端 UI（React）

---

## 📞 技术支持

**狼人杀问题**：查看 `app-7gn2vl8qe60x/INTEGRATION_GUIDE.md`  
**剧本杀问题**：查看 `jubensha-backend/README.md`

**通用问题**：
- 确保各自的依赖已安装
- 检查端口是否被占用
- 查看对应项目的日志输出
