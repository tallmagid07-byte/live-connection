const REACTIONS = ["❤️", "🔥", "🥺", "✨"];

export default function NowPlayingCard({
  profile,
  track,
  friendStatus,
  onAddFriend,
  onAccept,
  onJoin,
  showFriendAction = true,
  showReactions = false,
  myReaction,
  receivedReactions = [],
  onReact,
  elevated = false,
}) {
  const initial = (profile?.username || "?").trim().charAt(0).toUpperCase();

  const reactionCounts = receivedReactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  return (
    <div
      className={`group bg-surface border border-line rounded-2xl p-4 transition-all duration-300 hover:border-coral/40 hover:shadow-cardHover hover:-translate-y-0.5 ${
        elevated ? "border-coral/25 shadow-card" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <span className="absolute inset-0 rounded-full border border-coral/60 animate-pulseRing" />
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="relative w-12 h-12 rounded-full object-cover border border-line"
            />
          ) : (
            <div className="relative w-12 h-12 rounded-full bg-surface2 border border-line flex items-center justify-center font-display italic text-lg">
              {initial}
            </div>
          )}
        </div>

        {track.thumbnail_url && (
          <div className="relative shrink-0">
            <img
              src={track.thumbnail_url}
              alt=""
              className="w-12 h-12 rounded-lg object-cover border border-line"
            />
            <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="font-medium truncate leading-snug">{profile?.username || "Quelqu'un"}</p>
          {profile?.city && (
            <p className="flex items-center gap-1 text-xs text-muted truncate">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M12 22s7-7.16 7-12a7 7 0 10-14 0c0 4.84 7 12 7 12z" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {profile.city}
            </p>
          )}
          <p className="font-display italic text-[15px] text-ink truncate mt-1.5 leading-tight">
            {track.track_name}
          </p>
          <p className="text-xs text-muted truncate">{track.artist_name}</p>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          {track.video_id && onJoin && (
            <button
              onClick={onJoin}
              className="text-xs bg-gradient-to-b from-coral to-[#E85A4C] text-night font-semibold px-3.5 py-2 rounded-full shadow-[0_4px_14px_-4px_rgba(255,107,91,0.5)] hover:brightness-110 active:scale-95 transition whitespace-nowrap"
            >
              ▶ Rejoindre
            </button>
          )}

          {showFriendAction && (
            <>
              {friendStatus === "accepted" && (
                <a
                  href={`/messages/${profile?.id}`}
                  className="text-xs bg-periwinkle text-night font-semibold px-3.5 py-2 rounded-full hover:brightness-110 active:scale-95 transition whitespace-nowrap"
                >
                  Message
                </a>
              )}
              {friendStatus === "pending_sent" && (
                <span className="text-xs text-muted whitespace-nowrap">Demande envoyée</span>
              )}
              {friendStatus === "pending_received" && (
                <button
                  onClick={onAccept}
                  className="text-xs bg-periwinkle text-night font-semibold px-3.5 py-2 rounded-full hover:brightness-110 active:scale-95 transition whitespace-nowrap"
                >
                  Accepter
                </button>
              )}
              {!friendStatus && (
                <button
                  onClick={onAddFriend}
                  className="text-xs bg-surface2 border border-line px-3.5 py-2 rounded-full hover:border-coral/60 hover:text-ink transition whitespace-nowrap"
                >
                  + Ami
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Réagir silencieusement, sans ouvrir la messagerie */}
      {showReactions && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-line/70">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReact(emoji)}
              className={`text-base w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                myReaction === emoji
                  ? "bg-coral/15 border border-coral/70 scale-110"
                  : "border border-line/80 opacity-70 hover:opacity-100 hover:border-coral/50 hover:scale-105"
              }`}
              title="Réagir sans un mot"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Réactions reçues, visibles sur sa propre carte */}
      {!showReactions && Object.keys(reactionCounts).length > 0 && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-line/70">
          {Object.entries(reactionCounts).map(([emoji, count]) => (
            <span
              key={emoji}
              className="text-xs bg-surface2 border border-line rounded-full px-2.5 py-1 flex items-center gap-1"
            >
              <span>{emoji}</span>
              <span className="text-muted">{count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
