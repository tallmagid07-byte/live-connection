import { createAdminClient } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

// Appelée régulièrement par un service externe (UptimeRobot) pour que
// Supabase reçoive une vraie requête base de données et ne mette jamais
// le projet en pause pour inactivité (règle : pause après 7 jours sans requête).
// Protégée par un secret pour éviter que n'importe qui la déclenche.
export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (secret !== process.env.PING_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("profiles").select("id").limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() });
}
