'use client';

import { useMemo } from 'react';
import { formatCompact } from '@/lib/utils';

interface HashtagStat {
  tag: string;
  usageCount: number;
  avgEngagement: number;
}

interface Props {
  hashtags: HashtagStat[];
}

export function TagCloud({ hashtags }: Props) {
  const items = useMemo(() => {
    if (hashtags.length === 0) return [];
    const maxUse = Math.max(...hashtags.map((h) => h.usageCount));
    const minUse = Math.min(...hashtags.map((h) => h.usageCount));
    const maxEng = Math.max(...hashtags.map((h) => h.avgEngagement));

    return hashtags.slice(0, 40).map((h) => {
      const ratio = maxUse === minUse ? 0.5 : (h.usageCount - minUse) / (maxUse - minUse);
      const engRatio = maxEng > 0 ? h.avgEngagement / maxEng : 0;
      return {
        ...h,
        fontSize: Math.round(14 + ratio * 22),
        weight: ratio > 0.6 ? 600 : ratio > 0.3 ? 500 : 400,
        opacity: 0.65 + engRatio * 0.35,
      };
    });
  }, [hashtags]);

  if (hashtags.length === 0) {
    return (
      <div className="rounded-xl border border-ink-100 bg-ink-50 p-6 md:p-8 text-center">
        <div className="text-xs uppercase tracking-widest text-ink-700 mb-3">
          Hashtag nei post recenti
        </div>
        <p className="text-base text-ink-800 max-w-md mx-auto">
          Non ho trovato hashtag nelle caption analizzate. Alcuni account li usano nel primo
          commento invece che in caption per un motivo estetico.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50 p-5 md:p-6">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-widest text-ink-700 mb-1">
          Hashtag più usati
        </div>
        <p className="text-sm text-ink-700">
          {hashtags.length} tag unici · dimensione = frequenza · opacità = engagement medio
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 py-5 px-2 min-h-[100px]">
        {items.map((t) => (
          <span
            key={t.tag}
            className="transition-all hover:scale-110 cursor-help tabular inline-block"
            style={{
              fontSize: `${t.fontSize}px`,
              fontWeight: t.weight,
              opacity: t.opacity,
              color: '#1c1c19',
              lineHeight: 1.15,
            }}
            title={`${t.tag} · ${t.usageCount}× · ${formatCompact(t.avgEngagement)} eng`}
          >
            {t.tag}
          </span>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-ink-200 grid grid-cols-2 md:grid-cols-5 gap-2">
        {hashtags.slice(0, 5).map((h, i) => (
          <div key={h.tag} className="text-center p-3 rounded-md bg-white border border-ink-100">
            <div className="text-xs uppercase tracking-wider text-ink-700 mb-1">#{i + 1}</div>
            <div className="text-sm font-mono truncate mb-1 text-ink-900" title={h.tag}>{h.tag}</div>
            <div className="text-xs text-ink-700 tabular">
              {h.usageCount}× · {formatCompact(h.avgEngagement)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
