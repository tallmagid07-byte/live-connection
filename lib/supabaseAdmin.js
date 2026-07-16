import { createClient } from "@supabase/supabase-js";

// Cette clé a tous les droits et ne doit JAMAIS être exposée au navigateur
// (elle n'a pas le préfixe NEXT_PUBLIC_, donc Next.js ne l'inclut jamais
// dans le code envoyé au client).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
