export default function NowPlayingCard({ profile, track }) {
  const initial = (profile?.username || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-4 bg-surface border border-line rounded-2xl p-4 hover:border-coral/40 transition">
      <div className="relative shrink-0">
        <span className="absolute inset-0 rounded-full border border-coral/60 animate-pulseRing" />
        <div className="relative w-12 h-12 rounded-full bg-surface2 border border-line flex items-center justify-center font-display italic text-lg">
          {initial}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="font-medium truncate">{profile?.username || "Quelqu'un"}</p>
          {profile?.city && (
            <span className="text-xs text-muted shrink-0">· {profile.city}</span>
          )}
        </div>
        <p className="text-sm text-ink/90 truncate">{track.track_name}</p>
        <p className="text-xs text-muted truncate">{track.artist_name}</p>
      </div>
    </div>
  );
}
