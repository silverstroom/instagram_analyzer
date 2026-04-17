'use client';

import { formatCompact, formatPct } from '@/lib/utils';

interface Props {
  follower: number;
  following: number;
  posts: number;
  engagementRate: number;
  rating: { label: string; color: string };
  avgPostsPerWeek: number;
  bestDay: string;
  bestHour: number;
}

export function MetricsGrid({
  follower,
  following,
  posts,
  engagementRate,
  rating,
  avgPostsPerWeek,
  bestDay,
  bestHour,
}: Props) {
  const cards = [
    {
      label: 'Follower',
      value: formatCompact(follower),
      sub: `${following.toLocaleString('it-IT')} seguiti`,
    },
    {
      label: 'Engagement',
      value: formatPct(engagementRate, 2),
      sub: rating.label,
      highlight: true,
    },
    {
      label: 'Post totali',
      value: formatCompact(posts),
      sub: `~${avgPostsPerWeek.toFixed(1)} a settimana`,
    },
    {
      label: 'Best time',
      value: bestDay,
      sub: `ore ${String(bestHour).padStart(2, '0')}:00`,
    },
  ];

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 animate-slide-up">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`p-5 rounded-xl border transition-colors ${
            c.highlight
              ? 'bg-ink-900 text-ink-50 border-ink-900'
              : 'bg-ink-50 border-ink-100'
          }`}
        >
          <div
            className={`text-[11px] uppercase tracking-wider mb-2 ${
              c.highlight ? 'text-ink-300' : 'text-ink-500'
            }`}
          >
            {c.label}
          </div>
          <div className="font-display text-3xl tabular mb-1">{c.value}</div>
          <div
            className={`text-xs ${
              c.highlight ? 'text-ink-300' : 'text-ink-500'
            }`}
          >
            {c.sub}
          </div>
        </div>
      ))}
    </section>
  );
}
