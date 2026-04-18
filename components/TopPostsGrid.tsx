'use client';

import { formatCompact, formatDateShort, proxiedImage } from '@/lib/utils';
import type { NormalizedPost, NormalizedProfile } from '@/lib/scrapecreators/normalizer';

interface Props {
  posts: NormalizedPost[];
  profile: NormalizedProfile;
}

export function TopPostsGrid({ posts, profile }: Props) {
  const top = [...posts]
    .sort(
      (a, b) =>
        b.likeCount + b.commentCount + (b.shareCount || 0) -
        (a.likeCount + a.commentCount + (a.shareCount || 0))
    )
    .slice(0, 6);

  if (top.length === 0) return null;

  return (
    <section>
      <h3 className="font-display text-2xl md:text-3xl text-ink-900 mb-4">
        Post più performanti
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {top.map((p) => (
          <a
            key={p.id}
            href={p.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="group block aspect-square rounded-lg overflow-hidden bg-ink-100 border border-ink-100 hover:border-ink-300 transition-all relative"
          >
            {p.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={proxiedImage(p.thumbnailUrl)}
                alt={p.caption.slice(0, 60) || 'Post'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white">
              <div className="flex gap-3 items-center text-sm tabular">
                <span>♡ {formatCompact(p.likeCount)}</span>
                <span>◯ {formatCompact(p.commentCount)}</span>
                {p.shareCount != null && <span>↗ {formatCompact(p.shareCount)}</span>}
              </div>
              {p.takenAt > 0 && (
                <div className="text-xs text-white/80 mt-1">
                  {formatDateShort(new Date(p.takenAt * 1000))}
                </div>
              )}
            </div>
            <div className="absolute top-2 left-2 flex gap-1">
              <span className="text-[10px] uppercase tracking-wider bg-white/90 backdrop-blur text-ink-900 px-2 py-0.5 rounded font-medium">
                {p.type}
              </span>
            </div>
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur text-xs font-medium px-2 py-0.5 rounded-full tabular text-ink-900 group-hover:opacity-0 transition-opacity">
              {formatCompact(p.likeCount + p.commentCount + (p.shareCount || 0))}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
