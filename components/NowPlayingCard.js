export default function NowPlayingCard({ profile, track }) {
  return (
    <div className="flex items-center gap-4 bg-surface border border-line rounded-2xl p-4 hover:border-coral/40 transition">
      <div className="relative shrink-0">
        <span className="absolute inset-0 rounded-full border border-coral/60 animate-pulseRing" />
        <img
          src={profile.avatar_url || "/default-avatar.png"}
          alt={profile.username}
          className="relative w-12 h-12 rounded-full object-cover border border-line"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="font-medium truncate">{profile.username}</p>
          {profile.city && (
            <span className="text-xs text-muted shrink-0">· {profile.city}</span>
          )}
        </div>
        <p className="text-sm text-ink/90 truncate">{track.track_name}</p>
        <p className="text-xs text-muted truncate">{track.artist_name}</p>
      </div>

      {track.album_art && (
        <img
          src={track.album_art}
          alt=""
          className="w-12 h-12 rounded-lg object-cover border border-line shrink-0"
        />
      )}

      {track.track_url && (
        <a
          href={track.track_url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-periwinkle shrink-0 hover:underline"
        >
          Écouter
        </a>
      )}
    </div>
  );
}
