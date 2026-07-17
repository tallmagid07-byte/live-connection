"use client";

import { useState, useRef } from "react";
import { searchYoutubeMusic } from "@/lib/youtube";

export default function MusicSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const timeoutRef = useRef(null);

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);

    clearTimeout(timeoutRef.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      const items = await searchYoutubeMusic(value);
      setResults(items);
      setLoading(false);
    }, 450);
  }

  function handleSelect(item) {
    onSelect(item);
    setQuery("");
    setResults([]);
  }

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2.5 bg-surface2 border rounded-xl px-4 py-3 transition-colors ${
          focused ? "border-coral/60" : "border-line"
        }`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-muted shrink-0">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Chercher une chanson ou un artiste…"
          className="w-full bg-transparent text-sm text-ink placeholder:text-muted/60 focus:outline-none"
        />
      </div>

      {loading && (
        <p className="text-xs text-muted mt-2 flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-muted animate-pulse" />
          Recherche…
        </p>
      )}

      {results.length > 0 && (
        <div className="absolute z-10 mt-2 w-full bg-surface2/95 backdrop-blur border border-line rounded-xl overflow-hidden shadow-card animate-fadeUp">
          {results.map((item) => (
            <button
              key={item.videoId}
              onClick={() => handleSelect(item)}
              className="flex items-center gap-3 w-full text-left px-3 py-2.5 hover:bg-surface transition"
            >
              {item.thumbnail && (
                <img src={item.thumbnail} alt="" className="w-10 h-10 rounded-md object-cover shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm truncate">{item.title}</p>
                <p className="text-xs text-muted truncate">{item.channel}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
