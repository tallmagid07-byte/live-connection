"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import NowPlayingCard from "./NowPlayingCard";
import MusicSearch from "./MusicSearch";
import YouTubePlayer from "./YouTubePlayer";

export default function LiveFeed({ initialEntries, initialFriendships, currentUserId }) {
  const [entries, setEntries] = useState(initialEntries);
  const [friendships, setFriendships] = useState(initialFriendships);
  const [saving, setSaving] = useState(false);
  const [joined, setJoined] = useState(null); // { videoId, title, startedAt }
  const supabase = createClient();

  const mine = entries.find((e) => e.user_id === currentUserId);

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

  useEffect(() => {
    const channel = supabase
      .channel("listen_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "now_playing" }, refreshEntries)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, refreshFriendships)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

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
      videoId: entry.video_id,
      title: entry.track_name,
      startedAt: entry.updated_at,
    });
  }

  // Calcule le statut d'amitié vis-à-vis de chaque autre utilisateur
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

  return (
    <div className="w-full max-w-xl space-y-10">
      {/* Lecteur : soit ma propre écoute, soit celle rejointe */}
      {(mine?.video_id || joined) && (
        <YouTubePlayer
          videoId={joined ? joined.videoId : mine.video_id}
          startSeconds={joined ? joinedStartSeconds : 0}
          title={joined ? joined.title : mine.track_name}
        />
      )}
      {joined && (
        <button
          onClick={() => setJoined(null)}
          className="text-xs text-muted hover:text-ink transition -mt-6"
        >
          ✕ Quitter cette écoute partagée
        </button>
      )}

      {/* Demandes d'amis reçues */}
      {pendingReceived.length > 0 && (
        <div className="bg-surface2 border border-periwinkle/40 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-muted mb-4">Demandes d'amis</p>
          <div className="space-y-3">
            {pendingReceived.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-3">
                <p className="text-sm">{f.requester?.username || "Quelqu'un"}</p>
                <button
                  onClick={() => handleAccept(f.id)}
                  className="text-xs bg-periwinkle text-night font-medium px-3 py-2 rounded-full hover:brightness-110 transition"
                >
                  Accepter
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chercher et partager une musique */}
      <div className="bg-surface border border-line rounded-2xl p-5">
        <p className="text-xs uppercase tracking-widest text-muted mb-4">
          {mine ? "Vous écoutez en ce moment" : "Chercher et partager une chanson"}
        </p>

        {mine && (
          <div className="mb-4">
            <NowPlayingCard profile={mine.profiles} track={mine} showFriendAction={false} />
            <button
              onClick={handleStop}
              className="mt-3 text-xs text-muted hover:text-ink transition"
            >
              J'ai arrêté d'écouter
            </button>
          </div>
        )}

        <MusicSearch onSelect={handleSelectTrack} />
        {saving && <p className="text-xs text-muted mt-2">Partage en cours…</p>}
      </div>

      {/* Feed des autres */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted mb-4">En ce moment, autour de vous</p>

        {others.length === 0 ? (
          <div className="text-center text-muted mt-10 max-w-sm mx-auto">
            <p className="font-display italic text-xl text-ink mb-2">Silence pour l'instant.</p>
            <p>Personne d'autre ne partage de musique là, tout de suite.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([city, group]) => (
              <div key={city}>
                <p className="text-xs uppercase tracking-widest text-muted mb-3">{city}</p>
                <div className="space-y-3">
                  {group.map((entry) => (
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
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
