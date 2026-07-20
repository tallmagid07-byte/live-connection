import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import FriendCard from "@/components/FriendCard";

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

  const friendIds = friends.map((f) => f.id);
  const { data: allFavorites } = friendIds.length
    ? await supabase.from("favorite_tracks").select("*").in("user_id", friendIds)
    : { data: [] };

  const { data: unreadMessages } = friendIds.length
    ? await supabase
        .from("messages")
        .select("sender_id")
        .eq("recipient_id", user.id)
        .eq("read", false)
        .in("sender_id", friendIds)
    : { data: [] };

  const unreadCountByFriend = (unreadMessages || []).reduce((acc, m) => {
    acc[m.sender_id] = (acc[m.sender_id] || 0) + 1;
    return acc;
  }, {});

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
            {friends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                favorites={(allFavorites || []).filter((f) => f.user_id === friend.id)}
                unreadCount={unreadCountByFriend[friend.id] || 0}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
