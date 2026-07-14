import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export default async function FriendsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: friendships } = await supabase
    .from("friendships")
    .select("*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const friends = (friendships || []).map((f) =>
    f.requester_id === user.id ? f.addressee : f.requester
  );

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-xl">
        <a href="/" className="text-sm text-muted hover:text-ink transition">← Retour au feed</a>

        <p className="font-display italic text-2xl mt-8 mb-8">Mes amis</p>

        {friends.length === 0 ? (
          <p className="text-muted text-sm">
            Vous n'avez pas encore d'amis. Ajoutez-en depuis le feed en direct.
          </p>
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => {
              const initial = (friend?.username || "?").trim().charAt(0).toUpperCase();
              return (
                <a
                  key={friend.id}
                  href={`/messages/${friend.id}`}
                  className="flex items-center gap-4 bg-surface border border-line rounded-2xl p-4 hover:border-coral/40 transition"
                >
                  {friend.avatar_url ? (
                    <img
                      src={friend.avatar_url}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover border border-line"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-surface2 border border-line flex items-center justify-center font-display italic text-lg">
                      {initial}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{friend.username}</p>
                    {friend.city && <p className="text-xs text-muted truncate">{friend.city}</p>}
                  </div>
                  <span className="text-xs text-periwinkle shrink-0">Discuter →</span>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
