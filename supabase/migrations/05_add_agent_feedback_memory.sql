/*
# Agent feedback, leaderboard, and memory scaffold

Adds the structured tables needed for:
- agent picks per session
- post-session reviews and suggestions
- leaderboard aggregates
- RAG-friendly memory chunks + embeddings
*/

create extension if not exists vector;

create table if not exists agent_profiles (
  id text primary key,
  display_name text not null,
  title text,
  model_name text,
  preview_image text,
  supported_modes text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists game_session_agent_picks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions(id) on delete cascade,
  user_id uuid not null references user_profiles(id) on delete cascade,
  agent_id text not null references agent_profiles(id) on delete cascade,
  slot text not null check (slot in ('lead', 'bench')),
  game_mode text not null check (game_mode in ('werewolf', 'script_murder', 'chat', 'mc')),
  created_at timestamptz not null default now()
);

create table if not exists agent_reviews (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null references agent_profiles(id) on delete cascade,
  user_id uuid not null references user_profiles(id) on delete cascade,
  session_id uuid references game_sessions(id) on delete set null,
  game_mode text not null check (game_mode in ('werewolf', 'script_murder', 'chat', 'mc')),
  overall_score numeric(3, 2) not null check (overall_score between 1 and 5),
  chemistry_score numeric(3, 2) not null check (chemistry_score between 1 and 5),
  deduction_score numeric(3, 2) not null check (deduction_score between 1 and 5),
  clutch_score numeric(3, 2) not null check (clutch_score between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists agent_review_suggestions (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references agent_reviews(id) on delete cascade,
  agent_id text not null references agent_profiles(id) on delete cascade,
  user_id uuid not null references user_profiles(id) on delete cascade,
  session_id uuid references game_sessions(id) on delete set null,
  game_mode text not null check (game_mode in ('werewolf', 'script_murder', 'chat', 'mc')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists agent_rating_aggregates (
  agent_id text primary key references agent_profiles(id) on delete cascade,
  overall_score numeric(4, 2) not null default 0,
  chemistry_score numeric(4, 2) not null default 0,
  deduction_score numeric(4, 2) not null default 0,
  clutch_score numeric(4, 2) not null default 0,
  review_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists agent_memory_chunks (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null references agent_profiles(id) on delete cascade,
  user_id uuid references user_profiles(id) on delete set null,
  session_id uuid references game_sessions(id) on delete set null,
  game_mode text check (game_mode in ('werewolf', 'script_murder', 'chat', 'mc')),
  source_type text not null check (source_type in ('review', 'suggestion', 'session_note')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists agent_memory_embeddings (
  memory_chunk_id uuid primary key references agent_memory_chunks(id) on delete cascade,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index if not exists idx_game_session_agent_picks_session on game_session_agent_picks(session_id);
create index if not exists idx_game_session_agent_picks_user on game_session_agent_picks(user_id);
create index if not exists idx_game_session_agent_picks_agent on game_session_agent_picks(agent_id);

create index if not exists idx_agent_reviews_agent on agent_reviews(agent_id, created_at desc);
create index if not exists idx_agent_reviews_user on agent_reviews(user_id, created_at desc);
create index if not exists idx_agent_reviews_mode on agent_reviews(game_mode, created_at desc);

create index if not exists idx_agent_review_suggestions_agent on agent_review_suggestions(agent_id, created_at desc);
create index if not exists idx_agent_memory_chunks_agent on agent_memory_chunks(agent_id, created_at desc);
create index if not exists idx_agent_memory_chunks_user_agent on agent_memory_chunks(user_id, agent_id, created_at desc);
create index if not exists idx_agent_memory_chunks_mode on agent_memory_chunks(game_mode, created_at desc);

create index if not exists idx_agent_memory_embeddings_vector
  on agent_memory_embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace view agent_leaderboard_v1 as
select
  p.id as agent_id,
  p.display_name,
  p.title,
  p.model_name,
  p.preview_image,
  p.supported_modes,
  coalesce(avg(r.overall_score), 0)::numeric(4, 2) as overall_score,
  coalesce(avg(r.chemistry_score), 0)::numeric(4, 2) as chemistry_score,
  coalesce(avg(r.deduction_score), 0)::numeric(4, 2) as deduction_score,
  coalesce(avg(r.clutch_score), 0)::numeric(4, 2) as clutch_score,
  count(r.id)::integer as review_count
from agent_profiles p
left join agent_reviews r on r.agent_id = p.id
group by p.id, p.display_name, p.title, p.model_name, p.preview_image, p.supported_modes;

insert into agent_profiles (id, display_name, title, model_name, preview_image, supported_modes)
values
  ('haru', 'Haru', 'Shotcaller', 'haru', '/agent-gallery/haru.png', array['chat', 'werewolf']),
  ('hiyori', 'Hiyori', 'Soft Analyst', 'hiyori', '/agent-gallery/hiyori.png', array['chat', 'werewolf', 'script_murder']),
  ('mao-pro', 'Mao Pro', 'Closer', 'mao_pro', '/agent-gallery/mao.png', array['chat', 'werewolf']),
  ('mark', 'Mark', 'Cold Reader', 'mark', '/agent-gallery/mark.png', array['chat', 'werewolf', 'script_murder']),
  ('natori', 'Natori', 'Warm Lead', 'natori', '/agent-gallery/natori.png', array['chat', 'script_murder']),
  ('ren', 'Ren', 'Main Companion', 'ren', '/agent-gallery/ren.png', array['chat', 'werewolf', 'script_murder', 'mc']),
  ('rice', 'Rice', 'Story Reader', 'rice', '/agent-gallery/rice.png', array['chat', 'script_murder']),
  ('shizuku', 'Shizuku', 'Role Actor', 'shizuku', '/agent-gallery/shizuku.png', array['chat', 'script_murder']),
  ('wanko', 'Wanko', 'Hype Bench', 'wanko', '/agent-gallery/wanko.png', array['chat', 'werewolf', 'mc'])
on conflict (id) do update set
  display_name = excluded.display_name,
  title = excluded.title,
  model_name = excluded.model_name,
  preview_image = excluded.preview_image,
  supported_modes = excluded.supported_modes,
  updated_at = now();
