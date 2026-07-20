"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function UnreadBadge({ currentUserId, initialCount = 0 }) {
  const [count, setCount] = useState(initialCount);
  const supabase = createClient();

  async function refreshCount() {
    const { count: unread } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", currentUserId)
      .eq("read", false);
    setCount(unread || 0);
  }

  useEffect(() => {
    const channel = supabase
      .channel(`unread_messages_${currentUserId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, refreshCount)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, currentUserId]);

  if (count === 0) return null;

  return (
    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#34D399] text-[10px] font-bold text-night flex items-center justify-center border-2 border-night">
      {count > 9 ? "9+" : count}
    </span>
  );
}
