'use client';

interface VideoPreviewProps {
  url: string;
}

export function VideoPreview({ url }: VideoPreviewProps) {
  const getEmbedUrl = (url: string) => {
    try {
      if (!url) return null;
      const urlObj = new URL(url);

      // YouTube
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        let videoId = '';
        if (urlObj.hostname.includes('youtu.be')) {
          videoId = urlObj.pathname.slice(1);
        } else {
          videoId = urlObj.searchParams.get('v') || '';
        }

        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

      // Vimeo (Basic support)
      if (urlObj.hostname.includes('vimeo.com')) {
        const videoId = urlObj.pathname.split('/')[1];
        if (videoId && /^\d+$/.test(videoId)) {
          return `https://player.vimeo.com/video/${videoId}`;
        }
      }

      return null;
    } catch {
      return null;
    }
  };

  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) return null;

  return (
    <div className="relative pt-[56.25%] overflow-hidden rounded-lg border border-[var(--border)] bg-black mt-2">
      <iframe
        src={embedUrl}
        className="absolute top-0 left-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
