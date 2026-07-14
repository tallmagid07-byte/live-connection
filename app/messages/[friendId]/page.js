import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";

export default async function MessagesPage({ params }) {
  const { friendId } = params;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (friendId === user.id) redirect("/friends");

  // Vérifie que c'est bien un ami accepté avant d'afficher la conversation
  const { data: friendship } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "accepted")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${user.id})`
    )
    .maybeSingle();

  if (!friendship) redirect("/friends");

  const { data: friendProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", friendId)
    .single();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true });

  return (
    <ChatWindow
      currentUserId={user.id}
      friendProfile={friendProfile}
      initialMessages={messages || []}
    />
  );
}
