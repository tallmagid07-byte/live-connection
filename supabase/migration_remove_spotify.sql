-- ============================================================
-- Migration : retirer Spotify, passer en saisie manuelle
-- À exécuter dans : Dashboard Supabase > SQL Editor > New query
-- (à faire une seule fois, sur votre projet Supabase déjà existant)
-- ============================================================

-- On n'a plus besoin de stocker de tokens Spotify
drop table if exists public.spotify_tokens;

-- On retire la colonne spotify_id du profil (plus utilisée)
alter table public.profiles drop column if exists spotify_id;

-- On retire les colonnes liées à Spotify dans now_playing (plus utilisées)
alter table public.now_playing drop column if exists album_art;
alter table public.now_playing drop column if exists track_url;
alter table public.now_playing drop column if exists is_playing;

-- On ajoute la possibilité de supprimer sa propre écoute (bouton "j'ai arrêté d'écouter")
drop policy if exists "Un utilisateur peut retirer sa propre écoute" on public.now_playing;
create policy "Un utilisateur peut retirer sa propre écoute"
  on public.now_playing for delete
  using (auth.uid() = user_id);

-- La fonction de création de profil n'a plus besoin de lire les métadonnées Spotify
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;
