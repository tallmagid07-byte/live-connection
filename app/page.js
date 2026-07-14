import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import LiveFeed from "@/components/LiveFeed";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: entries } = await supabase
    .from("now_playing")
    .select("*, profiles(*)")
    .order("updated_at", { ascending: false });

  const { data: friendships } = await supabase
    .from("friendships")
    .select("*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12">
      <header className="w-full max-w-xl flex items-center justify-between mb-10">
        <p className="font-display italic text-xl">Listen</p>
        <a href="/profile" className="text-sm text-muted hover:text-ink transition">
          Mon profil
        </a>
      </header>

      <LiveFeed
        initialEntries={entries || []}
        initialFriendships={friendships || []}
        currentUserId={user.id}
      />
    </main>
  );
}
