create table if not exists online_reviews (
  source_url text primary key check (char_length(source_url) between 1 and 2048),
  title text not null check (char_length(title) between 1 and 500),
  description text not null check (char_length(description) between 1 and 2000),
  blogger_name text not null check (char_length(blogger_name) between 1 and 200),
  blogger_url text not null check (char_length(blogger_url) between 1 and 2048),
  published_on date not null,
  discovered_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  moderated_at timestamptz
);

create index if not exists online_reviews_status_published_idx
  on online_reviews (status, published_on desc);
create index if not exists online_reviews_status_discovered_idx
  on online_reviews (status, discovered_at desc);

create table if not exists online_review_sync_runs (
  id bigint generated always as identity primary key,
  started_at timestamptz not null,
  finished_at timestamptz,
  status text not null check (status in ('running', 'success', 'failed')),
  discovered_count integer not null default 0 check (discovered_count >= 0),
  error_code text check (error_code is null or char_length(error_code) between 1 and 100)
);

create index if not exists online_review_sync_runs_started_idx
  on online_review_sync_runs (started_at desc);
