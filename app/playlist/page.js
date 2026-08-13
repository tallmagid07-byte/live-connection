"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import FavoritesList from "@/components/FavoritesList";

export default function PlaylistPage() {
  const supabase = createClient();
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: favData } = await supabase
        .from("favorite_tracks")
        .select("*")
        .eq("user_id", user.id);

      setFavorites(favData || []);
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center text-muted">Chargement…</main>;
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-xl">
        <a href="/" className="text-sm text-muted hover:text-ink transition">← Retour au feed</a>

        <p className="font-display italic text-2xl mt-8 mb-2">Ma playlist</p>
        <p className="text-sm text-muted mb-8">
          Vos 5 chansons préférées, visibles par vos amis sur votre profil.
        </p>

        <FavoritesList userId={userId} initialFavorites={favorites} editable={true} />
      </div>
    </main>
  );
}
