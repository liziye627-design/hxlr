/*
# Minecraft companion memory pipeline

Extends the existing agent memory scaffold to support:
- minecraft log ingestions
- normalized minecraft session events
- minecraft-specific memory source types
*/

alter table agent_memory_chunks
  drop constraint if exists agent_memory_chunks_source_type_check;

alter table agent_memory_chunks
  add constraint agent_memory_chunks_source_type_check
  check (
    source_type in (
      'review',
      'suggestion',
      'session_note',
      'mc_event',
      'mc_summary',
      'mc_lesson'
    )
  );

create table if not exists minecraft_log_ingestions (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null references agent_profiles(id) on delete cascade,
  user_id uuid references user_profiles(id) on delete set null,
  session_id uuid references game_sessions(id) on delete set null,
  world_id text,
  bot_profile text,
  raw_line_count integer not null default 0,
  retained_event_count integer not null default 0,
  raw_log text not null,
  created_at timestamptz not null default now()
);

create table if not exists minecraft_session_events (
  id uuid primary key default gen_random_uuid(),
  ingestion_id uuid not null references minecraft_log_ingestions(id) on delete cascade,
  agent_id text not null references agent_profiles(id) on delete cascade,
  user_id uuid references user_profiles(id) on delete set null,
  session_id uuid references game_sessions(id) on delete set null,
  world_id text,
  bot_profile text,
  event_type text not null check (
    event_type in (
      'chat',
      'join',
      'leave',
      'death',
      'craft',
      'loot',
      'combat',
      'goal',
      'warning',
      'system'
    )
  ),
  speaker text,
  content text not null,
  importance integer not null default 1 check (importance between 1 and 5),
  event_tags text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_minecraft_log_ingestions_agent
  on minecraft_log_ingestions(agent_id, created_at desc);

create index if not exists idx_minecraft_log_ingestions_session
  on minecraft_log_ingestions(session_id, created_at desc);

create index if not exists idx_minecraft_session_events_agent
  on minecraft_session_events(agent_id, created_at desc);

create index if not exists idx_minecraft_session_events_session
  on minecraft_session_events(session_id, created_at desc);

create index if not exists idx_minecraft_session_events_type
  on minecraft_session_events(event_type, created_at desc);
