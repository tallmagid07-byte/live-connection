"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import FavoritesList from "@/components/FavoritesList";

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState("");
  const [city, setCity] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [favorites, setFavorites] = useState([]);

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

      const { data: favData } = await supabase
        .from("favorite_tracks")
        .select("*")
        .eq("user_id", user.id);
      setFavorites(favData || []);
    }
    load();
  }, [supabase, router]);

  async function handleSave() {
    await supabase.from("profiles").update({ username, city }).eq("id", profile.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);

    const extension = file.name.split(".").pop();
    const path = `${profile.id}/avatar.${extension}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      setUploadError("L'upload a échoué. Vérifiez que le bucket 'avatars' existe et est public.");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    // on ajoute un paramètre pour forcer le rafraîchissement du cache d'image
    const freshUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ avatar_url: freshUrl }).eq("id", profile.id);
    setProfile((p) => ({ ...p, avatar_url: freshUrl }));
    setUploading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!profile) {
    return <main className="min-h-screen flex items-center justify-center text-muted">Chargement…</main>;
  }

  const initial = (username || "?").trim().charAt(0).toUpperCase();

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-md">
        <a href="/" className="text-sm text-muted hover:text-ink transition">← Retour au feed</a>

        <p className="font-display italic text-2xl mt-8 mb-8">Mon profil</p>

        {/* Photo de profil */}
        <div className="flex flex-col items-center mb-8">
          <label className="relative cursor-pointer group">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-24 h-24 rounded-full object-cover border border-line"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-surface2 border border-line flex items-center justify-center font-display italic text-3xl">
                {initial}
              </div>
            )}
            <span className="absolute inset-0 rounded-full bg-night/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs">
              {uploading ? "…" : "Changer"}
            </span>
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" disabled={uploading} />
          </label>
          {uploadError && <p className="text-xs text-coral mt-3 text-center">{uploadError}</p>}
        </div>

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

        <p className="text-xs uppercase tracking-widest text-muted mt-10 mb-4">
          Mes 5 chansons préférées
        </p>
        <FavoritesList userId={profile.id} initialFavorites={favorites} editable={true} />

        <button
          onClick={handleSave}
          className="mt-6 w-full bg-coral text-night font-medium py-3 rounded-full hover:brightness-110 transition"
        >
          {saved ? "Enregistré ✓" : "Enregistrer"}
        </button>

        <button
          onClick={handleLogout}
          className="mt-4 w-full text-sm text-coral/90 hover:text-coral border border-coral/30 hover:border-coral/60 rounded-full py-3 transition"
        >
          Se déconnecter
        </button>
      </div>
    </main>
  );
}
