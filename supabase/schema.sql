-- Tabela do mural. Cola isto no SQL Editor do Supabase e carrega em Run.
create table public.cards (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 30),
  emoji text not null default '🙂' check (char_length(emoji) between 1 and 8),
  tech text not null default '' check (char_length(tech) <= 24),
  fact text not null default '' check (char_length(fact) <= 2500),
  color text not null default '#6c5ce7' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now()
);

alter table public.cards enable row level security;

-- O público só pode ler e publicar. Nunca editar nem apagar.
grant select, insert on public.cards to anon;
create policy "ler cartoes" on public.cards for select to anon using (true);
create policy "publicar cartoes" on public.cards for insert to anon
  with check ((select count(*) from public.cards) < 500);

-- Atualizações em tempo real
alter publication supabase_realtime add table public.cards;
