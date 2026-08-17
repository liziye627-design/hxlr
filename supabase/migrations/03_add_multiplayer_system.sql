/*
# 狼人杀多人游戏系统 - 数据库迁移

## 概述
本迁移添加完整的多人狼人杀游戏系统，包括：
1. AI模型配置系统
2. 游戏房间系统
3. 游戏状态管理
4. 夜晚行动记录
5. 投票系统
6. 游戏日志

## 新增表

### 1. ai_model_configs - AI模型配置表
存储用户配置的AI模型信息，支持多种AI提供商

### 2. game_rooms - 游戏房间表
管理游戏房间，包括房间配置、状态等

### 3. room_players - 房间玩家表
记录房间中的玩家信息，包括真人和AI

### 4. game_states - 游戏状态表
记录游戏的实时状态，包括当前阶段、回合数等

### 5. night_actions - 夜晚行动记录表
记录夜晚阶段各角色的行动

### 6. vote_records - 投票记录表
记录所有投票信息

### 7. game_logs - 游戏日志表
记录游戏中的所有事件

## 安全策略
- 所有表启用RLS
- 用户只能查看自己参与的游戏
- 游戏状态通过RPC函数更新，确保原子性
*/

-- ============================================================================
-- 1. AI模型配置表
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_model_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  provider text NOT NULL, -- 'deepseek', 'openai', 'claude', 'custom'
  api_key text NOT NULL, -- 加密存储
  api_url text,
  model_name text NOT NULL,
  temperature numeric DEFAULT 0.7,
  max_tokens integer DEFAULT 2000,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ai_model_configs_user ON ai_model_configs(user_id);
CREATE INDEX idx_ai_model_configs_active ON ai_model_configs(user_id, is_active);

-- ============================================================================
-- 2. 游戏房间表
-- ============================================================================

CREATE TYPE room_status AS ENUM ('waiting', 'starting', 'playing', 'finished', 'cancelled');

CREATE TABLE IF NOT EXISTS game_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text UNIQUE NOT NULL, -- 6位房间号
  creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  player_count integer NOT NULL CHECK (player_count IN (6, 9, 12)),
  human_count integer NOT NULL CHECK (human_count >= 1 AND human_count <= player_count),
  ai_count integer NOT NULL CHECK (ai_count >= 0 AND ai_count = player_count - human_count),
  config_id uuid REFERENCES werewolf_game_configs(id),
  status room_status DEFAULT 'waiting',
  current_players integer DEFAULT 0,
  password text, -- 可选密码
  is_public boolean DEFAULT true,
  voice_enabled boolean DEFAULT false, -- 是否启用语音
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz
);

CREATE INDEX idx_game_rooms_status ON game_rooms(status);
CREATE INDEX idx_game_rooms_public ON game_rooms(is_public, status);
CREATE INDEX idx_game_rooms_code ON game_rooms(room_code);

-- ============================================================================
-- 3. 房间玩家表
-- ============================================================================

CREATE TYPE player_type AS ENUM ('human', 'ai');
CREATE TYPE player_status AS ENUM ('alive', 'dead');

CREATE TABLE IF NOT EXISTS room_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- AI玩家此字段为NULL
  persona_id uuid REFERENCES werewolf_personas(id), -- AI玩家的人设
  ai_model_id uuid REFERENCES ai_model_configs(id), -- AI使用的模型
  player_type player_type NOT NULL,
  player_name text NOT NULL,
  position integer NOT NULL, -- 座位号 1-12
  role text, -- 角色：werewolf, villager, seer, witch, hunter, guard
  status player_status DEFAULT 'alive',
  is_sheriff boolean DEFAULT false, -- 是否是警长
  has_spoken boolean DEFAULT false, -- 当前回合是否已发言
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, position),
  UNIQUE(room_id, user_id) -- 一个用户在一个房间只能有一个角色
);

CREATE INDEX idx_room_players_room ON room_players(room_id);
CREATE INDEX idx_room_players_user ON room_players(user_id);
CREATE INDEX idx_room_players_type ON room_players(room_id, player_type);

-- ============================================================================
-- 4. 游戏状态表
-- ============================================================================

CREATE TYPE game_phase AS ENUM ('init', 'night', 'day', 'vote', 'finished');

