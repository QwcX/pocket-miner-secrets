import { useMemo } from 'react';

interface YouTubeEmbedProps {
  url: string;
  className?: string;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function YouTubeEmbed({ url, className }: YouTubeEmbedProps) {
  const videoId = useMemo(() => extractYouTubeId(url), [url]);
  
  if (!videoId) return null;

  return (
    <div className={className}>
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-secondary">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
}

// Helper to find YouTube links in text
export function findYouTubeLinks(text: string): string[] {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^\s&]+)/g;
  const matches = text.match(regex) || [];
  return matches;
}
