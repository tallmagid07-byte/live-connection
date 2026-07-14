-- ============================================================
-- Live Connection — schéma Supabase
-- À exécuter dans : Dashboard Supabase > SQL Editor > New query
-- ============================================================

-- Table des profils (créée automatiquement à l'inscription via Spotify)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  avatar_url text,
  city text,               -- ville/quartier saisi par l'utilisateur (pas de GPS précis)
  spotify_id text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Les profils sont visibles par tous les utilisateurs connectés"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Un utilisateur peut modifier son propre profil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Un utilisateur peut créer son propre profil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Table de ce qui est écouté en direct
create table if not exists public.now_playing (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  track_name text not null,
  artist_name text not null,
  album_art text,
  track_url text,
  is_playing boolean default true,
  updated_at timestamptz default now()
);

alter table public.now_playing enable row level security;

create policy "L'écoute en direct est visible par tous les utilisateurs connectés"
  on public.now_playing for select
  using (auth.role() = 'authenticated');

create policy "Un utilisateur peut mettre à jour sa propre écoute"
  on public.now_playing for insert
  with check (auth.uid() = user_id);

create policy "Un utilisateur peut modifier sa propre écoute"
  on public.now_playing for update
  using (auth.uid() = user_id);

-- Table des tokens Spotify (nécessaire pour interroger "en cours d'écoute" côté serveur)
create table if not exists public.spotify_tokens (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null
);

alter table public.spotify_tokens enable row level security;

create policy "Un utilisateur ne voit que ses propres tokens"
  on public.spotify_tokens for select
  using (auth.uid() = user_id);

create policy "Un utilisateur peut enregistrer ses propres tokens"
  on public.spotify_tokens for insert
  with check (auth.uid() = user_id);

create policy "Un utilisateur peut mettre à jour ses propres tokens"
  on public.spotify_tokens for update
  using (auth.uid() = user_id);

-- Active le temps réel pour le feed en direct
alter publication supabase_realtime add table public.now_playing;

-- Fonction : crée automatiquement un profil vide à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Utilisateur'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