CREATE TABLE IF NOT EXISTS game_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid UNIQUE REFERENCES game_rooms(id) ON DELETE CASCADE,
  session_id uuid REFERENCES game_sessions(id) ON DELETE CASCADE,
  current_phase game_phase DEFAULT 'init',
  current_round integer DEFAULT 0,
  current_speaker_position integer, -- 当前发言者位置
  phase_start_time timestamptz,
  phase_end_time timestamptz,
  night_actions jsonb DEFAULT '{}', -- 夜晚行动汇总
  day_deaths jsonb DEFAULT '[]', -- 白天死亡名单
  vote_result jsonb, -- 投票结果
  winner text, -- 'werewolf', 'villager', null
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_game_states_room ON game_states(room_id);
CREATE INDEX idx_game_states_phase ON game_states(current_phase);

-- ============================================================================
-- 5. 夜晚行动记录表
-- ============================================================================

CREATE TYPE action_type AS ENUM ('guard', 'kill', 'save', 'poison', 'check');

CREATE TABLE IF NOT EXISTS night_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES game_rooms(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  player_id uuid REFERENCES room_players(id) ON DELETE CASCADE,
  action_type action_type NOT NULL,
  target_position integer, -- 目标玩家位置
  result jsonb, -- 行动结果（如预言家验人结果）
  created_at timestamptz DEFAULT now(),
  UNIQUE(room_id, round_number, player_id, action_type) -- 每个玩家每回合每种行动只能执行一次
);

CREATE INDEX idx_night_actions_room_round ON night_actions(room_id, round_number);
CREATE INDEX idx_night_actions_player ON night_actions(player_id);

-- ============================================================================
-- 6. 投票记录表
-- ============================================================================

CREATE TYPE vote_type AS ENUM ('exile', 'sheriff', 'pk');

CREATE TABLE IF NOT EXISTS vote_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES game_rooms(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  vote_type vote_type NOT NULL,
  voter_id uuid REFERENCES room_players(id) ON DELETE CASCADE,
  target_position integer NOT NULL, -- 投票目标位置
  vote_weight numeric DEFAULT 1.0, -- 投票权重（警长1.5票）
  created_at timestamptz DEFAULT now(),
  UNIQUE(room_id, round_number, vote_type, voter_id) -- 每个玩家每回合每种投票只能投一次
);

CREATE INDEX idx_vote_records_room_round ON vote_records(room_id, round_number);
CREATE INDEX idx_vote_records_voter ON vote_records(voter_id);

-- ============================================================================
-- 7. 游戏日志表
-- ============================================================================

CREATE TYPE log_type AS ENUM ('system', 'action', 'speech', 'vote', 'death', 'win');

