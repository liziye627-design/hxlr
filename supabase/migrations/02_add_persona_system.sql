/*
# 狼人杀人设系统扩展

## 1. 概述
为狼人杀游戏添加人设系统，支持预设人设、自定义人设、发言记录和AI分析生成新人设。

## 2. 新建表

### 2.1 werewolf_personas（狼人杀人设表）
- `id` (uuid, primary key): 人设ID
- `name` (text, not null): 人设名称
- `type` (text, not null): 类型 (preset/custom/learned)
- `creator_user_id` (uuid, references user_profiles): 创建者ID（自定义人设）
- `description` (text): 人设描述
- `avatar_url` (text): 头像URL
- `personality_traits` (jsonb): 性格特征
  - logical_level: 逻辑性 (0-1)
  - emotional_level: 情绪化程度 (0-1)
  - aggressive_level: 激进程度 (0-1)
  - cautious_level: 谨慎程度 (0-1)
  - trust_level: 信任倾向 (0-1)
- `speaking_style` (jsonb): 发言风格
  - speech_length: 发言长度倾向 (short/medium/long)
  - speech_frequency: 发言频率 (low/medium/high)
  - logic_pattern: 逻辑模式 (inductive/deductive/intuitive)
  - emotion_expression: 情绪表达 (reserved/moderate/expressive)
- `behavior_patterns` (jsonb): 行为模式
  - voting_tendency: 投票倾向
  - role_preference: 角色偏好
  - strategy_style: 策略风格
- `sample_speeches` (jsonb): 示例发言（用于AI学习）
- `usage_count` (integer, default: 0): 使用次数
- `rating` (numeric, default: 0): 评分
- `is_public` (boolean, default: false): 是否公开
- `created_at` (timestamptz, default: now()): 创建时间
- `updated_at` (timestamptz, default: now()): 更新时间

### 2.2 werewolf_speech_records（狼人杀发言记录表）
- `id` (uuid, primary key): 记录ID
- `session_id` (uuid, references game_sessions): 游戏会话ID
- `round_number` (integer, not null): 回合数
- `phase` (text, not null): 阶段 (night/day/vote)
- `speaker_type` (text, not null): 发言者类型 (user/ai)
- `speaker_id` (uuid): 发言者ID
- `speaker_name` (text): 发言者名称
- `role` (text): 角色 (werewolf/villager/seer/witch/hunter/guard)
- `content` (text, not null): 发言内容
- `emotion` (text): 情绪标签
- `target_player` (text): 目标玩家
- `vote_result` (text): 投票结果
- `created_at` (timestamptz, default: now()): 创建时间

### 2.3 werewolf_persona_learning（人设学习记录表）
- `id` (uuid, primary key): 学习记录ID
- `source_session_id` (uuid, references game_sessions): 来源会话ID
- `target_user_id` (uuid, references user_profiles): 目标用户ID（被学习的玩家）
- `generated_persona_id` (uuid, references werewolf_personas): 生成的人设ID
- `speech_count` (integer): 分析的发言数量
- `analysis_result` (jsonb): AI分析结果
  - personality_analysis: 性格分析
  - speaking_style_analysis: 发言风格分析
  - behavior_analysis: 行为分析
  - key_phrases: 关键短语
  - decision_patterns: 决策模式
- `confidence_score` (numeric): 置信度分数 (0-1)
- `status` (text, default: 'pending'): 状态 (pending/processing/completed/failed)
- `created_at` (timestamptz, default: now()): 创建时间
- `completed_at` (timestamptz): 完成时间

### 2.4 werewolf_game_configs（狼人杀游戏配置表）
- `id` (uuid, primary key): 配置ID
- `player_count` (integer, not null): 玩家数量 (6/9/12)
- `role_config` (jsonb, not null): 角色配置
  - werewolf_count: 狼人数量
  - villager_count: 村民数量
  - seer_count: 预言家数量
  - witch_count: 女巫数量
  - hunter_count: 猎人数量
  - guard_count: 守卫数量
- `rules` (jsonb): 规则配置
- `is_default` (boolean, default: false): 是否默认配置
- `created_at` (timestamptz, default: now()): 创建时间

## 3. 安全策略
所有表为公开读取，用户可以修改自己创建的数据。

*/

-- 创建狼人杀人设表
CREATE TABLE IF NOT EXISTS werewolf_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('preset', 'custom', 'learned')),
  creator_user_id uuid REFERENCES user_profiles(id),
  description text,
  avatar_url text,
  personality_traits jsonb DEFAULT '{}'::jsonb,
  speaking_style jsonb DEFAULT '{}'::jsonb,
  behavior_patterns jsonb DEFAULT '{}'::jsonb,
  sample_speeches jsonb DEFAULT '[]'::jsonb,
  usage_count integer DEFAULT 0,
  rating numeric DEFAULT 0,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建狼人杀发言记录表
CREATE TABLE IF NOT EXISTS werewolf_speech_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES game_sessions(id),
  round_number integer NOT NULL,
  phase text NOT NULL CHECK (phase IN ('night', 'day', 'vote')),
  speaker_type text NOT NULL CHECK (speaker_type IN ('user', 'ai')),
  speaker_id uuid,
  speaker_name text,
  role text CHECK (role IN ('werewolf', 'villager', 'seer', 'witch', 'hunter', 'guard')),
  content text NOT NULL,
  emotion text,
  target_player text,
  vote_result text,
  created_at timestamptz DEFAULT now()
);

