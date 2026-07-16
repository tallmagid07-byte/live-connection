import { createAdminClient } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

// Appelée régulièrement par un service externe (UptimeRobot) pour que
// Supabase reçoive une vraie requête base de données et ne mette jamais
// le projet en pause pour inactivité (règle : pause après 7 jours sans requête).
export async function GET() {
  const supabase = createAdminClient();

  const { error } = await supabase.from("profiles").select("id").limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() });
}
