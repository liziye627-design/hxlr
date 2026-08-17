/*
# 次元阅关游戏AI伴侣系统 - 初始数据库架构

## 1. 概述
创建游戏AI伴侣系统所需的核心表结构，包括用户配置、AI伴侣、游戏会话、战绩记录等。

## 2. 新建表

### 2.1 user_profiles（用户配置表）
- `id` (uuid, primary key): 用户唯一标识
- `nickname` (text): 用户昵称
- `avatar_url` (text): 头像URL
- `level` (integer, default: 1): 用户等级
- `experience` (integer, default: 0): 经验值
- `coins` (integer, default: 0): 游戏币
- `vip_status` (text, default: 'free'): VIP状态 (free/monthly/quarterly/yearly)
- `vip_expire_at` (timestamptz): VIP过期时间
- `created_at` (timestamptz, default: now()): 创建时间
- `updated_at` (timestamptz, default: now()): 更新时间

### 2.2 ai_companions（AI伴侣表）
- `id` (uuid, primary key): AI伴侣ID
- `name` (text, not null): 伴侣名称
- `type` (text, not null): 类型 (alpha/aqua/shadow/rookie)
- `description` (text): 描述
- `avatar_url` (text): 头像URL
- `personality` (jsonb): 性格特征JSON
- `skills` (jsonb): 技能特长JSON
- `unlock_level` (integer, default: 1): 解锁等级
- `created_at` (timestamptz, default: now()): 创建时间

### 2.3 user_companions（用户-AI伴侣关系表）
- `id` (uuid, primary key): 关系ID
- `user_id` (uuid, references user_profiles): 用户ID
- `companion_id` (uuid, references ai_companions): AI伴侣ID
- `intimacy` (integer, default: 0): 亲密度
- `games_played` (integer, default: 0): 共同游戏次数
- `unlocked_at` (timestamptz, default: now()): 解锁时间
- `last_interaction` (timestamptz): 最后互动时间

### 2.4 game_sessions（游戏会话表）
- `id` (uuid, primary key): 会话ID
- `game_type` (text, not null): 游戏类型 (werewolf/script_murder/adventure)
- `mode` (text, not null): 模式 (pve/pvp/solo/multi)
- `host_user_id` (uuid, references user_profiles): 房主ID
- `status` (text, default: 'waiting'): 状态 (waiting/playing/finished)
- `players` (jsonb): 玩家列表JSON
- `ai_companions` (jsonb): AI伴侣列表JSON
- `game_data` (jsonb): 游戏数据JSON
- `started_at` (timestamptz): 开始时间
- `finished_at` (timestamptz): 结束时间
- `created_at` (timestamptz, default: now()): 创建时间

### 2.5 game_records（游戏战绩表）
- `id` (uuid, primary key): 战绩ID
- `session_id` (uuid, references game_sessions): 会话ID
- `user_id` (uuid, references user_profiles): 用户ID
- `game_type` (text, not null): 游戏类型
- `result` (text): 结果 (win/lose/draw)
- `score` (integer, default: 0): 得分
- `role` (text): 角色
- `performance` (jsonb): 表现数据JSON
- `rewards` (jsonb): 奖励JSON
- `created_at` (timestamptz, default: now()): 创建时间

### 2.6 stories（故事库表）
- `id` (uuid, primary key): 故事ID
- `title` (text, not null): 标题
- `category` (text, not null): 分类 (mystery/horror/romance/fantasy/modern)
- `difficulty` (text, not null): 难度 (beginner/normal/hard/insane)
- `min_players` (integer, default: 2): 最少玩家数
- `max_players` (integer, default: 6): 最多玩家数
- `description` (text): 描述
- `cover_url` (text): 封面URL
- `story_data` (jsonb): 故事数据JSON
- `play_count` (integer, default: 0): 游玩次数
- `rating` (numeric, default: 0): 评分
- `is_premium` (boolean, default: false): 是否高级内容
- `created_at` (timestamptz, default: now()): 创建时间

### 2.7 rankings（排行榜表）
- `id` (uuid, primary key): 排行ID
- `user_id` (uuid, references user_profiles): 用户ID
- `ranking_type` (text, not null): 排行类型 (power/charm/cooperation)
- `score` (integer, default: 0): 分数
- `rank` (integer): 排名
- `season` (text): 赛季
- `updated_at` (timestamptz, default: now()): 更新时间

## 3. 安全策略
- 所有表不启用RLS，允许公开访问
- 通过应用层逻辑控制数据访问权限

## 4. 索引
- 为常用查询字段创建索引以提升性能
*/

-- 创建用户配置表
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text NOT NULL,
  avatar_url text,
  level integer DEFAULT 1,
  experience integer DEFAULT 0,
  coins integer DEFAULT 0,
  vip_status text DEFAULT 'free',
  vip_expire_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建AI伴侣表
CREATE TABLE IF NOT EXISTS ai_companions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  description text,
  avatar_url text,
  personality jsonb,
  skills jsonb,
  unlock_level integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- 创建用户-AI伴侣关系表
