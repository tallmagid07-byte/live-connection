"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import MusicSearch from "./MusicSearch";
import YouTubePlayer from "./YouTubePlayer";

export default function FavoritesList({ userId, initialFavorites, editable = false }) {
  const supabase = createClient();
  const [favorites, setFavorites] = useState(initialFavorites);
  const [editingSlot, setEditingSlot] = useState(null);
  const [playing, setPlaying] = useState(null); // { videoId, title }

  const slots = [1, 2, 3, 4, 5].map(
    (position) => favorites.find((f) => f.position === position) || null
  );

  async function handlePick(position, item) {
    const { data, error } = await supabase
      .from("favorite_tracks")
      .upsert({
        user_id: userId,
        position,
        track_name: item.title,
        artist_name: item.channel,
        video_id: item.videoId,
        thumbnail_url: item.thumbnail,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!error && data) {
      setFavorites((prev) => [...prev.filter((f) => f.position !== position), data]);
    }
    setEditingSlot(null);
  }

  async function handleRemove(position) {
    await supabase.from("favorite_tracks").delete().eq("user_id", userId).eq("position", position);
    setFavorites((prev) => prev.filter((f) => f.position !== position));
  }

  return (
    <div>
      {playing && (
        <div className="mb-4">
          <YouTubePlayer videoId={playing.videoId} title={playing.title} />
          <button
            onClick={() => setPlaying(null)}
            className="text-xs text-muted hover:text-ink transition mt-2"
          >
            ✕ Fermer la lecture
          </button>
        </div>
      )}

      <div className="space-y-2">
        {slots.map((track, i) => {
          const position = i + 1;

          if (editingSlot === position) {
            return (
              <div key={position} className="bg-surface2 border border-line rounded-xl p-3">
                <MusicSearch onSelect={(item) => handlePick(position, item)} />
                <button
                  onClick={() => setEditingSlot(null)}
                  className="text-xs text-muted hover:text-ink transition mt-2"
                >
                  Annuler
                </button>
              </div>
            );
          }

          if (!track) {
            return editable ? (
              <button
                key={position}
                onClick={() => setEditingSlot(position)}
                className="flex items-center gap-3 w-full text-left bg-surface border border-dashed border-line rounded-xl px-4 py-3 text-sm text-muted hover:border-coral/50 hover:text-ink transition"
              >
                <span className="w-8 h-8 rounded-lg bg-surface2 flex items-center justify-center text-xs shrink-0">
                  {position}
                </span>
                + Ajouter une chanson
              </button>
            ) : null;
          }

          return (
            <div
              key={position}
              className="flex items-center gap-3 bg-surface border border-line rounded-xl px-3 py-2 hover:border-coral/40 transition"
            >
              <span className="w-6 text-xs text-muted text-center shrink-0">{position}</span>
              <button
                onClick={() => setPlaying({ videoId: track.video_id, title: track.track_name })}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                {track.thumbnail_url && (
                  <img src={track.thumbnail_url} alt="" className="w-9 h-9 rounded-md object-cover shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm truncate">{track.track_name}</p>
                  <p className="text-xs text-muted truncate">{track.artist_name}</p>
                </div>
              </button>
              <span className="text-xs text-coral shrink-0">▶</span>
              {editable && (
                <button
                  onClick={() => handleRemove(position)}
                  className="text-xs text-muted hover:text-coral transition shrink-0 ml-1"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
