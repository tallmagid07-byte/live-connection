import { createClient } from "@/lib/supabaseServer";
import { getValidAccessToken, fetchCurrentlyPlaying } from "@/lib/spotify";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "non_authentifié" }, { status: 401 });
  }

  const { data: tokenRow } = await supabase
    .from("spotify_tokens")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!tokenRow) {
    return NextResponse.json({ error: "spotify_non_connecté" }, { status: 400 });
  }

  const accessToken = await getValidAccessToken(supabase, user.id, tokenRow);
  if (!accessToken) {
    return NextResponse.json({ error: "token_invalide" }, { status: 400 });
  }

  const track = await fetchCurrentlyPlaying(accessToken);

  if (!track) {
    // Rien n'est écouté en ce moment : on retire l'utilisateur du feed en direct
    await supabase.from("now_playing").delete().eq("user_id", user.id);
    return NextResponse.json({ playing: false });
  }

  await supabase.from("now_playing").upsert({
    user_id: user.id,
    ...track,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ playing: true, track });
}