CREATE TABLE IF NOT EXISTS user_companions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  companion_id uuid REFERENCES ai_companions(id) ON DELETE CASCADE,
  intimacy integer DEFAULT 0,
  games_played integer DEFAULT 0,
  unlocked_at timestamptz DEFAULT now(),
  last_interaction timestamptz,
  UNIQUE(user_id, companion_id)
);

-- 创建游戏会话表
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type text NOT NULL,
  mode text NOT NULL,
  host_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  status text DEFAULT 'waiting',
  players jsonb,
  ai_companions jsonb,
  game_data jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 创建游戏战绩表
CREATE TABLE IF NOT EXISTS game_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  game_type text NOT NULL,
  result text,
  score integer DEFAULT 0,
  role text,
  performance jsonb,
  rewards jsonb,
  created_at timestamptz DEFAULT now()
);

-- 创建故事库表
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  difficulty text NOT NULL,
  min_players integer DEFAULT 2,
  max_players integer DEFAULT 6,
  description text,
  cover_url text,
  story_data jsonb,
  play_count integer DEFAULT 0,
  rating numeric DEFAULT 0,
  is_premium boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 创建排行榜表
CREATE TABLE IF NOT EXISTS rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  ranking_type text NOT NULL,
  score integer DEFAULT 0,
  rank integer,
  season text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, ranking_type, season)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_companions_user_id ON user_companions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companions_companion_id ON user_companions(companion_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_host_user_id ON game_sessions(host_user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_records_user_id ON game_records(user_id);
CREATE INDEX IF NOT EXISTS idx_game_records_session_id ON game_records(session_id);
CREATE INDEX IF NOT EXISTS idx_rankings_user_id ON rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_rankings_type_season ON rankings(ranking_type, season);
CREATE INDEX IF NOT EXISTS idx_stories_category ON stories(category);
CREATE INDEX IF NOT EXISTS idx_stories_difficulty ON stories(difficulty);

-- 插入初始AI伴侣数据
INSERT INTO ai_companions (name, type, description, avatar_url, personality, skills, unlock_level) VALUES
('阿尔法', 'alpha', '策略高手，逻辑清晰，善于分析局势，是你最可靠的战术伙伴', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alpha', 
 '{"traits": ["理性", "冷静", "分析型"], "style": "专业严谨"}', 
 '{"strengths": ["逻辑推理", "战术规划", "数据分析"], "weakness": "缺乏情感共鸣"}', 1),
 
('水蓝', 'aqua', '人气明星，热情活跃，善于调动气氛，让每场游戏都充满欢乐', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aqua',
 '{"traits": ["外向", "热情", "社交型"], "style": "活力四射"}',
 '{"strengths": ["气氛调动", "团队协作", "情绪感知"], "weakness": "有时过于冲动"}', 1),
 
('暗影', 'shadow', '神秘高冷，沉着冷静，深思熟虑，总能在关键时刻给出致命一击', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow',
 '{"traits": ["内敛", "神秘", "观察型"], "style": "深沉稳重"}',
 '{"strengths": ["观察入微", "心理战术", "隐藏意图"], "weakness": "不善表达"}', 5),
 
('小新', 'rookie', '萌新助手，热心肠，保护欲强，最适合新手玩家的贴心伙伴', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rookie',
 '{"traits": ["友善", "耐心", "辅助型"], "style": "温暖可爱"}',
 '{"strengths": ["新手引导", "鼓励支持", "基础教学"], "weakness": "经验不足"}', 1);

-- 插入初始故事数据
INSERT INTO stories (title, category, difficulty, min_players, max_players, description, cover_url, story_data, is_premium) VALUES
('午夜凶铃', 'horror', 'normal', 4, 6, '一个被诅咒的录像带，一段无法逃脱的命运...', 
 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400', 
 '{"intro": "深夜，一盘神秘的录像带出现在你的面前...", "chapters": 5, "clues": 12}', false),
 
('豪门秘辛', 'mystery', 'hard', 4, 6, '豪门家族的继承人离奇死亡，每个人都有嫌疑...', 
 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=400',
 '{"intro": "豪华别墅中，一场精心策划的谋杀正在上演...", "chapters": 6, "clues": 15}', false),
 
('星际迷航', 'fantasy', 'beginner', 2, 4, '在遥远的星系中，开启一段奇幻的冒险之旅', 
 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400',
 '{"intro": "宇宙飞船突然失控，你们必须找到回家的路...", "chapters": 4, "clues": 8}', false),
 
('职场风云', 'modern', 'normal', 3, 5, '大公司内部的权力斗争，谁才是最后的赢家？', 
 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
 '{"intro": "升职机会只有一个，但竞争者却有很多...", "chapters": 5, "clues": 10}', false),
 
('玫瑰之约', 'romance', 'beginner', 2, 4, '一场浪漫的邂逅，一段动人的爱情故事', 
 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400',
 '{"intro": "在巴黎的街头，命运让你们相遇...", "chapters": 4, "clues": 6}', false),
 
('深渊之谜', 'horror', 'insane', 5, 6, '最恐怖的剧本，只有最勇敢的玩家才能挑战', 
 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400',
 '{"intro": "深海研究站失去联系，你们是最后的救援队...", "chapters": 8, "clues": 20}', true);
