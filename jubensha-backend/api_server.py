"""
剧本杀 Web API - FastAPI 后端
Jubensha Web API with FastAPI

提供 REST API 和 WebSocket 接口
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Set
import json
import uuid
from datetime import datetime

# 导入核心模块
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from parsers.character_profiler import CharacterProfiler
from parsers.scene_extractor import SceneExtractor
from knowledge.kb_builder import KnowledgeBuilder
from agents.character_agent import CharacterAgent


# ===== 数据模型 =====

class ScriptUpload(BaseModel):
    """剧本上传请求"""
    script_text: str
    room_name: str


class RoomInfo(BaseModel):
    """房间信息"""
    room_id: str
    room_name: str
    status: str  # 'waiting', 'playing', 'ended'
    players: List[Dict]
    max_players: int
    created_at: str


class JoinRoomRequest(BaseModel):
    """加入房间请求"""
    room_id: str
    player_name: str
    character_name: Optional[str] = None


class ChatMessage(BaseModel):
    """聊天消息"""
    room_id: str
    sender: str
    content: str
    message_type: str = "public"  # 'public', 'private'
    target: Optional[str] = None  # 私聊目标


# ===== 房间管理器 =====

class RoomManager:
    """游戏房间管理器"""
    
    def __init__(self):
        self.rooms: Dict[str, Dict] = {}
        self.connections: Dict[str, Set[WebSocket]] = {}
        self.kb = KnowledgeBuilder()
        
        print("✓ 房间管理器初始化完成")
    
    def create_room(self, script_text: str, room_name: str) -> Dict:
        """
        创建游戏房间
        
        流程：
        1. 解析剧本（Phase 1）
        2. 构建知识库（Phase 2）
        3. 初始化 Agent（Phase 3）
        """
        room_id = f"room_{uuid.uuid4().hex[:8]}"
        
        print(f"\n创建房间: {room_id}")
        
        # Phase 1: 解析剧本
        print("  [1/3] 解析剧本...")
        profiler = CharacterProfiler()
        characters = profiler.analyze(script_text)
        
        extractor = SceneExtractor()
        scene = extractor.extract(script_text)
        
        # Phase 2: 构建知识库
        print("  [2/3] 构建知识库...")
        self.kb.build_from_script(room_id, characters, scene, script_text)
        
        # Phase 3: 初始化 Agents
        print("  [3/3] 初始化 AI Agents...")
        agents = {}
        
        for char in characters:
            agent_config = {
                "agent_name": char['Name'],
                "system_prompt": f"""你是{char['Name']}。
