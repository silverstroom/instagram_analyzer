'use client';

import { formatCompact, formatPct } from '@/lib/utils';
import type { NormalizedPost, NormalizedProfile } from '@/lib/scrapecreators/normalizer';

interface Props {
  posts: NormalizedPost[];
  profile: NormalizedProfile;
}

const TYPE_STYLE: Record<string, { label: string; color: string; icon: string }> = {
  photo: { label: 'Foto', color: '#7F77DD', icon: '◈' },
  video: { label: 'Video', color: '#1D9E75', icon: '▶' },
  reel: { label: 'Reels', color: '#D4537E', icon: '✦' },
  carousel: { label: 'Carousel', color: '#D85A30', icon: '◉' },
  status: { label: 'Status', color: '#737369', icon: '◊' },
  link: { label: 'Link', color: '#378ADD', icon: '→' },
};

export function ContentMixHero({ posts, profile }: Props) {
  const stats = new Map<string, { count: number; totalEng: number }>();
  for (const p of posts) {
    const key = p.type;
    const cur = stats.get(key) || { count: 0, totalEng: 0 };
    cur.count++;
    cur.totalEng += p.likeCount + p.commentCount + (p.shareCount || 0);
    stats.set(key, cur);
  }

  const sorted = Array.from(stats.entries())
    .map(([type, v]) => ({
      type,
      count: v.count,
      share: (v.count / posts.length) * 100,
      avgEng: v.count > 0 ? v.totalEng / v.count : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Tipologia dominante e con miglior engagement
  const dominant = sorted[0];
  const bestPerforming = [...sorted].sort((a, b) => b.avgEng - a.avgEng)[0];

  return (
    <section className="rounded-2xl border border-ink-200 bg-gradient-to-br from-ink-50 to-white overflow-hidden">
      <div className="p-5 md:p-8">
        <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
          <div>
            <div className="text-xs uppercase tracking-widest text-ink-700 mb-1">
              Mix dei contenuti
            </div>
            <h3 className="font-display text-2xl md:text-3xl text-ink-900">
              Che tipo di contenuto pubblica
            </h3>
          </div>
          <div className="text-sm text-ink-700 tabular">
            su {posts.length} post analizzati
          </div>
        </div>

        {/* Barra grande con breakdown */}
        <div className="mb-6">
          <div className="flex h-12 rounded-lg overflow-hidden border border-ink-200">
            {sorted.map((s) => {
              const style = TYPE_STYLE[s.type] || TYPE_STYLE.status;
              return (
                <div
                  key={s.type}
                  className="flex items-center justify-center text-white text-sm font-medium transition-all hover:opacity-90"
                  style={{
                    width: `${s.share}%`,
                    background: style.color,
                    minWidth: s.share < 5 ? '30px' : undefined,
                  }}
                  title={`${style.label}: ${s.count} post (${s.share.toFixed(0)}%)`}
                >
                  {s.share >= 10 && `${s.share.toFixed(0)}%`}
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {sorted.map((s) => {
            const style = TYPE_STYLE[s.type] || TYPE_STYLE.status;
            return (
              <div key={s.type} className="p-4 rounded-lg bg-white border border-ink-100">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                    style={{ background: style.color }}
                  >
                    {style.icon}
                  </span>
                  <span className="font-medium text-sm text-ink-900">{style.label}</span>
                </div>
                <div className="font-display text-2xl tabular text-ink-900">{s.count}</div>
                <div className="text-xs text-ink-700 mt-0.5">
                  {formatPct(s.share, 0)} del mix
                </div>
                <div className="text-xs text-ink-700 mt-1 tabular">
                  {formatCompact(s.avgEng)} engagement medio
                </div>
              </div>
            );
          })}
        </div>

        {/* Insight chiave */}
        {dominant && bestPerforming && dominant.type !== bestPerforming.type && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-900">
              <strong>Insight:</strong> pubblichi soprattutto{' '}
              <strong>{TYPE_STYLE[dominant.type]?.label || dominant.type}</strong> ({dominant.share.toFixed(0)}%),
              ma ottieni miglior engagement con i{' '}
              <strong>{TYPE_STYLE[bestPerforming.type]?.label || bestPerforming.type}</strong>{' '}
              ({formatCompact(bestPerforming.avgEng)} vs {formatCompact(dominant.avgEng)}).
              Valuta di spostare il mix verso questi ultimi.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
