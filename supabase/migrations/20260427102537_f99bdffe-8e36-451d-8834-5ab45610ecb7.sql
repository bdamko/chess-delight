create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pgn text not null,
  result text not null,
  played_at timestamptz not null default now()
);

alter table public.games enable row level security;

create policy "Users can view their own games"
  on public.games for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own games"
  on public.games for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own games"
  on public.games for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists games_user_played_idx
  on public.games (user_id, played_at desc);