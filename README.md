# Listen 🎵

Se comprendre sans parler, juste en partageant une chanson.

MVP construit avec **Next.js 14** + **Supabase** (auth par email, base de données, temps réel) + **Vercel** (hébergement).

## Ce que fait cette v1

- Connexion par email / mot de passe (aucun compte tiers requis)
- Chaque utilisateur partage manuellement le titre qu'il écoute
- Un feed en direct montre qui écoute quoi, groupé par ville
- Les mises à jour arrivent en temps réel (Supabase Realtime)
- La ville est saisie manuellement (pas de GPS précis, pour la vie privée)

## Si vous avez déjà un projet Supabase avec l'ancienne version (Spotify)

Exécutez le fichier `supabase/migration_remove_spotify.sql` dans le
**SQL Editor** de Supabase — il nettoie l'ancienne structure (tokens
Spotify, colonnes inutiles) sans perdre vos données. Sinon, si vous
partez de zéro, utilisez simplement `supabase/schema.sql`.

## 1. Créer le projet Supabase (si pas déjà fait)

1. Allez sur [supabase.com](https://supabase.com) → **New project**
2. Une fois créé, allez dans **Project Settings → API** et notez :
   - `Project URL` → deviendra `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → deviendra `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Allez dans **SQL Editor → New query**, collez le contenu du fichier
   `supabase/schema.sql`, puis cliquez **Run**.

## 2. Configurer l'authentification par email

Par défaut, Supabase demande une confirmation par email avant de
pouvoir se connecter — c'est déjà activé, rien à faire. Si vous
voulez simplifier les tests (pas d'email de confirmation à attendre) :

1. Dans Supabase : **Authentication → Providers → Email**
2. Désactivez **"Confirm email"**
3. Enregistrez

## 3. Variables d'environnement du projet

Copiez `.env.example` en `.env.local` et remplissez :

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 4. Lancer en local

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## 5. Pousser sur GitHub

```bash
git add .
git commit -m "Passage en saisie manuelle, sans Spotify"
git push
```

## 6. Déployer sur Vercel

1. Sur [vercel.com](https://vercel.com) → **Add New → Project**
2. Importez le dépôt GitHub `live-connection`
3. Dans **Environment Variables**, ajoutez les 3 variables du `.env.local`
   (remplacez `NEXT_PUBLIC_SITE_URL` par l'URL Vercel finale, ex.
   `https://listen.vercel.app`)
4. Déployez

## Prochaines étapes possibles

- Carte des personnes qui écoutent près de chez vous (par ville)
- "Rejoindre" l'écoute de quelqu'un en un clic
- Historique des morceaux partagés / statistiques d'émotions
- Notifications quand un ami commence à écouter quelque chose
- Suggestion automatique de titres pendant la saisie (recherche publique Spotify, sans connexion)
