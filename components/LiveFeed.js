"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import NowPlayingCard from "./NowPlayingCard";

export default function LiveFeed({ initialEntries, currentUserId }) {
  const [entries, setEntries] = useState(initialEntries);
  const supabase = createClient();

  // Ecoute Spotify de l'utilisateur courant, publiée toutes les 30s
  useEffect(() => {
    async function ping() {
      try {
        await fetch("/api/spotify/now-playing", { method: "POST" });
      } catch {}
    }
    ping();
    const interval = setInterval(ping, 30_000);
    return () => clearInterval(interval);
  }, []);

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

  if (entries.length === 0) {
    return (
      <div className="text-center text-muted mt-16 max-w-sm mx-auto">
        <p className="font-display italic text-xl text-ink mb-2">
          Silence pour l'instant.
        </p>
        <p>
          Lancez une chanson sur Spotify — elle apparaîtra ici dès que
          vous serez en train de l'écouter.
        </p>
      </div>
    );
  }

  const grouped = entries.reduce((acc, entry) => {
    const city = entry.profiles?.city || "Ville non précisée";
    acc[city] = acc[city] || [];
    acc[city].push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-8 w-full max-w-xl">
      {Object.entries(grouped).map(([city, group]) => (
        <div key={city}>
          <p className="text-xs uppercase tracking-widest text-muted mb-3">{city}</p>
          <div className="space-y-3">
            {group.map((entry) => (
              <NowPlayingCard
                key={entry.user_id}
                profile={entry.profiles}
                track={entry}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
