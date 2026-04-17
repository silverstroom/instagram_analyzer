'use client';

import { useMemo } from 'react';
import type { HashtagStat } from '@/lib/analytics/hashtags';

interface Props {
  hashtags: HashtagStat[];
}

export function HashtagBubbleMap({ hashtags }: Props) {
  const bubbles = useMemo(() => {
    if (hashtags.length === 0) return [];

    const maxUse = Math.max(...hashtags.map((h) => h.usageCount));
    const maxEng = Math.max(...hashtags.map((h) => h.avgEngagement));

    return hashtags.slice(0, 24).map((h) => ({
      ...h,
      sizeRatio: h.usageCount / maxUse,
      engRatio: maxEng > 0 ? h.avgEngagement / maxEng : 0,
    }));
  }, [hashtags]);

  if (hashtags.length === 0) {
    return (
      <div className="p-6 bg-ink-50 rounded-xl border border-ink-100 text-center text-sm text-ink-500">
        Nessun hashtag trovato nei post recenti
      </div>
    );
  }

  return (
    <div className="p-5 bg-ink-50 rounded-xl border border-ink-100">
      <div className="text-xs uppercase tracking-wider text-ink-500 mb-1">
        Hashtag map
      </div>
      <div className="text-[10px] text-ink-400 mb-4">
        Dimensione bolla = frequenza uso · Colore = engagement medio
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 min-h-[240px] py-4">
        {bubbles.map((b) => {
          // Dimensione font 12-26px in base a uso
          const fontSize = 12 + b.sizeRatio * 14;
          // Padding 8-20px in base a uso
          const paddingX = 10 + b.sizeRatio * 14;
          const paddingY = 5 + b.sizeRatio * 7;
          // Background opacity 0.15-0.6 in base a engagement
          const bgAlpha = 0.15 + b.engRatio * 0.45;

          return (
            <div
              key={b.tag}
              className="inline-flex items-center gap-1 rounded-full transition-transform hover:scale-105 cursor-help"
              style={{
                fontSize: `${fontSize}px`,
                padding: `${paddingY}px ${paddingX}px`,
                background: `rgba(28, 28, 25, ${bgAlpha})`,
                color: b.engRatio > 0.5 ? 'white' : '#1c1c19',
                fontWeight: b.engRatio > 0.7 ? 500 : 400,
                lineHeight: 1,
              }}
              title={`${b.tag} · ${b.usageCount} usi · ${Math.round(
                b.avgEngagement
              ).toLocaleString('it-IT')} engagement medio`}
            >
              {b.tag}
              <span
                className="tabular text-[0.65em] opacity-60"
                style={{ marginLeft: '2px' }}
              >
                ×{b.usageCount}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
