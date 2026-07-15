export default function NowPlayingCard({ profile, track, friendStatus, onAddFriend, onAccept, onJoin, showFriendAction = true }) {
  const initial = (profile?.username || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-4 bg-surface border border-line rounded-2xl p-4 hover:border-coral/40 transition">
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
        <img src={track.thumbnail_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-line shrink-0" />
      )}

      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{profile?.username || "Quelqu'un"}</p>
        {profile?.city && (
          <p className="flex items-center gap-1 text-xs text-muted truncate">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path d="M12 22s7-7.16 7-12a7 7 0 10-14 0c0 4.84 7 12 7 12z" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {profile.city}
          </p>
        )}
        <p className="text-sm text-ink/90 truncate mt-1">{track.track_name}</p>
        <p className="text-xs text-muted truncate">{track.artist_name}</p>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-2">
        {track.video_id && onJoin && (
          <button
            onClick={onJoin}
            className="text-xs bg-coral text-night font-medium px-3 py-2 rounded-full hover:brightness-110 transition whitespace-nowrap"
          >
            ▶ Rejoindre
          </button>
        )}

        {showFriendAction && (
          <>
            {friendStatus === "accepted" && (
              <a
                href={`/messages/${profile?.id}`}
                className="text-xs bg-periwinkle text-night font-medium px-3 py-2 rounded-full hover:brightness-110 transition whitespace-nowrap"
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
                className="text-xs bg-periwinkle text-night font-medium px-3 py-2 rounded-full hover:brightness-110 transition whitespace-nowrap"
              >
                Accepter
              </button>
            )}
            {!friendStatus && (
              <button
                onClick={onAddFriend}
                className="text-xs bg-surface2 border border-line px-3 py-2 rounded-full hover:border-coral/60 transition whitespace-nowrap"
              >
                + Ami
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
