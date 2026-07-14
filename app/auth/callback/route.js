import { createClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    // On stocke les tokens Spotify renvoyés par Supabase pour pouvoir
    // interroger l'API Spotify plus tard (le "provider_token" n'est pas
    // persisté automatiquement par Supabase).
    if (!error && data?.session?.provider_token && data?.user) {
      const expiresAt = new Date(Date.now() + 55 * 60 * 1000).toISOString();
      await supabase.from("spotify_tokens").upsert({
        user_id: data.user.id,
        access_token: data.session.provider_token,
        refresh_token: data.session.provider_refresh_token,
        expires_at: expiresAt,
      });
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