CREATE TABLE IF NOT EXISTS game_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES game_rooms(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  phase game_phase NOT NULL,
  log_type log_type NOT NULL,
  player_id uuid REFERENCES room_players(id) ON DELETE SET NULL,
  content text NOT NULL,
  metadata jsonb, -- 额外信息
  is_public boolean DEFAULT true, -- 是否公开（某些信息只对特定玩家可见）
  visible_to uuid[], -- 可见玩家ID列表（NULL表示所有人可见）
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_game_logs_room ON game_logs(room_id, round_number);
CREATE INDEX idx_game_logs_type ON game_logs(log_type);

-- ============================================================================
-- 8. 更新现有表
-- ============================================================================

-- 更新 werewolf_personas 表，添加AI模型关联
ALTER TABLE werewolf_personas 
ADD COLUMN IF NOT EXISTS default_ai_model_id uuid REFERENCES ai_model_configs(id) ON DELETE SET NULL;

-- 更新 game_sessions 表，添加房间关联
ALTER TABLE game_sessions 
ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES game_rooms(id) ON DELETE CASCADE;

-- ============================================================================
-- 9. 辅助函数
-- ============================================================================

-- 生成唯一房间号
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    -- 生成6位数字房间号
    code := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
    
    -- 检查是否已存在
    SELECT EXISTS(SELECT 1 FROM game_rooms WHERE room_code = code) INTO exists;
    
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- 检查房间是否已满
CREATE OR REPLACE FUNCTION is_room_full(room_uuid uuid)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE
  room_record RECORD;
  player_count integer;
BEGIN
  SELECT * INTO room_record FROM game_rooms WHERE id = room_uuid;
  
  IF NOT FOUND THEN
    RETURN true;
  END IF;
  
  SELECT COUNT(*) INTO player_count FROM room_players WHERE room_id = room_uuid;
  
  RETURN player_count >= room_record.player_count;
END;
$$;

-- 分配角色
CREATE OR REPLACE FUNCTION assign_roles(room_uuid uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  config_record RECORD;
  players_record RECORD[];
  roles text[];
  role_assignments jsonb := '{}';
  i integer := 1;
BEGIN
  -- 获取房间配置
  SELECT gc.* INTO config_record 
  FROM game_rooms gr
  JOIN werewolf_game_configs gc ON gr.config_id = gc.id
  WHERE gr.id = room_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '房间配置不存在';
  END IF;
  
  -- 构建角色数组
  roles := ARRAY[]::text[];
  
  -- 添加狼人
  FOR i IN 1..(config_record.role_config->>'werewolf')::integer LOOP
    roles := array_append(roles, 'werewolf');
  END LOOP;
  
  -- 添加村民
  FOR i IN 1..(config_record.role_config->>'villager')::integer LOOP
    roles := array_append(roles, 'villager');
  END LOOP;
  
  -- 添加预言家
  IF (config_record.role_config->>'seer')::integer > 0 THEN
    roles := array_append(roles, 'seer');
  END IF;
  
  -- 添加女巫
  IF (config_record.role_config->>'witch')::integer > 0 THEN
    roles := array_append(roles, 'witch');
  END IF;
  
  -- 添加猎人
  IF (config_record.role_config->>'hunter')::integer > 0 THEN
    roles := array_append(roles, 'hunter');
  END IF;
  
  -- 添加守卫
  IF (config_record.role_config->>'guard')::integer > 0 THEN
    roles := array_append(roles, 'guard');
  END IF;
  
  -- 打乱角色数组
  roles := (SELECT array_agg(role ORDER BY random()) FROM unnest(roles) AS role);
  
  -- 分配角色给玩家
  i := 1;
  FOR players_record IN 
    SELECT id, position FROM room_players 
    WHERE room_id = room_uuid 
    ORDER BY position
  LOOP
    UPDATE room_players 
    SET role = roles[i] 
    WHERE id = players_record.id;
    
    role_assignments := jsonb_set(
      role_assignments, 
      ARRAY[players_record.position::text], 
      to_jsonb(roles[i])
    );
    
    i := i + 1;
  END LOOP;
  
  RETURN role_assignments;
END;
$$;

-- 结算夜晚行动
CREATE OR REPLACE FUNCTION resolve_night_actions(room_uuid uuid, round_num integer)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  guard_target integer;
  kill_target integer;
  save_used boolean := false;
  poison_target integer;
  deaths integer[] := ARRAY[]::integer[];
  result jsonb := '{}';
BEGIN
  -- 获取守卫目标
  SELECT target_position INTO guard_target
  FROM night_actions
  WHERE room_id = room_uuid 
    AND round_number = round_num 
    AND action_type = 'guard'
  LIMIT 1;
  
  -- 获取狼人击杀目标
  SELECT target_position INTO kill_target
  FROM night_actions
  WHERE room_id = room_uuid 
    AND round_number = round_num 
    AND action_type = 'kill'
  GROUP BY target_position
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  -- 获取女巫救人
  SELECT EXISTS(
    SELECT 1 FROM night_actions
    WHERE room_id = room_uuid 
      AND round_number = round_num 
      AND action_type = 'save'
      AND target_position = kill_target
  ) INTO save_used;
  
  -- 获取女巫毒人
  SELECT target_position INTO poison_target
  FROM night_actions
  WHERE room_id = room_uuid 
    AND round_number = round_num 
    AND action_type = 'poison'
  LIMIT 1;
  
  -- 判定死亡
  -- 1. 狼人击杀
  IF kill_target IS NOT NULL THEN
    -- 同守同救判定（奶穿肠）
    IF guard_target = kill_target AND save_used THEN
      deaths := array_append(deaths, kill_target);
    -- 只守护
    ELSIF guard_target = kill_target AND NOT save_used THEN
      -- 不死
      NULL;
    -- 只救
    ELSIF guard_target != kill_target AND save_used THEN
      -- 不死
      NULL;
    -- 既不守也不救
    ELSE
      deaths := array_append(deaths, kill_target);
    END IF;
  END IF;
  
  -- 2. 女巫毒人
  IF poison_target IS NOT NULL THEN
    deaths := array_append(deaths, poison_target);
  END IF;
  
  -- 更新玩家状态
  UPDATE room_players
  SET status = 'dead'
  WHERE room_id = room_uuid 
    AND position = ANY(deaths);
  
  -- 构建结果
  result := jsonb_build_object(
    'guard_target', guard_target,
    'kill_target', kill_target,
    'save_used', save_used,
    'poison_target', poison_target,
    'deaths', to_jsonb(deaths)
  );
  
  RETURN result;
END;
$$;

-- 检查游戏胜利条件
CREATE OR REPLACE FUNCTION check_win_condition(room_uuid uuid)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  werewolf_count integer;
  villager_count integer;
  god_count integer;
BEGIN
  -- 统计存活的狼人数量
  SELECT COUNT(*) INTO werewolf_count
  FROM room_players
  WHERE room_id = room_uuid 
    AND status = 'alive' 
    AND role = 'werewolf';
  
  -- 统计存活的平民数量
  SELECT COUNT(*) INTO villager_count
  FROM room_players
  WHERE room_id = room_uuid 
    AND status = 'alive' 
    AND role = 'villager';
  
  -- 统计存活的神职数量
  SELECT COUNT(*) INTO god_count
  FROM room_players
  WHERE room_id = room_uuid 
    AND status = 'alive' 
    AND role IN ('seer', 'witch', 'hunter', 'guard');
  
  -- 判定胜利条件
  IF werewolf_count = 0 THEN
    RETURN 'villager'; -- 好人胜利
  ELSIF villager_count = 0 OR god_count = 0 THEN
    RETURN 'werewolf'; -- 狼人胜利
  ELSE
    RETURN NULL; -- 游戏继续
  END IF;
END;
$$;

-- ============================================================================
-- 10. Row Level Security (RLS)
-- ============================================================================

-- AI模型配置表RLS
ALTER TABLE ai_model_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可以查看自己的AI配置" ON ai_model_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的AI配置" ON ai_model_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的AI配置" ON ai_model_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的AI配置" ON ai_model_configs
  FOR DELETE USING (auth.uid() = user_id);

-- 游戏房间表RLS
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所有人可以查看公开房间" ON game_rooms
  FOR SELECT USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "用户可以创建房间" ON game_rooms
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "房主可以更新房间" ON game_rooms
  FOR UPDATE USING (auth.uid() = creator_id);

-- 房间玩家表RLS
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "玩家可以查看同房间的其他玩家" ON room_players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM room_players rp
      WHERE rp.room_id = room_players.room_id 
        AND rp.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可以加入房间" ON room_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 游戏状态表RLS
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "玩家可以查看游戏状态" ON game_states
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM room_players
      WHERE room_players.room_id = game_states.room_id 
        AND room_players.user_id = auth.uid()
    )
  );

