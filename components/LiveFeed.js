"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import NowPlayingCard from "./NowPlayingCard";

export default function LiveFeed({ initialEntries, initialFriendships, currentUserId }) {
  const [entries, setEntries] = useState(initialEntries);
  const [friendships, setFriendships] = useState(initialFriendships);
  const [trackName, setTrackName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [saving, setSaving] = useState(false);
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

  // Abonnement temps réel : feed de musique + amitiés
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

  async function handleShare(e) {
    e.preventDefault();
    if (!trackName.trim() || !artistName.trim()) return;
    setSaving(true);
    await supabase.from("now_playing").upsert({
      user_id: currentUserId,
      track_name: trackName.trim(),
      artist_name: artistName.trim(),
      updated_at: new Date().toISOString(),
    });
    setTrackName("");
    setArtistName("");
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

  return (
    <div className="w-full max-w-xl space-y-10">
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

      {/* Partager ce qu'on écoute */}
      <div className="bg-surface border border-line rounded-2xl p-5">
        <p className="text-xs uppercase tracking-widest text-muted mb-4">
          {mine ? "Vous écoutez en ce moment" : "Partager ce que vous écoutez"}
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

        <form onSubmit={handleShare} className="flex flex-col gap-3 sm:flex-row">
          <input
            value={trackName}
            onChange={(e) => setTrackName(e.target.value)}
            placeholder="Titre de la chanson"
            className="flex-1 bg-surface2 border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-coral/60"
          />
          <input
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="Artiste"
            className="flex-1 bg-surface2 border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-coral/60"
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-coral text-night font-medium px-5 py-3 rounded-xl hover:brightness-110 transition disabled:opacity-60 whitespace-nowrap"
          >
            {saving ? "…" : mine ? "Mettre à jour" : "Partager"}
          </button>
        </form>
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
