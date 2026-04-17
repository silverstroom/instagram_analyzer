'use client';

import type { HashtagStat } from '@/lib/analytics/hashtags';
import { useMemo } from 'react';

interface Props {
  hashtags: HashtagStat[];
}

/**
 * Vero tag cloud: dimensione proporzionale all'uso, disposizione compatta.
 * Se non ci sono hashtag, mostra messaggio esplicito invece di un'area vuota.
 */
export function TagCloud({ hashtags }: Props) {
  const items = useMemo(() => {
    if (hashtags.length === 0) return [];

    const maxUse = Math.max(...hashtags.map((h) => h.usageCount));
    const minUse = Math.min(...hashtags.map((h) => h.usageCount));
    const maxEng = Math.max(...hashtags.map((h) => h.avgEngagement));

    // Distribuzione "shuffle" controllata per creare effetto cloud
    return hashtags.slice(0, 50).map((h, i) => {
      const useRatio =
        maxUse === minUse ? 0.5 : (h.usageCount - minUse) / (maxUse - minUse);
      const engRatio = maxEng > 0 ? h.avgEngagement / maxEng : 0;

      // Font size 11-32px
      const fontSize = Math.round(11 + useRatio * 21);
      // Peso: più usato = più bold
      const weight = useRatio > 0.6 ? 600 : useRatio > 0.3 ? 500 : 400;
      // Colore: engagement alto = ink-900, basso = ink-500
      const opacity = 0.5 + engRatio * 0.5;

      return {
        ...h,
        fontSize,
        weight,
        opacity,
        rotation: 0, // nessuna rotazione, più leggibile
      };
    });
  }, [hashtags]);

  if (hashtags.length === 0) {
    return (
      <div className="rounded-xl border border-ink-100 bg-ink-50 p-6 text-center">
        <div className="text-[10px] uppercase tracking-widest text-ink-500 mb-2">
          Hashtag nei post
        </div>
        <p className="text-sm text-ink-600 max-w-md mx-auto">
          Questo profilo non usa hashtag nei post analizzati. Alcuni account grandi
          li evitano volontariamente, altri li inseriscono nel primo commento.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50 p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-ink-500 mb-0.5">
            Hashtag più usati
          </div>
          <div className="text-xs text-ink-500">
            {hashtags.length} tag unici · dimensione = frequenza · opacità = engagement
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-4 px-2">
        {items.map((t) => (
          <span
            key={t.tag}
            className="transition-all hover:scale-110 cursor-help tabular"
            style={{
              fontSize: `${t.fontSize}px`,
              fontWeight: t.weight,
              opacity: t.opacity,
              color: '#1c1c19',
              lineHeight: 1.1,
              display: 'inline-block',
            }}
            title={`${t.tag} · ${t.usageCount} utilizzi · engagement medio ${Math.round(t.avgEngagement).toLocaleString('it-IT')}`}
          >
            {t.tag}
          </span>
        ))}
      </div>

      {/* Top 5 table compatta */}
      <div className="mt-5 pt-4 border-t border-ink-100 grid grid-cols-2 md:grid-cols-5 gap-2">
        {hashtags.slice(0, 5).map((h, i) => (
          <div
            key={h.tag}
            className="text-center p-2 rounded-md bg-white border border-ink-100"
          >
            <div className="text-[9px] uppercase tracking-wider text-ink-400 mb-0.5">
              #{i + 1}
            </div>
            <div className="text-xs font-mono truncate" title={h.tag}>
              {h.tag}
            </div>
            <div className="text-[10px] text-ink-500 mt-0.5 tabular">
              {h.usageCount}× usato
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
