-- Caixa de entrada privada. Cola no SQL Editor do Supabase e carrega em Run.
-- Depois do Run, faz o passo do código de admin (mais abaixo).

alter table public.cards add column if not exists owner uuid;

-- O público deixa de poder ler ou escrever diretamente na tabela.
drop policy if exists "ler cartoes" on public.cards;
drop policy if exists "publicar cartoes" on public.cards;
revoke all on public.cards from anon;
alter publication supabase_realtime drop table public.cards;

-- Código de admin guardado num schema que a API pública não expõe.
create schema if not exists private;
create table if not exists private.admin (
  code text primary key check (char_length(code) >= 8)
);
alter table private.admin enable row level security;

-- Publicar: valida e limita (500 no total, 5 por pessoa).
create or replace function public.publish_card(
  p_owner uuid, p_name text, p_emoji text, p_tech text, p_fact text, p_color text
) returns public.cards
language plpgsql security definer set search_path = ''
as $$
declare r public.cards;
begin
  if p_owner is null then raise exception 'owner em falta'; end if;
  if (select count(*) from public.cards) >= 500 then raise exception 'mural cheio'; end if;
  if (select count(*) from public.cards where owner = p_owner) >= 5 then
    raise exception 'limite de cartoes atingido';
  end if;
  insert into public.cards (owner, name, emoji, tech, fact, color)
  values (p_owner, p_name, coalesce(nullif(p_emoji, ''), '🙂'), coalesce(p_tech, ''),
          coalesce(p_fact, ''), coalesce(p_color, '#6c5ce7'))
  returning * into r;
  return r;
end $$;

-- Cada pessoa só vê os cartões do seu próprio identificador (aleatório, guardado no browser).
create or replace function public.my_cards(p_owner uuid)
returns setof public.cards
language sql security definer set search_path = ''
as $$ select * from public.cards where owner = p_owner order by created_at desc $$;

-- Só quem souber o código de admin vê todos.
create or replace function public.all_cards(p_code text)
returns setof public.cards
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from private.admin where code = p_code) then
    raise exception 'codigo invalido';
  end if;
  return query select * from public.cards order by created_at desc;
end $$;

revoke execute on function public.publish_card(uuid, text, text, text, text, text) from public;
revoke execute on function public.my_cards(uuid) from public;
revoke execute on function public.all_cards(text) from public;
grant execute on function public.publish_card(uuid, text, text, text, text, text) to anon;
grant execute on function public.my_cards(uuid) to anon;
grant execute on function public.all_cards(text) to anon;

-- PASSO FINAL, noutra execução: escolhe o TEU código (mínimo 8 caracteres) e corre só esta linha.
-- Não o escrevas no código nem no chat.
-- insert into private.admin (code) values ('troca-isto-por-um-codigo-teu');