性格：{', '.join(char['Personality_Tags'])}
说话风格：{char['Speaking_Style']}
秘密：{char['Hidden_Secret']}
""",
                "private_knowledge": [char['Hidden_Secret']],
                "personality_tags": char['Personality_Tags'],
                "speaking_style": char['Speaking_Style'],
                "goals": char.get('Goals', [])
            }
            
            agent = CharacterAgent(
                character_config=agent_config,
                kb_builder=self.kb,
                room_id=room_id
            )
            
            agents[char['Name']] = agent
        
        # 存储房间信息
        self.rooms[room_id] = {
            "room_id": room_id,
            "room_name": room_name,
            "status": "waiting",
            "characters": characters,
            "scene": scene,
            "agents": agents,
            "players": [],
            "max_players": len(characters),
            "created_at": datetime.now().isoformat(),
            "chat_history": []
        }
        
        self.connections[room_id] = set()
        
        print(f"✓ 房间创建完成: {room_id}")
        
        return self.rooms[room_id]
    
    def get_room(self, room_id: str) -> Optional[Dict]:
        """获取房间信息"""
        return self.rooms.get(room_id)
    
    def list_rooms(self) -> List[Dict]:
        """列出所有房间"""
        return [
            {
                "room_id": r["room_id"],
                "room_name": r["room_name"],
                "status": r["status"],
                "current_players": len(r["players"]),
                "max_players": r["max_players"]
            }
            for r in self.rooms.values()
        ]
    
    def join_room(self, room_id: str, player_name: str, character_name: Optional[str] = None) -> Dict:
        """加入房间"""
        room = self.get_room(room_id)
        
        if not room:
            raise ValueError("房间不存在")
        
        if len(room["players"]) >= room["max_players"]:
            raise ValueError("房间已满")
        
        # 如果没有指定角色，自动分配
        if not character_name:
            taken_chars = {p["character_name"] for p in room["players"]}
            available = [c["Name"] for c in room["characters"] if c["Name"] not in taken_chars]
            
            if not available:
                raise ValueError("没有可用角色")
            
            character_name = available[0]
        
        player = {
            "player_id": f"player_{uuid.uuid4().hex[:8]}",
            "player_name": player_name,
            "character_name": character_name,
            "joined_at": datetime.now().isoformat()
        }
        
        room["players"].append(player)
        
        return player
    
    async def broadcast(self, room_id: str, message: Dict):
        """广播消息到房间所有连接"""
        if room_id in self.connections:
            disconnected = set()
            
            for ws in self.connections[room_id]:
                try:
                    await ws.send_json(message)
                except:
                    disconnected.add(ws)
            
            # 清理断开的连接
            self.connections[room_id] -= disconnected
    
    async def handle_message(self, room_id: str, message: Dict) -> Dict:
        """处理玩家消息"""
        room = self.get_room(room_id)
        
        if not room:
            return {"error": "房间不存在"}
        
        sender = message.get("sender")
        content = message.get("content")
        message_type = message.get("message_type", "public")
        target = message.get("target")
        
        # 记录到聊天历史
        chat_record = {
            "sender": sender,
            "content": content,
            "type": message_type,
            "target": target,
            "timestamp": datetime.now().isoformat()
        }
        
        room["chat_history"].append(chat_record)
        
        # 如果是询问 AI
        if target and target in room["agents"]:
            agent = room["agents"][target]
            
            # AI 生成回复
            response = agent.respond(sender, content)
            
            # 广播 AI 回复
            reply_msg = {
                "type": "chat",
                "sender": target,
                "content": response,
                "message_type": "public",
                "timestamp": datetime.now().isoformat()
            }
            
            await self.broadcast(room_id, reply_msg)
            
            return reply_msg
        
        return chat_record


# ===== FastAPI 应用 =====

app = FastAPI(title="剧本杀 API", version="1.0.0")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局房间管理器
room_manager = RoomManager()


# ===== REST API 端点 =====

@app.get("/")
def root():
    """API 根端点"""
    return {
        "name": "剧本杀 API",
        "version": "1.0.0",
        "status": "running"
    }


@app.post("/api/rooms")
async def create_room(script: ScriptUpload):
    """创建游戏房间"""
    try:
        room = room_manager.create_room(script.script_text, script.room_name)
        
        return {
            "success": True,
            "room": {
                "room_id": room["room_id"],
                "room_name": room["room_name"],
                "characters": [c["Name"] for c in room["characters"]],
                "max_players": room["max_players"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/rooms")
async def list_rooms():
    """列出所有房间"""
    return {
        "success": True,
        "rooms": room_manager.list_rooms()
    }


@app.get("/api/rooms/{room_id}")
async def get_room(room_id: str):
    """获取房间详情"""
    room = room_manager.get_room(room_id)
    
    if not room:
        raise HTTPException(status_code=404, detail="房间不存在")
    
    return {
        "success": True,
        "room": {
            "room_id": room["room_id"],
            "room_name": room["room_name"],
            "status": room["status"],
            "characters": [
                {
                    "name": c["Name"],
                    "personality": c["Personality_Tags"],
                    "taken": c["Name"] in {p["character_name"] for p in room["players"]}
                }
                for c in room["characters"]
            ],
            "players": room["players"],
            "scene": room["scene"]["Scene_Name"]
        }
    }


@app.post("/api/rooms/{room_id}/join")
async def join_room(room_id: str, request: JoinRoomRequest):
    """加入房间"""
    try:
        player = room_manager.join_room(
            request.room_id,
            request.player_name,
            request.character_name
        )
        
        # 广播玩家加入消息
        await room_manager.broadcast(room_id, {
            "type": "player_joined",
            "player": player
        })
        
        return {
            "success": True,
            "player": player
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ===== WebSocket 端点 =====

@app.websocket("/ws/{room_id}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, player_id: str):
    """WebSocket 连接"""
    await websocket.accept()
    
    # 添加到连接池
    if room_id not in room_manager.connections:
        room_manager.connections[room_id] = set()
    
    room_manager.connections[room_id].add(websocket)
    
    try:
        # 发送欢迎消息
        await websocket.send_json({
            "type": "connected",
            "message": "已连接到游戏房间"
        })
        
        # 消息循环
        while True:
            data = await websocket.receive_json()
            
            # 处理消息
            result = await room_manager.handle_message(room_id, data)
            
            # 广播消息（除非是私聊）
            if data.get("message_type") != "private":
                await room_manager.broadcast(room_id, {
                    "type": "chat",
                    **data,
                    "timestamp": datetime.now().isoformat()
                })
    
    except WebSocketDisconnect:
        # 移除连接
        room_manager.connections[room_id].discard(websocket)
        
        print(f"玩家 {player_id} 断开连接")


# ===== 启动配置 =====

if __name__ == "__main__":
    import uvicorn
    
    print("=" * 70)
    print("🎭 剧本杀 API 服务器")
    print("=" * 70)
    print("\n启动信息：")
    print("  • 地址: http://localhost:8000")
    print("  • API 文档: http://localhost:8000/docs")
    print("  • WebSocket: ws://localhost:8000/ws/{room_id}/{player_id}")
    print("\n按 Ctrl+C 停止服务器")
    print("=" * 70)
    
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