-- 夜晚行动记录表RLS
ALTER TABLE night_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "玩家可以查看自己的行动" ON night_actions
  FOR SELECT USING (
    player_id IN (
      SELECT id FROM room_players WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "玩家可以记录自己的行动" ON night_actions
  FOR INSERT WITH CHECK (
    player_id IN (
      SELECT id FROM room_players WHERE user_id = auth.uid()
    )
  );

-- 投票记录表RLS
ALTER TABLE vote_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "玩家可以查看投票记录" ON vote_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM room_players
      WHERE room_players.room_id = vote_records.room_id 
        AND room_players.user_id = auth.uid()
    )
  );

CREATE POLICY "玩家可以投票" ON vote_records
  FOR INSERT WITH CHECK (
    voter_id IN (
      SELECT id FROM room_players WHERE user_id = auth.uid()
    )
  );

-- 游戏日志表RLS
ALTER TABLE game_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "玩家可以查看公开日志" ON game_logs
  FOR SELECT USING (
    is_public = true OR
    auth.uid() = ANY(visible_to) OR
    EXISTS (
      SELECT 1 FROM room_players
      WHERE room_players.room_id = game_logs.room_id 
        AND room_players.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 11. 触发器
-- ============================================================================

-- 更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_ai_model_configs_updated_at
  BEFORE UPDATE ON ai_model_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_game_states_updated_at
  BEFORE UPDATE ON game_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 更新房间当前玩家数
CREATE OR REPLACE FUNCTION update_room_player_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE game_rooms 
    SET current_players = current_players + 1 
    WHERE id = NEW.room_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE game_rooms 
    SET current_players = current_players - 1 
    WHERE id = OLD.room_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_room_player_count_trigger
  AFTER INSERT OR DELETE ON room_players
  FOR EACH ROW EXECUTE FUNCTION update_room_player_count();
