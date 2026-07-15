"use client";

import { useState } from "react";
import FavoritesList from "./FavoritesList";

export default function FriendCard({ friend, favorites }) {
  const [open, setOpen] = useState(false);
  const initial = (friend?.username || "?").trim().charAt(0).toUpperCase();
  const hasFavorites = favorites.length > 0;

  return (
    <div className="bg-surface border border-line rounded-2xl p-4 hover:border-coral/40 transition">
      <div className="flex items-center gap-4">
        {friend.avatar_url ? (
          <img
            src={friend.avatar_url}
            alt=""
            className="w-12 h-12 rounded-full object-cover border border-line"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-surface2 border border-line flex items-center justify-center font-display italic text-lg">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{friend.username}</p>
          {friend.city && <p className="text-xs text-muted truncate">{friend.city}</p>}
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-xs text-muted hover:text-ink transition shrink-0"
        >
          {hasFavorites ? (open ? "Masquer ▲" : "Playlist ▼") : "Aucune playlist"}
        </button>
        <a
          href={`/messages/${friend.id}`}
          className="text-xs text-periwinkle shrink-0 whitespace-nowrap"
        >
          Discuter →
        </a>
      </div>

      {open && hasFavorites && (
        <div className="mt-4 pt-4 border-t border-line">
          <FavoritesList userId={friend.id} initialFavorites={favorites} editable={false} />
        </div>
      )}
    </div>
  );
}
