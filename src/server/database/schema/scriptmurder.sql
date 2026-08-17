-- Agent持久化数据库Schema

-- 1. 剧本表（Scripts）
CREATE TABLE scripts (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  player_count INTEGER NOT NULL,
  difficulty VARCHAR(50),
  category VARCHAR(100),
  
  -- 剧本元数据
  scenes JSONB,           -- 场景列表
  clues JSONB,            -- 线索列表
  game_flow JSONB,        -- 游戏流程
  
  -- 文件路径
  dm_handbook_path VARCHAR(500),
  
  -- 状态
  status VARCHAR(50) DEFAULT 'active',  -- active, archived
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 元数据
  cover_url VARCHAR(500),
  is_premium BOOLEAN DEFAULT FALSE,
  play_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0
);

-- 2. AI Agent配置表（AI_Agents）
CREATE TABLE ai_agents (
  id VARCHAR(255) PRIMARY KEY,
  script_id VARCHAR(255) NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  
  -- 角色基本信息
  character_name VARCHAR(255) NOT NULL,
  character_age INTEGER,
  character_description TEXT,
  
  -- 角色配置
  personality TEXT,           -- 性格描述
  secrets JSONB,              -- 秘密数组
  core_essence TEXT,          -- 第一性原理
  
  -- AI配置
  system_prompt TEXT NOT NULL,  -- 完整的System Prompt
  agent_config JSONB,           -- 扩展配置（人际关系、语言风格等）
  
  -- 状态
  is_active BOOLEAN DEFAULT TRUE,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  CONSTRAINT unique_script_character UNIQUE(script_id, character_name)
);

-- 3. 角色剧本文件表（Character_Scripts）
CREATE TABLE character_scripts (
  id VARCHAR(255) PRIMARY KEY,
  script_id VARCHAR(255) NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  agent_id VARCHAR(255) REFERENCES ai_agents(id) ON DELETE SET NULL,
  
  -- 文件信息
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  
  -- 提取的文本
  extracted_text TEXT,
  
  -- 索引顺序
  character_index INTEGER,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 游戏房间表（Game_Rooms）
CREATE TABLE game_rooms (
  id VARCHAR(255) PRIMARY KEY,
  script_id VARCHAR(255) NOT NULL REFERENCES scripts(id),
  
  room_name VARCHAR(255) NOT NULL,
  host_user_id VARCHAR(255),
  
  -- 游戏状态
  status VARCHAR(50) DEFAULT 'waiting',  -- waiting, playing, finished
  phase VARCHAR(50),                     -- 当前阶段
  current_round INTEGER DEFAULT 1,
  
  -- 玩家和AI
  players JSONB,           -- 真人玩家列表
  active_agent_ids JSONB,  -- 激活的AI Agent ID列表
  
  -- 游戏数据
  game_state JSONB,        -- 完整游戏状态
  game_log JSONB,          -- 游戏日志
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  finished_at TIMESTAMP
);

-- 5. Agent记忆表（Agent_Memories）用于跨游戏的长期记忆
CREATE TABLE agent_memories (
  id SERIAL PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  room_id VARCHAR(255) REFERENCES game_rooms(id) ON DELETE CASCADE,
  
  -- 记忆内容
  memory_type VARCHAR(50),   -- conversation, event, clue
  content TEXT NOT NULL,
  context JSONB,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  INDEX idx_agent_memories_agent (agent_id),
  INDEX idx_agent_memories_room (room_id)
);

-- 创建索引
CREATE INDEX idx_ai_agents_script ON ai_agents(script_id);
CREATE INDEX idx_character_scripts_script ON character_scripts(script_id);
CREATE INDEX idx_game_rooms_script ON game_rooms(script_id);

-- 创建更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scripts_updated_at BEFORE UPDATE ON scripts
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ai_agents_updated_at BEFORE UPDATE ON ai_agents
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
