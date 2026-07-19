import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import LiveFeed from "@/components/LiveFeed";
import LogoutButton from "@/components/LogoutButton";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: entries } = await supabase
    .from("now_playing")
    .select("*, profiles(*)")
    .gte("updated_at", cutoff)
    .order("updated_at", { ascending: false });

  const { data: friendships } = await supabase
    .from("friendships")
    .select("*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-14">
      <header className="w-full max-w-xl flex items-center justify-between mb-14">
        <img src="/logo.svg" alt="Listen" className="h-10" />
        <nav className="flex items-center gap-2">
          <a
            href="/friends"
            className="text-[15px] font-medium text-ink/90 hover:text-ink px-3.5 py-2 rounded-full hover:bg-surface2 transition-colors"
          >
            Mes amis
          </a>
          <a
            href="/profile"
            className="text-[15px] font-medium text-ink/90 hover:text-ink px-3.5 py-2 rounded-full hover:bg-surface2 transition-colors"
          >
            Mon profil
          </a>
          <LogoutButton className="text-muted hover:text-coral p-2 rounded-full hover:bg-surface2 transition-colors" />
        </nav>
      </header>

      <LiveFeed
        initialEntries={entries || []}
        initialFriendships={friendships || []}
        currentUserId={user.id}
        currentUserProfile={currentUserProfile}
      />
    </main>
  );
}
