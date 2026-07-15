"use client";

export default function YouTubePlayer({ videoId, startSeconds = 0, title }) {
  if (!videoId) return null;

  const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${Math.max(
    0,
    Math.floor(startSeconds)
  )}`;

  return (
    <div className="bg-surface border border-line rounded-2xl overflow-hidden">
      <div className="aspect-video w-full">
        <iframe
          key={`${videoId}-${startSeconds}`}
          src={src}
          title={title || "Lecteur"}
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
