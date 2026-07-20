"use client";

import { useState } from "react";
import FavoritesList from "./FavoritesList";

export default function FriendCard({ friend, favorites, unreadCount = 0 }) {
  const [open, setOpen] = useState(false);
  const initial = (friend?.username || "?").trim().charAt(0).toUpperCase();
  const hasFavorites = favorites.length > 0;
  const hasUnread = unreadCount > 0;

  return (
    <div
      className={`bg-surface border rounded-2xl p-4 transition ${
        hasUnread ? "border-[#34D399]/50" : "border-line hover:border-coral/40"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
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
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#34D399] border-2 border-surface" />
          )}
        </div>
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
          className={`text-xs shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
            hasUnread ? "text-[#34D399] font-semibold" : "text-periwinkle"
          }`}
        >
          {hasUnread && <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />}
          {hasUnread ? `${unreadCount} nouveau${unreadCount > 1 ? "x" : ""}` : "Discuter →"}
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
