'use client';

import type { HashtagStat } from '@/lib/analytics/hashtags';
import { useMemo } from 'react';
import { formatCompact } from '@/lib/utils';

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
      const useRatio =
        maxUse === minUse ? 0.5 : (h.usageCount - minUse) / (maxUse - minUse);
      const engRatio = maxEng > 0 ? h.avgEngagement / maxEng : 0;

      const fontSize = Math.round(14 + useRatio * 22); // 14-36px
      const weight = useRatio > 0.6 ? 600 : useRatio > 0.3 ? 500 : 400;
      const opacity = 0.55 + engRatio * 0.45;

      return { ...h, fontSize, weight, opacity };
    });
  }, [hashtags]);

  if (hashtags.length === 0) {
    return (
      <div className="rounded-xl border border-ink-100 bg-ink-50 p-6 md:p-8 text-center">
        <div className="text-xs uppercase tracking-widest text-ink-500 mb-3">
          Hashtag nei post recenti
        </div>
        <p className="text-base text-ink-700 max-w-md mx-auto mb-2">
          Non ho trovato hashtag negli ultimi post analizzati.
        </p>
        <p className="text-sm text-ink-500 max-w-md mx-auto">
          Alcune possibili cause: l'account li inserisce nel primo commento
          (pratica comune), oppure l'API ha restituito caption abbreviate.
          Riprova l'analisi in caso di dubbio.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50 p-5 md:p-6">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-widest text-ink-500 mb-1">
          Hashtag più usati negli ultimi post
        </div>
        <p className="text-sm text-ink-600">
          {hashtags.length} tag unici · dimensione = frequenza d'uso ·
          opacità = engagement medio generato
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 py-5 px-2 min-h-[120px]">
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
            title={`${t.tag} · ${t.usageCount} utilizzi · engagement medio ${formatCompact(
              t.avgEngagement
            )}`}
          >
            {t.tag}
          </span>
        ))}
      </div>

      {/* Top 5 dettagliata */}
      <div className="mt-5 pt-4 border-t border-ink-200 grid grid-cols-2 md:grid-cols-5 gap-2">
        {hashtags.slice(0, 5).map((h, i) => (
          <div
            key={h.tag}
            className="text-center p-3 rounded-md bg-white border border-ink-100"
          >
            <div className="text-xs uppercase tracking-wider text-ink-400 mb-1">
              #{i + 1}
            </div>
            <div className="text-sm font-mono truncate mb-1" title={h.tag}>
              {h.tag}
            </div>
            <div className="text-xs text-ink-500 tabular">
              {h.usageCount}× · {formatCompact(h.avgEngagement)} eng
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
