"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState("");
  const [city, setCity] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
      setUsername(data?.username || "");
      setCity(data?.city || "");
    }
    load();
  }, [supabase, router]);

  async function handleSave() {
    await supabase.from("profiles").update({ username, city }).eq("id", profile.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!profile) {
    return <main className="min-h-screen flex items-center justify-center text-muted">Chargement…</main>;
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-md">
        <a href="/" className="text-sm text-muted hover:text-ink transition">← Retour au feed</a>

        <p className="font-display italic text-2xl mt-8 mb-10">Mon profil</p>

        <label className="block text-xs uppercase tracking-widest text-muted mb-2">
          Nom affiché
        </label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Votre prénom ou pseudo"
          className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-ink placeholder:text-muted/60 focus:outline-none focus:border-coral/60 mb-6"
        />

        <label className="block text-xs uppercase tracking-widest text-muted mb-2">
          Ville ou quartier
        </label>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="ex. Dakar, Plateau"
          className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-ink placeholder:text-muted/60 focus:outline-none focus:border-coral/60"
        />
        <p className="text-xs text-muted mt-2">
          Nous n'utilisons jamais votre position GPS précise — seulement le nom que vous indiquez ici.
        </p>

        <button
          onClick={handleSave}
          className="mt-6 w-full bg-coral text-night font-medium py-3 rounded-full hover:brightness-110 transition"
        >
          {saved ? "Enregistré ✓" : "Enregistrer"}
        </button>

        <button
          onClick={handleLogout}
          className="mt-4 w-full text-sm text-muted hover:text-ink transition"
        >
          Se déconnecter
        </button>
      </div>
    </main>
  );
}
