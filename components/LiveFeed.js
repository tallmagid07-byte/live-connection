"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import NowPlayingCard from "./NowPlayingCard";

export default function LiveFeed({ initialEntries, currentUserId }) {
  const [entries, setEntries] = useState(initialEntries);
  const [trackName, setTrackName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const mine = entries.find((e) => e.user_id === currentUserId);

  // Abonnement temps réel : dès qu'un morceau change quelque part, le feed se met à jour
  useEffect(() => {
    const channel = supabase
      .channel("now_playing_feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "now_playing" },
        async () => {
          const { data } = await supabase
            .from("now_playing")
            .select("*, profiles(*)")
            .order("updated_at", { ascending: false });
          if (data) setEntries(data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function handleShare(e) {
    e.preventDefault();
    if (!trackName.trim() || !artistName.trim()) return;
    setSaving(true);
    await supabase.from("now_playing").upsert({
      user_id: currentUserId,
      track_name: trackName.trim(),
      artist_name: artistName.trim(),
      updated_at: new Date().toISOString(),
    });
    setTrackName("");
    setArtistName("");
    setSaving(false);
  }

  async function handleStop() {
    await supabase.from("now_playing").delete().eq("user_id", currentUserId);
  }

  const others = entries.filter((e) => e.user_id !== currentUserId);

  const grouped = others.reduce((acc, entry) => {
    const city = entry.profiles?.city || "Ville non précisée";
    acc[city] = acc[city] || [];
    acc[city].push(entry);
    return acc;
  }, {});

  return (
    <div className="w-full max-w-xl space-y-10">
      {/* Partager ce qu'on écoute */}
      <div className="bg-surface border border-line rounded-2xl p-5">
        <p className="text-xs uppercase tracking-widest text-muted mb-4">
          {mine ? "Vous écoutez en ce moment" : "Partager ce que vous écoutez"}
        </p>

        {mine && (
          <div className="mb-4">
            <NowPlayingCard profile={mine.profiles} track={mine} />
            <button
              onClick={handleStop}
              className="mt-3 text-xs text-muted hover:text-ink transition"
            >
              J'ai arrêté d'écouter
            </button>
          </div>
        )}

        <form onSubmit={handleShare} className="flex flex-col gap-3 sm:flex-row">
          <input
            value={trackName}
            onChange={(e) => setTrackName(e.target.value)}
            placeholder="Titre de la chanson"
            className="flex-1 bg-surface2 border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-coral/60"
          />
          <input
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="Artiste"
            className="flex-1 bg-surface2 border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-coral/60"
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-coral text-night font-medium px-5 py-3 rounded-xl hover:brightness-110 transition disabled:opacity-60 whitespace-nowrap"
          >
            {saving ? "…" : mine ? "Mettre à jour" : "Partager"}
          </button>
        </form>
      </div>

      {/* Feed des autres */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted mb-4">En ce moment, autour de vous</p>

        {others.length === 0 ? (
          <div className="text-center text-muted mt-10 max-w-sm mx-auto">
            <p className="font-display italic text-xl text-ink mb-2">Silence pour l'instant.</p>
            <p>Personne d'autre ne partage de musique là, tout de suite.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([city, group]) => (
              <div key={city}>
                <p className="text-xs uppercase tracking-widest text-muted mb-3">{city}</p>
                <div className="space-y-3">
                  {group.map((entry) => (
                    <NowPlayingCard key={entry.user_id} profile={entry.profiles} track={entry} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
