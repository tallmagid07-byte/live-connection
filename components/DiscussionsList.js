"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

function formatWhenLikeWhatsApp(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();

  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Hier";

  const diffDays = (now - d) / (1000 * 60 * 60 * 24);
  if (diffDays < 7) {
    return d.toLocaleDateString("fr-FR", { weekday: "long" });
  }

  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function DiscussionsList({ currentUserId, initialDiscussions }) {
  const [discussions, setDiscussions] = useState(initialDiscussions);
  const supabase = createClient();

  useEffect(() => {
    setDiscussions(initialDiscussions);
  }, [initialDiscussions]);

  async function refresh() {
    const friendIds = discussions.map((d) => d.friend.id);
    if (friendIds.length === 0) return;

    const { data: allMessages } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
      .order("created_at", { ascending: false });

    const lastMessageByFriend = {};
    const unreadCountByFriend = {};

    (allMessages || []).forEach((m) => {
      const otherId = m.sender_id === currentUserId ? m.recipient_id : m.sender_id;
      if (!lastMessageByFriend[otherId]) {
        lastMessageByFriend[otherId] = m;
      }
      if (m.recipient_id === currentUserId && !m.read) {
        unreadCountByFriend[otherId] = (unreadCountByFriend[otherId] || 0) + 1;
      }
    });

    setDiscussions((prev) =>
      [...prev]
        .map((d) => ({
          ...d,
          lastMessage: lastMessageByFriend[d.friend.id] || d.lastMessage,
          unreadCount: unreadCountByFriend[d.friend.id] || 0,
        }))
        .sort((a, b) => {
          const dateA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
          const dateB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
          return dateB - dateA;
        })
    );
  }

  useEffect(() => {
    const channel = supabase
      .channel(`discussions_${currentUserId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, currentUserId]);

  return (
    <div className="divide-y divide-line border-t border-b border-line">
      {discussions.map(({ friend, lastMessage, unreadCount }) => {
        const initial = (friend?.username || "?").trim().charAt(0).toUpperCase();
        const hasUnread = unreadCount > 0;
        const isMine = lastMessage?.sender_id === currentUserId;

        return (
          <a
            key={friend.id}
            href={`/messages/${friend.id}`}
            className="flex items-center gap-3 py-3 hover:bg-surface/60 transition px-1 -mx-1 rounded-lg"
          >
            {friend.avatar_url ? (
              <img
                src={friend.avatar_url}
                alt=""
                className="w-12 h-12 rounded-full object-cover border border-line shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-surface2 border border-line flex items-center justify-center font-display italic text-lg shrink-0">
                {initial}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className={`truncate ${hasUnread ? "font-semibold text-ink" : "font-medium text-ink/90"}`}>
                {friend.username}
              </p>
              <p className={`text-sm truncate ${hasUnread ? "text-ink/80" : "text-muted"}`}>
                {lastMessage ? (
                  <>
                    {isMine && <span className="text-muted">Vous : </span>}
                    {lastMessage.content}
                  </>
                ) : (
                  "Dites bonjour 👋"
                )}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className={`text-xs ${hasUnread ? "text-[#34D399] font-medium" : "text-muted"}`}>
                {formatWhenLikeWhatsApp(lastMessage?.created_at)}
              </span>
              {hasUnread && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#34D399] text-[11px] font-bold text-night flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
          </a>
        );
      })}
    </div>
  );
}
