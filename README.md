# Live Connection 🎵

Se comprendre sans parler, juste en partageant une chanson.

MVP construit avec **Next.js 14** + **Supabase** (auth Spotify, base de données, temps réel) + **Vercel** (hébergement).

## Ce que fait cette v1

- Connexion via Spotify (aucun mot de passe à créer)
- Chaque utilisateur voit un feed en direct : qui écoute quoi, groupé par ville
- Les mises à jour arrivent en temps réel (Supabase Realtime)
- La ville est saisie manuellement (pas de GPS précis, pour la vie privée)

## 1. Créer le projet Supabase

1. Allez sur [supabase.com](https://supabase.com) → **New project**
2. Une fois créé, allez dans **Project Settings → API** et notez :
   - `Project URL` → deviendra `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → deviendra `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Allez dans **SQL Editor → New query**, collez le contenu du fichier
   `supabase/schema.sql` de ce projet, puis cliquez **Run**.

## 2. Créer une app Spotify (pour l'OAuth)

1. Allez sur [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. **Create app**
   - Redirect URI : `https://<VOTRE-PROJET>.supabase.co/auth/v1/callback`
     (remplacez par l'URL exacte de votre projet Supabase)
3. Notez le **Client ID** et le **Client Secret**

## 3. Activer Spotify dans Supabase Auth

1. Dans Supabase : **Authentication → Providers → Spotify**
2. Activez-le, collez le Client ID et Client Secret de l'étape 2
3. Enregistrez

## 4. Variables d'environnement du projet

Copiez `.env.example` en `.env.local` et remplissez :

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
```

(Les deux dernières servent à rafraîchir le token Spotify côté serveur —
ce sont les mêmes valeurs que celles créées à l'étape 2.)

## 5. Lancer en local

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## 6. Pousser sur GitHub

```bash
git init
git add .
git commit -m "Live Connection - v1"
git branch -M main
git remote add origin https://github.com/<votre-compte>/live-connection.git
git push -u origin main
```

## 7. Déployer sur Vercel

1. Sur [vercel.com](https://vercel.com) → **Add New → Project**
2. Importez le dépôt GitHub `live-connection`
3. Dans **Environment Variables**, ajoutez les 5 variables du `.env.local`
   (remplacez `NEXT_PUBLIC_SITE_URL` par l'URL Vercel finale, ex.
   `https://live-connection.vercel.app`)
4. Déployez

⚠️ Une fois déployé, retournez dans votre app Spotify (étape 2) et
ajoutez aussi l'URL de callback Supabase — elle ne change pas, donc
rien à faire ici normalement.

## Prochaines étapes possibles

- Carte des personnes qui écoutent près de chez vous (par ville)
- "Rejoindre" l'écoute de quelqu'un en un clic
- Historique des morceaux partagés / statistiques d'émotions
- Notifications quand un ami commence à écouter quelque chose
