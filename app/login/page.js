"use client";

import { createClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const supabase = createClient();

  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "spotify",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "user-read-currently-playing user-read-playback-state",
      },
    });
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-10">
        <span className="absolute inset-0 rounded-full border border-coral/50 animate-pulseRing" />
        <span className="absolute inset-0 rounded-full border border-coral/30 animate-pulseRing [animation-delay:0.6s]" />
        <div className="relative w-20 h-20 rounded-full bg-surface2 border border-line flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M4 14v-4a8 8 0 0116 0v4M4 14a2 2 0 002 2h1v-6H6a2 2 0 00-2 2zM20 14a2 2 0 01-2 2h-1v-6h1a2 2 0 012 2z" stroke="#EDEAF6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      <p className="uppercase tracking-[0.3em] text-xs text-muted mb-4">Listen</p>
      <h1 className="font-display italic text-4xl md:text-5xl leading-tight max-w-xl">
        Se comprendre <span className="not-italic text-coral">sans parler</span>,
        juste en partageant une chanson.
      </h1>
      <p className="text-muted mt-6 max-w-md">
        Pas de messages. Pas de likes. Connectez votre Spotify et laissez
        votre musique dire ce que les mots ne disent pas.
      </p>

      <button
        onClick={handleLogin}
        className="mt-10 inline-flex items-center gap-3 bg-[#1DB954] text-night font-medium px-6 py-3 rounded-full hover:brightness-110 transition"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.59 14.4a.62.62 0 01-.85.2c-2.33-1.42-5.26-1.75-8.72-.96a.62.62 0 11-.28-1.22c3.79-.87 7.04-.5 9.65 1.1.3.18.4.56.2.88zm1.22-2.72a.78.78 0 01-1.07.26c-2.67-1.64-6.74-2.12-9.9-1.16a.78.78 0 11-.45-1.49c3.6-1.09 8.08-.56 11.16 1.32.37.23.49.72.26 1.07zm.11-2.83C14.98 8.9 9.08 8.7 5.7 9.71a.94.94 0 11-.54-1.8c3.86-1.17 10.36-.94 14.44 1.46a.94.94 0 11-.96 1.62z"/>
        </svg>
        Se connecter avec Spotify
      </button>

      <p className="text-xs text-muted mt-8 max-w-sm">
        Nous lisons uniquement le titre en cours d'écoute. Aucun message,
        aucune position GPS précise — seulement votre ville, si vous choisissez de la partager.
      </p>
    </main>
  );
}
