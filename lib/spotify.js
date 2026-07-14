// Rafraîchit le token Spotify si besoin, puis retourne un access_token valide
export async function getValidAccessToken(supabase, userId, tokenRow) {
  const isExpired = new Date(tokenRow.expires_at).getTime() < Date.now() + 60_000;

  if (!isExpired) {
    return tokenRow.access_token;
  }

  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokenRow.refresh_token,
    }),
  });

  if (!res.ok) return null;
  const refreshed = await res.json();

  const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  await supabase
    .from("spotify_tokens")
    .update({
      access_token: refreshed.access_token,
      expires_at: expiresAt,
    })
    .eq("user_id", userId);

  return refreshed.access_token;
}

// Interroge l'API Spotify pour savoir ce que la personne écoute en ce moment
export async function fetchCurrentlyPlaying(accessToken) {
  const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 204 || res.status === 202) return null; // rien n'est en cours
  if (!res.ok) return null;

  const data = await res.json();
  if (!data?.item) return null;

  return {
    track_name: data.item.name,
    artist_name: data.item.artists?.map((a) => a.name).join(", ") ?? "",
    album_art: data.item.album?.images?.[0]?.url ?? null,
    track_url: data.item.external_urls?.spotify ?? null,
    is_playing: data.is_playing,
  };
}
