import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import DiscussionsList from "@/components/DiscussionsList";

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

  // On récupère tous les messages impliquant l'utilisateur, du plus récent
  // au plus ancien, pour en déduire le dernier message de chaque discussion.
  const { data: allMessages } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const lastMessageByFriend = {};
  const unreadCountByFriend = {};

  (allMessages || []).forEach((m) => {
    const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
    if (!lastMessageByFriend[otherId]) {
      lastMessageByFriend[otherId] = m;
    }
    if (m.recipient_id === user.id && !m.read) {
      unreadCountByFriend[otherId] = (unreadCountByFriend[otherId] || 0) + 1;
    }
  });

  const discussions = friends
    .map((friend) => ({
      friend,
      lastMessage: lastMessageByFriend[friend.id] || null,
      unreadCount: unreadCountByFriend[friend.id] || 0,
    }))
    .sort((a, b) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
      const dateB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
      return dateB - dateA;
    });

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-xl">
        <a href="/" className="text-sm text-muted hover:text-ink transition">← Retour au feed</a>

        <p className="font-display italic text-2xl mt-8 mb-6">Discussions</p>

        {discussions.length === 0 ? (
          <p className="text-muted text-sm">
            Vous n'avez pas encore d'amis. Ajoutez-en depuis le feed en direct.
          </p>
        ) : (
          <DiscussionsList currentUserId={user.id} initialDiscussions={discussions} />
        )}
      </div>
    </main>
  );
}
