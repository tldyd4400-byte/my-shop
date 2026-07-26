create table if not exists ai_visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  path text not null check (char_length(path) between 1 and 2048),
  user_agent text not null check (char_length(user_agent) between 1 and 512),
  bot_id text not null,
  bot_name text not null,
  vendor text not null,
  purpose text not null check (purpose in ('search_indexing', 'training', 'realtime_citation', 'other'))
);

create index if not exists ai_visits_created_at_idx
  on ai_visits (created_at desc);
create index if not exists ai_visits_purpose_created_at_idx
  on ai_visits (purpose, created_at desc);
create index if not exists ai_visits_bot_created_at_idx
  on ai_visits (bot_id, created_at desc);