-- 创建人设学习记录表
CREATE TABLE IF NOT EXISTS werewolf_persona_learning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_session_id uuid REFERENCES game_sessions(id),
  target_user_id uuid REFERENCES user_profiles(id),
  generated_persona_id uuid REFERENCES werewolf_personas(id),
  speech_count integer DEFAULT 0,
  analysis_result jsonb DEFAULT '{}'::jsonb,
  confidence_score numeric DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- 创建狼人杀游戏配置表
CREATE TABLE IF NOT EXISTS werewolf_game_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_count integer NOT NULL CHECK (player_count IN (6, 9, 12)),
  role_config jsonb NOT NULL,
  rules jsonb DEFAULT '{}'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_werewolf_personas_type ON werewolf_personas(type);
CREATE INDEX idx_werewolf_personas_creator ON werewolf_personas(creator_user_id);
CREATE INDEX idx_werewolf_speech_records_session ON werewolf_speech_records(session_id);
CREATE INDEX idx_werewolf_persona_learning_session ON werewolf_persona_learning(source_session_id);
CREATE INDEX idx_werewolf_persona_learning_status ON werewolf_persona_learning(status);

-- 插入默认游戏配置
INSERT INTO werewolf_game_configs (player_count, role_config, is_default) VALUES
(6, '{
  "werewolf_count": 2,
  "villager_count": 2,
  "seer_count": 1,
  "witch_count": 1,
  "hunter_count": 0,
  "guard_count": 0
}'::jsonb, true),
(9, '{
  "werewolf_count": 3,
  "villager_count": 3,
  "seer_count": 1,
  "witch_count": 1,
  "hunter_count": 1,
  "guard_count": 0
}'::jsonb, true),
(12, '{
  "werewolf_count": 4,
  "villager_count": 4,
  "seer_count": 1,
  "witch_count": 1,
  "hunter_count": 1,
  "guard_count": 1
}'::jsonb, true);

-- 插入预设人设
INSERT INTO werewolf_personas (name, type, description, personality_traits, speaking_style, behavior_patterns, is_public) VALUES
('逻辑大师', 'preset', '擅长逻辑推理，发言条理清晰，善于分析局势', 
'{
  "logical_level": 0.95,
  "emotional_level": 0.2,
  "aggressive_level": 0.5,
  "cautious_level": 0.8,
  "trust_level": 0.4
}'::jsonb,
'{
  "speech_length": "long",
  "speech_frequency": "high",
  "logic_pattern": "deductive",
  "emotion_expression": "reserved"
}'::jsonb,
'{
  "voting_tendency": "evidence_based",
  "strategy_style": "analytical"
}'::jsonb,
true),

('情感玩家', 'preset', '情绪表达丰富，善于观察他人情绪，直觉敏锐',
'{
  "logical_level": 0.5,
  "emotional_level": 0.9,
  "aggressive_level": 0.3,
  "cautious_level": 0.5,
  "trust_level": 0.7
}'::jsonb,
'{
  "speech_length": "medium",
  "speech_frequency": "medium",
  "logic_pattern": "intuitive",
  "emotion_expression": "expressive"
}'::jsonb,
'{
  "voting_tendency": "intuition_based",
  "strategy_style": "emotional"
}'::jsonb,
true),

('激进派', 'preset', '发言激进，主动带节奏，敢于质疑他人',
'{
  "logical_level": 0.6,
  "emotional_level": 0.7,
  "aggressive_level": 0.95,
  "cautious_level": 0.2,
  "trust_level": 0.3
}'::jsonb,
'{
  "speech_length": "short",
  "speech_frequency": "high",
  "logic_pattern": "inductive",
  "emotion_expression": "expressive"
}'::jsonb,
'{
  "voting_tendency": "aggressive",
  "strategy_style": "offensive"
}'::jsonb,
true),

('谨慎派', 'preset', '发言谨慎，不轻易表态，善于观察和等待',
'{
  "logical_level": 0.7,
  "emotional_level": 0.4,
  "aggressive_level": 0.2,
  "cautious_level": 0.95,
  "trust_level": 0.5
}'::jsonb,
'{
  "speech_length": "short",
  "speech_frequency": "low",
  "logic_pattern": "deductive",
  "emotion_expression": "reserved"
}'::jsonb,
'{
  "voting_tendency": "conservative",
  "strategy_style": "defensive"
}'::jsonb,
true),

('新手友好', 'preset', '适合新手，发言简单明了，策略稳健',
'{
  "logical_level": 0.5,
  "emotional_level": 0.5,
  "aggressive_level": 0.4,
  "cautious_level": 0.6,
  "trust_level": 0.6
}'::jsonb,
'{
  "speech_length": "medium",
  "speech_frequency": "medium",
  "logic_pattern": "inductive",
  "emotion_expression": "moderate"
}'::jsonb,
'{
  "voting_tendency": "follow_majority",
  "strategy_style": "balanced"
}'::jsonb,
true),

('老狐狸', 'preset', '经验丰富，善于伪装和误导，发言滴水不漏',
'{
  "logical_level": 0.85,
  "emotional_level": 0.6,
  "aggressive_level": 0.6,
  "cautious_level": 0.85,
  "trust_level": 0.3
}'::jsonb,
'{
  "speech_length": "long",
  "speech_frequency": "medium",
  "logic_pattern": "deductive",
  "emotion_expression": "moderate"
}'::jsonb,
'{
  "voting_tendency": "strategic",
  "strategy_style": "deceptive"
}'::jsonb,
true);
