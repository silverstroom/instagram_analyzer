'use client';

import type { HikerMedia } from '@/lib/hikerapi/types';
import { formatCompact } from '@/lib/utils';

interface Props {
  posts: HikerMedia[];
  username: string;
}

export function TopPostsGrid({ posts, username }: Props) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-xl">Post più performanti</h2>
        <span className="text-xs text-ink-500">Ultimi 12 post ordinati per engagement</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {posts.map((p) => {
          const engagement = (p.like_count || 0) + (p.comment_count || 0);
          const isVideo = p.media_type === 2 || p.product_type === 'clips';
          const isCarousel = p.media_type === 8;
          const url = `https://www.instagram.com/p/${p.code}/`;
          const thumb = p.thumbnail_url;
          const date = new Date(p.taken_at * 1000).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'short',
          });

          return (
            <a
              key={p.pk}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square rounded-lg overflow-hidden bg-ink-100 border border-ink-100 hover:border-ink-300 transition-all"
            >
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt={`Post di @${username}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-400 text-xs">
                  Anteprima non disponibile
                </div>
              )}

              {/* Badge tipo media */}
              <div className="absolute top-2 right-2 flex gap-1">
                {isVideo && (
                  <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      fill="white"
                      className="w-3.5 h-3.5"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}
                {isCarousel && (
                  <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      className="w-3.5 h-3.5"
                    >
                      <rect x="7" y="7" width="12" height="12" rx="2" />
                      <path d="M17 3H5a2 2 0 00-2 2v12" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Overlay hover con metriche */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <div className="flex items-center gap-4 text-white text-xs tabular">
                  <span className="flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                    {formatCompact(p.like_count || 0)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      className="w-3.5 h-3.5"
                    >
                      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                    </svg>
                    {formatCompact(p.comment_count || 0)}
                  </span>
                  {p.play_count != null && p.play_count > 0 && (
                    <span className="flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      {formatCompact(p.play_count)}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-white/70 mt-1">{date}</div>
              </div>

              {/* Badge engagement sempre visibile */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur text-[10px] font-medium tabular text-ink-900 group-hover:opacity-0 transition-opacity">
                {formatCompact(engagement)}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
