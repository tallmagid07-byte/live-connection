"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function ChatWindow({ currentUserId, friendProfile, initialMessages }) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const supabase = createClient();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Dès qu'on ouvre la conversation, on marque comme lus tous les messages
  // reçus de cet ami qui ne l'étaient pas encore.
  useEffect(() => {
    supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", friendProfile.id)
      .eq("recipient_id", currentUserId)
      .eq("read", false)
      .then(() => {});
  }, [supabase, currentUserId, friendProfile.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat_${[currentUserId, friendProfile.id].sort().join("_")}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new;
          const isRelevant =
            (m.sender_id === currentUserId && m.recipient_id === friendProfile.id) ||
            (m.sender_id === friendProfile.id && m.recipient_id === currentUserId);
          if (isRelevant) {
            setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
            // La conversation est ouverte : on marque immédiatement comme lu.
            if (m.sender_id === friendProfile.id) {
              supabase.from("messages").update({ read: true }).eq("id", m.id).then(() => {});
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentUserId, friendProfile.id]);

  async function handleSend(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: currentUserId,
        recipient_id: friendProfile.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => (prev.some((p) => p.id === data.id) ? prev : [...prev, data]));
    }
    setContent("");
    setSending(false);
  }

  const initial = (friendProfile?.username || "?").trim().charAt(0).toUpperCase();

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-8">
      <div className="w-full max-w-xl flex flex-col h-[85vh]">
        <div className="flex items-center gap-3 mb-6">
          <a href="/friends" className="text-sm text-muted hover:text-ink transition mr-2">←</a>
          {friendProfile?.avatar_url ? (
            <img src={friendProfile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-line" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-surface2 border border-line flex items-center justify-center font-display italic">
              {initial}
            </div>
          )}
          <p className="font-medium">{friendProfile?.username || "Ami"}</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.length === 0 && (
            <p className="text-center text-muted text-sm mt-10">
              Aucun message pour l'instant. Dites bonjour 👋
            </p>
          )}
          {messages.map((m) => {
            const isMine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    isMine
                      ? "bg-coral text-night"
                      : "bg-surface border border-line text-ink"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-3 mt-4">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Votre message…"
            className="flex-1 bg-surface border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-coral/60"
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-coral text-night font-medium px-5 py-3 rounded-xl hover:brightness-110 transition disabled:opacity-60"
          >
            Envoyer
          </button>
        </form>
      </div>
    </main>
  );
}
