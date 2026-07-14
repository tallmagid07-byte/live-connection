"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(traduireErreur(error.message));
        return;
      }
      setInfo("Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.");
      setMode("signin");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(traduireErreur(error.message));
      return;
    }
    router.push("/");
    router.refresh();
  }

  function traduireErreur(message) {
    if (message.includes("Invalid login credentials")) return "Email ou mot de passe incorrect.";
    if (message.includes("User already registered")) return "Un compte existe déjà avec cet email.";
    if (message.includes("Password should be at least")) return "Le mot de passe doit faire au moins 6 caractères.";
    if (message.includes("Email not confirmed")) return "Confirmez d'abord votre email (regardez votre boîte de réception).";
    return message;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-10">
        <img src="/logo.svg" alt="Listen" className="h-24 mx-auto" />
      </div>

      <h1 className="font-display italic text-4xl md:text-5xl leading-tight max-w-xl">
        Se comprendre <span className="not-italic text-coral">sans parler</span>,
        juste en partageant une chanson.
      </h1>
      <p className="text-muted mt-6 max-w-md">
        Pas de messages. Pas de likes. Partagez ce que vous écoutez et
        laissez votre musique dire ce que les mots ne disent pas.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 w-full max-w-sm text-left">
        <label className="block text-xs uppercase tracking-widest text-muted mb-2">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-ink placeholder:text-muted/60 focus:outline-none focus:border-coral/60 mb-4"
          placeholder="vous@example.com"
        />

        <label className="block text-xs uppercase tracking-widest text-muted mb-2">Mot de passe</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-ink placeholder:text-muted/60 focus:outline-none focus:border-coral/60"
          placeholder="6 caractères minimum"
        />

        {error && <p className="text-sm text-coral mt-3">{error}</p>}
        {info && <p className="text-sm text-periwinkle mt-3">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full bg-coral text-night font-medium py-3 rounded-full hover:brightness-110 transition disabled:opacity-60"
        >
          {loading ? "Un instant…" : mode === "signup" ? "Créer mon compte" : "Se connecter"}
        </button>
      </form>

      <button
        onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setInfo(""); }}
        className="mt-5 text-sm text-muted hover:text-ink transition"
      >
        {mode === "signin" ? "Pas encore de compte ? Créez-en un" : "Déjà un compte ? Connectez-vous"}
      </button>
    </main>
  );
}
