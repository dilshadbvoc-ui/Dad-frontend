// Extracts the video ID from any common YouTube URL shape:
// - https://www.youtube.com/watch?v=ID
// - https://youtu.be/ID
// - https://www.youtube.com/embed/ID
// - https://www.youtube.com/shorts/ID
// Returns null if the URL isn't a recognizable YouTube link.
export function getYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0];
      return id || null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v');
      }
      const embedMatch = parsed.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/);
      if (embedMatch) return embedMatch[2];
    }

    return null;
  } catch {
    return null;
  }
}

// hqdefault.jpg exists for every uploaded video (unlike maxresdefault, which
// only exists for videos uploaded in HD) — safer default that won't 404.
export function getYoutubeThumbnail(url: string): string | null {
  const id = getYoutubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
