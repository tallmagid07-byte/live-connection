-- ============================================================
-- Autorise chaque utilisateur à uploader/mettre à jour sa propre
-- photo de profil dans le bucket "avatars" (à créer manuellement
-- dans Storage avant d'exécuter ce script, avec l'option "Public bucket")
-- ============================================================

create policy "Les photos de profil sont visibles par tous"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Un utilisateur peut uploader sa propre photo"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Un utilisateur peut remplacer sa propre photo"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
