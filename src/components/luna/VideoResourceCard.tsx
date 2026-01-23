'use client';

import { YoutubeLogo, Play, Clock, Eye } from '@phosphor-icons/react';
import type { VideoResource } from '@/lib/resources/types';

interface VideoResourceCardProps {
  video: VideoResource;
  compact?: boolean;
}

/**
 * Card component to display a YouTube video resource
 * Opens video in new tab when clicked
 */
export function VideoResourceCard({ video, compact = false }: VideoResourceCardProps) {
  // Format view count
  const formatViewCount = (count?: number) => {
    if (!count) return '';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K views`;
    return `${count} views`;
  };

  // Format duration for display
  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    if (minutes >= 60) {
      const hrs = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hrs}h ${mins}m`;
    }
    return `${Math.round(minutes)} min`;
  };

  if (compact) {
    return (
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-2 rounded-lg bg-[var(--background-secondary)]/50 hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-800)] transition-colors group"
      >
        <div className="w-8 h-8 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
          <YoutubeLogo size={18} weight="duotone" className="text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-heading truncate group-hover:text-[var(--ember-500)]">
            {video.title}
          </p>
          <p className="text-xs text-muted truncate">{video.channelTitle}</p>
        </div>
        <Play size={14} className="text-muted group-hover:text-[var(--ember-500)] flex-shrink-0" />
      </a>
    );
  }

  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg overflow-hidden bg-[var(--background-elevated)] border border-[var(--border)] hover:shadow-md transition-all group"
    >
      {/* Thumbnail */}
      {video.thumbnailUrl && (
        <div className="relative aspect-video bg-[var(--background-secondary)]">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity shadow-lg">
              <Play size={20} weight="fill" className="text-white ml-0.5" />
            </div>
          </div>
          {/* Duration badge */}
          {video.durationMinutes && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
              {formatDuration(video.durationMinutes)}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-3 space-y-1">
        <h5 className="font-medium text-heading text-sm line-clamp-2 group-hover:text-[var(--ember-500)] transition-colors">
          {video.title}
        </h5>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>{video.channelTitle}</span>
          {video.viewCount && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Eye size={12} />
                {formatViewCount(video.viewCount)}
              </span>
            </>
          )}
          {video.durationMinutes && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Clock size={12} />
                {formatDuration(video.durationMinutes)}
              </span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}

/**
 * List of video resources in a compact format
 */
interface VideoResourceListProps {
  videos: VideoResource[];
  compact?: boolean;
}

export function VideoResourceList({ videos, compact = true }: VideoResourceListProps) {
  if (!videos?.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-muted font-medium uppercase tracking-wide">
        <YoutubeLogo size={14} weight="duotone" className="text-red-500" />
        <span>Related Videos</span>
      </div>
      <div className={compact ? 'space-y-1.5' : 'grid gap-3 sm:grid-cols-2'}>
        {videos.map((video) => (
          <VideoResourceCard key={video.videoId} video={video} compact={compact} />
        ))}
      </div>
    </div>
  );
}
