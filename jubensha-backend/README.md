# 剧本杀 AI 系统

剧本杀 AI 系统 - **完整实现**

- **Phase 1**: 剧本解析层 ✅
- **Phase 2**: 知识库系统 ✅
- **Phase 3**: AI Agent 系统 ✅
- **Phase 4**: Web 接口 ✅

## 功能清单

### Phase 1: 剧本解析
- ✅ **角色侧写**：提取性格、秘密、目标
- ✅ **场景配置**：提取环境、物品、触发器
- ✅ **Agent 配置生成**：自动生成 System Prompt

### Phase 2: 知识库系统
- ✅ **Vector DB 集成**：基于 Qdrant
- ✅ **权限隔离**：Public/Private_角色名
- ✅ **RAG 检索**：语义搜索 + 权限过滤
- ✅ **批量导入**：从解析结果自动构建

### Phase 3: AI Agent 系统
- ✅ **LangGraph 状态机**：感知 → 检索 → 推理 → 决策 → 回复
- ✅ **怀疑度引擎**：动态追踪每个角色的可信度
- ✅ **策略决策**：诚实/欺骗/防守/含糊
- ✅ **自然对话**：符合角色性格和说话风格
- ✅ **目标导向**：基于角色目标智能决策

### Phase 4: Web 接口
- ✅ **FastAPI 后端**：REST API + WebSocket
- ✅ **房间管理**：创建、加入、列表
- ✅ **实时通信**：WebSocket 聊天
- ✅ **现代 UI**：响应式卡片设计

## 快速开始

### 1. 启动 Qdrant (Docker)

```bash
docker run -p 6333:6333 qdrant/qdrant
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 设置 API Key

```bash
# Windows PowerShell
$env:OPENAI_API_KEY="sk-your-key-here"

# Linux/Mac
export OPENAI_API_KEY="sk-your-key-here"
```

### 4. 启动系统

```bash
# Windows
start.bat

# Linux/Mac
chmod +x start.sh
./start.sh

# 或手动启动
python api_server.py
```

### 5. 访问界面

- **Web 界面**: 打开 `web/index.html` 或访问 http://localhost:8000
- **API 文档**: http://localhost:8000/docs
- **WebSocket**: ws://localhost:8000/ws/{room_id}/{player_id}

## 文件结构

```
jubensha-backend/
├── parsers/
│   ├── character_profiler.py  # 角色侧写器
│   └── scene_extractor.py     # 场景提取器
├── knowledge/
│   └── kb_builder.py          # 知识库构建器
├── demo.py                     # Phase 1 演示
├── integrated_demo.py          # Phase 1+2 集成演示
├── requirements.txt
└── README.md
```

## 核心 API

### 解析层

```python
# 角色侧写
from parsers.character_profiler import CharacterProfiler
profiler = CharacterProfiler()
characters = profiler.analyze(script_text)

# 场景提取
from parsers.scene_extractor import SceneExtractor
extractor = SceneExtractor()
scene = extractor.extract(script_text)
```

### 知识库层

```python
# 初始化
from knowledge.kb_builder import KnowledgeBuilder
kb = KnowledgeBuilder(qdrant_url="http://localhost:6333")

# 创建角色知识库
collection = kb.create_character_collection(room_id, character_name)

# 添加知识
kb.add_knowledge(
    collection_name=collection,
    text="秘密信息",
    permission="Private_李医生",
    knowledge_type="fact"
)

# 检索（带权限过滤）
results = kb.search_knowledge(
    collection_name=collection,
    query="查询文本",
    permission_filter=["Public", "Private_李医生"]
)
```

## 输出示例

### 知识隔离测试

```
🎭 李医生的视角
❓ 查询: "遗嘱的情况如何？"
  1. 🔒 [0.85] ████████
     我在 21:50 篡改了遗嘱，把继承人从'张三'改成了'李四'。
  2. 🌍 [0.72] ███████
     桌子上放着一份被撕碎的遗嘱。

🎭 管家老王的视角
❓ 查询: "遗嘱的情况如何？"
  1. 🌍 [0.72] ███████
     桌子上放着一份被撕碎的遗嘱。
  ⚠ 看不到李医生的私密信息
```

## 技术架构

### Vector DB 隔离方案

```
Collection 命名规则: game_{room_id}_agent_{character_name}

例如:
- game_room001_agent_李医生
- game_room001_agent_管家老王
```

### 权限标签系统

```python
# 公共信息（所有人可见）
permission = "Public"

# 私密信息（只有特定角色可见）
permission = "Private_李医生"
```

### RAG 检索流程

```
Query → Embedding → Vector Search → Permission Filter → Results
```

## 下一步

✅ **Phase 1 完成**：剧本解析层  
✅ **Phase 2 完成**：知识库系统  
⏳ **Phase 3 待开发**：Agent 状态机（LangGraph）  
⏳ **Phase 4 待开发**：Web 接口（FastAPI）

## 常见问题

**Q: Qdrant 连接失败？**  
A: 确认 Docker 容器运行：`docker ps | grep qdrant`

**Q: 知识隔离如何保证？**  
A: 通过 Vector DB 的 metadata filter 实现物理隔离，角色 A 无法检索到角色 B 的私密信息。

**Q: 能否使用其他 Vector DB？**  
A: 可以，修改 `KnowledgeBuilder` 的初始化方法即可对接 Pinecone、Weaviate 等。

