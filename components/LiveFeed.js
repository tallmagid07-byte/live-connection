"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import NowPlayingCard from "./NowPlayingCard";
import MusicSearch from "./MusicSearch";
import YouTubePlayer from "./YouTubePlayer";

export default function LiveFeed({ initialEntries, initialFriendships, currentUserId, currentUserProfile }) {
  const [entries, setEntries] = useState(initialEntries);
  const [friendships, setFriendships] = useState(initialFriendships);
  const [reactions, setReactions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [joined, setJoined] = useState(null); // { hostId, videoId, title, startedAt }
  const [listenerCount, setListenerCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const supabase = createClient();
  const toastIdRef = useRef(0);

  const mine = entries.find((e) => e.user_id === currentUserId);

  function pushToast(text) {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  async function refreshEntries() {
    const { data } = await supabase
      .from("now_playing")
      .select("*, profiles(*)")
      .order("updated_at", { ascending: false });
    if (data) setEntries(data);
  }

  async function refreshFriendships() {
    const { data } = await supabase
      .from("friendships")
      .select("*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)")
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`);
    if (data) setFriendships(data);
  }

  async function refreshReactions() {
    const { data } = await supabase
      .from("reactions")
      .select("*")
      .or(`from_user_id.eq.${currentUserId},to_user_id.eq.${currentUserId}`);
    if (data) setReactions(data);
  }

  useEffect(() => {
    refreshReactions();
    const channel = supabase
      .channel("listen_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "now_playing" }, refreshEntries)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, refreshFriendships)
      .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, refreshReactions)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Présence en direct : quand JE partage une chanson, on écoute qui vient l'écouter avec moi.
  useEffect(() => {
    if (!mine?.video_id) {
      setListenerCount(0);
      return;
    }

    const channel = supabase.channel(`listening:${currentUserId}`, {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const count = Object.values(state).reduce((sum, arr) => sum + arr.length, 0);
        setListenerCount(count);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        newPresences.forEach((p) => {
          pushToast(`🎧 ${p.username || "Quelqu'un"} a rejoint votre écoute`);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine?.video_id, currentUserId, supabase]);

  // Quand JE rejoins l'écoute de quelqu'un, on signale ma présence sur son canal.
  useEffect(() => {
    if (!joined) return;

    const channel = supabase.channel(`listening:${joined.hostId}`, {
      config: { presence: { key: currentUserId } },
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: currentUserId,
          username: currentUserProfile?.username || "Quelqu'un",
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined?.hostId, currentUserId, supabase]);

  async function handleSelectTrack(item) {
    setSaving(true);
    const now = new Date().toISOString();
    await supabase.from("now_playing").upsert({
      user_id: currentUserId,
      track_name: item.title,
      artist_name: item.channel,
      video_id: item.videoId,
      thumbnail_url: item.thumbnail,
      updated_at: now,
    });
    setSaving(false);
  }

  async function handleStop() {
    await supabase.from("now_playing").delete().eq("user_id", currentUserId);
  }

  async function handleAddFriend(otherUserId) {
    await supabase.from("friendships").insert({
      requester_id: currentUserId,
      addressee_id: otherUserId,
      status: "pending",
    });
    refreshFriendships();
  }

  async function handleAccept(friendshipId) {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
    refreshFriendships();
  }

  function handleJoin(entry) {
    setJoined({
      hostId: entry.user_id,
      videoId: entry.video_id,
      title: entry.track_name,
      startedAt: entry.updated_at,
    });
  }

  async function handleReact(toUserId, emoji) {
    const existing = reactions.find(
      (r) => r.from_user_id === currentUserId && r.to_user_id === toUserId
    );

    if (existing && existing.emoji === emoji) {
      await supabase.from("reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("reactions").upsert(
        { from_user_id: currentUserId, to_user_id: toUserId, emoji },
        { onConflict: "from_user_id,to_user_id" }
      );
    }
    refreshReactions();
  }

  const friendMap = {};
  const pendingReceived = [];
  friendships.forEach((f) => {
    const isMeRequester = f.requester_id === currentUserId;
    const otherId = isMeRequester ? f.addressee_id : f.requester_id;
    if (f.status === "accepted") {
      friendMap[otherId] = "accepted";
    } else if (isMeRequester) {
      friendMap[otherId] = "pending_sent";
    } else {
      friendMap[otherId] = "pending_received";
      pendingReceived.push(f);
    }
  });

  const others = entries.filter((e) => e.user_id !== currentUserId);

  const grouped = others.reduce((acc, entry) => {
    const city = entry.profiles?.city || "Ville non précisée";
    acc[city] = acc[city] || [];
    acc[city].push(entry);
    return acc;
  }, {});

  const joinedStartSeconds = joined
    ? (Date.now() - new Date(joined.startedAt).getTime()) / 1000
    : 0;

  const myReceivedReactions = reactions.filter((r) => r.to_user_id === currentUserId);

  return (
    <div className="w-full max-w-xl space-y-14 relative">
      {/* Notifications discrètes : quelqu'un a rejoint votre écoute */}
      {toasts.length > 0 && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="animate-fadeUp bg-surface2/95 backdrop-blur border border-coral/40 text-ink text-sm px-4 py-2.5 rounded-full shadow-card"
            >
              {t.text}
            </div>
          ))}
        </div>
      )}

      {/* Lecteur : soit ma propre écoute, soit celle rejointe */}
      {(mine?.video_id || joined) && (
        <div className="animate-fadeUp">
          <YouTubePlayer
            videoId={joined ? joined.videoId : mine.video_id}
            startSeconds={joined ? joinedStartSeconds : 0}
            title={joined ? joined.title : mine.track_name}
          />
          {joined && (
            <button
              onClick={() => setJoined(null)}
              className="text-xs text-muted hover:text-ink transition mt-3"
            >
              ✕ Quitter cette écoute partagée
            </button>
          )}
        </div>
      )}

      {/* Demandes d'amis reçues */}
      {pendingReceived.length > 0 && (
        <div className="relative overflow-hidden bg-surface2/80 backdrop-blur border border-periwinkle/30 rounded-2xl p-5 shadow-card animate-fadeUp">
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-periwinkle/20 blur-3xl pointer-events-none" />
          <p className="relative text-[11px] uppercase tracking-[0.18em] text-periwinkle/90 font-medium mb-4">
            Demandes d'amis
          </p>
          <div className="relative space-y-3">
            {pendingReceived.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-3">
                <p className="text-sm">{f.requester?.username || "Quelqu'un"}</p>
                <button
                  onClick={() => handleAccept(f.id)}
                  className="text-xs bg-periwinkle text-night font-semibold px-3.5 py-2 rounded-full hover:brightness-110 active:scale-95 transition"
                >
                  Accepter
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero : ce que j'écoute / recherche */}
      <div className="relative">
        {mine?.thumbnail_url && (
          <div
            className="absolute -inset-x-6 -top-10 h-56 rounded-full blur-[70px] opacity-30 animate-driftGlow pointer-events-none"
            style={{
              background:
                "radial-gradient(closest-side, #FF6B5B, #6C8CFF 70%, transparent)",
            }}
          />
        )}

        <div className="relative bg-surface/90 backdrop-blur border border-line rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-coral/90 font-medium">
              {mine ? "Vous écoutez en ce moment" : "Chercher et partager une chanson"}
            </p>
            {mine?.video_id && listenerCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-periwinkle bg-periwinkle/10 border border-periwinkle/30 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-periwinkle animate-pulse" />
                🎧 {listenerCount} {listenerCount === 1 ? "personne écoute" : "personnes écoutent"}
              </span>
            )}
          </div>

          {mine && (
            <div className="mb-5">
              <NowPlayingCard
                profile={mine.profiles}
                track={mine}
                showFriendAction={false}
                receivedReactions={myReceivedReactions}
                elevated
              />
              <button
                onClick={handleStop}
                className="mt-3 text-xs text-muted hover:text-ink transition"
              >
                J'ai arrêté d'écouter
              </button>
            </div>
          )}

          <MusicSearch onSelect={handleSelectTrack} />
          {saving && (
            <p className="text-xs text-muted mt-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
              Partage en cours…
            </p>
          )}
        </div>
      </div>

      {/* Feed des autres */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted font-medium whitespace-nowrap">
            En ce moment, autour de vous
          </p>
          <span className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
        </div>

        {others.length === 0 ? (
          <div className="text-center mt-14 max-w-sm mx-auto">
            <div className="w-14 h-14 mx-auto mb-5 rounded-full border border-line flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-coral/70" />
            </div>
            <p className="font-display italic text-2xl text-ink mb-2">Silence pour l'instant.</p>
            <p className="text-sm text-muted">Personne d'autre ne partage de musique là, tout de suite.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([city, group]) => (
              <div key={city}>
                <div className="flex items-center gap-2 mb-4">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-muted shrink-0">
                    <path d="M12 22s7-7.16 7-12a7 7 0 10-14 0c0 4.84 7 12 7 12z" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted font-medium">{city}</p>
                </div>
                <div className="space-y-3">
                  {group.map((entry) => {
                    const myReaction = reactions.find(
                      (r) => r.from_user_id === currentUserId && r.to_user_id === entry.user_id
                    );
                    return (
                      <NowPlayingCard
                        key={entry.user_id}
                        profile={entry.profiles}
                        track={entry}
                        friendStatus={friendMap[entry.user_id]}
                        onAddFriend={() => handleAddFriend(entry.user_id)}
                        onJoin={() => handleJoin(entry)}
                        onAccept={() => {
                          const f = friendships.find(
                            (fr) => fr.requester_id === entry.user_id && fr.addressee_id === currentUserId
                          );
                          if (f) handleAccept(f.id);
                        }}
                        showReactions={true}
                        myReaction={myReaction?.emoji}
                        onReact={(emoji) => handleReact(entry.user_id, emoji)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
