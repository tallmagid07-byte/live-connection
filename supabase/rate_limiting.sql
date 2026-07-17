-- ============================================================
-- Anti-spam : limite le nombre d'actions par minute et par utilisateur
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- Fonction générique : bloque l'insertion si l'utilisateur a déjà fait
-- plus de `max_count` actions dans la dernière minute sur cette table.
create or replace function public.enforce_rate_limit()
returns trigger as $$
declare
  recent_count int;
  max_count int;
  user_column text;
begin
  -- Limites différentes selon la table concernée
  if tg_table_name = 'messages' then
    max_count := 30;   -- 30 messages / minute
    user_column := 'sender_id';
  elsif tg_table_name = 'friendships' then
    max_count := 15;   -- 15 demandes d'amis / minute
    user_column := 'requester_id';
  elsif tg_table_name = 'reactions' then
    max_count := 30;   -- 30 réactions / minute
    user_column := 'from_user_id';
  else
    return new;
  end if;

  if tg_table_name = 'messages' then
    select count(*) into recent_count from public.messages
      where sender_id = new.sender_id and created_at > now() - interval '1 minute';
  elsif tg_table_name = 'friendships' then
    select count(*) into recent_count from public.friendships
      where requester_id = new.requester_id and created_at > now() - interval '1 minute';
  elsif tg_table_name = 'reactions' then
    select count(*) into recent_count from public.reactions
      where from_user_id = new.from_user_id and created_at > now() - interval '1 minute';
  end if;

  if recent_count >= max_count then
    raise exception 'Trop d''actions en peu de temps, réessayez dans un instant.';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists rate_limit_messages on public.messages;
create trigger rate_limit_messages
  before insert on public.messages
  for each row execute procedure public.enforce_rate_limit();

drop trigger if exists rate_limit_friendships on public.friendships;
create trigger rate_limit_friendships
  before insert on public.friendships
  for each row execute procedure public.enforce_rate_limit();

drop trigger if exists rate_limit_reactions on public.reactions;
create trigger rate_limit_reactions
  before insert on public.reactions
  for each row execute procedure public.enforce_rate_limit();
