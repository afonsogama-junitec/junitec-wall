-- Salas partilhadas. Corre depois de private-inbox.sql.
alter table public.cards add column if not exists room text;
alter table public.cards add constraint cards_room_check check (room is null or char_length(room) between 8 and 40);
create index if not exists cards_room_idx on public.cards (room);

drop function if exists public.publish_card(uuid, text, text, text, text, text);
create or replace function public.publish_card(
  p_owner uuid, p_name text, p_emoji text, p_tech text, p_fact text, p_color text, p_room text default null
) returns public.cards
language plpgsql security definer set search_path = ''
as $$
declare r public.cards;
begin
  if p_owner is null then raise exception 'owner em falta'; end if;
  if (select count(*) from public.cards) >= 500 then raise exception 'mural cheio'; end if;
  if (select count(*) from public.cards where owner = p_owner) >= 50 then raise exception 'limite de cartoes atingido'; end if;
  insert into public.cards (owner, room, name, emoji, tech, fact, color)
  values (p_owner, nullif(p_room, ''), p_name, coalesce(nullif(p_emoji, ''), '🙂'), coalesce(p_tech, ''),
          coalesce(p_fact, ''), coalesce(p_color, '#6c5ce7'))
  returning * into r;
  return r;
end $$;

-- Devolve os cartões de uma sala SEM o identificador do autor:
-- esse identificador dá acesso aos cartões privados dessa pessoa.
create or replace function public.room_cards(p_room text)
returns table (id bigint, name text, emoji text, tech text, fact text, color text, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  if p_room is null or char_length(p_room) < 8 then raise exception 'sala invalida'; end if;
  return query
    select c.id, c.name, c.emoji, c.tech, c.fact, c.color, c.created_at
    from public.cards c where c.room = p_room order by c.created_at desc;
end $$;

revoke execute on function public.publish_card(uuid, text, text, text, text, text, text) from public;
revoke execute on function public.room_cards(text) from public;
grant execute on function public.publish_card(uuid, text, text, text, text, text, text) to anon;
grant execute on function public.room_cards(text) to anon;
