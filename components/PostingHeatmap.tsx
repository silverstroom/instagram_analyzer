'use client';

import { useMemo } from 'react';
import type { NormalizedPost } from '@/lib/scrapecreators/normalizer';

interface Props {
  posts: NormalizedPost[];
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const SLOTS = [
  { label: 'Mattina', sub: '6-12', start: 6, end: 12 },
  { label: 'Pomeriggio', sub: '12-18', start: 12, end: 18 },
  { label: 'Sera', sub: '18-24', start: 18, end: 24 },
  { label: 'Notte', sub: '0-6', start: 0, end: 6 },
];

export function PostingHeatmap({ posts }: Props) {
  const matrix = useMemo(() => {
    const m: { count: number; totalEng: number }[][] = Array.from({ length: 7 }, () =>
      SLOTS.map(() => ({ count: 0, totalEng: 0 }))
    );

    for (const p of posts) {
      if (!p.takenAt) continue;
      const d = new Date(p.takenAt * 1000);
      const day = (d.getDay() + 6) % 7;
      const hour = d.getHours();
      const slotIdx = SLOTS.findIndex((s) =>
        s.start > s.end ? hour >= s.start || hour < s.end : hour >= s.start && hour < s.end
      );
      if (slotIdx < 0) continue;
      const eng = p.likeCount + p.commentCount + (p.shareCount || 0);
      m[day][slotIdx].count++;
      m[day][slotIdx].totalEng += eng;
    }

    let maxAvg = 0;
    for (const row of m) for (const c of row) {
      if (c.count > 0) maxAvg = Math.max(maxAvg, c.totalEng / c.count);
    }
    return { m, maxAvg };
  }, [posts]);

  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50 p-5 md:p-6">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-widest text-ink-700 mb-1">
          Quando pubblica e quando performa
        </div>
        <p className="text-sm text-ink-700">
          Incrocio giorno × fascia oraria. Colore più intenso = engagement medio più alto.
        </p>
      </div>

      <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
        <table className="w-full border-separate border-spacing-1" style={{ minWidth: '460px' }}>
          <thead>
            <tr>
              <th className="w-16"></th>
              {SLOTS.map((s) => (
                <th key={s.label} className="text-left pb-2">
                  <div className="text-sm font-medium text-ink-900">{s.label}</div>
                  <div className="text-xs text-ink-700 tabular">{s.sub}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, dIdx) => (
              <tr key={day}>
                <td className="pr-3 text-sm font-medium text-ink-900">{day}</td>
                {SLOTS.map((_, sIdx) => {
                  const cell = matrix.m[dIdx][sIdx];
                  const hasPost = cell.count > 0;
                  const avg = hasPost ? cell.totalEng / cell.count : 0;
                  const intensity = matrix.maxAvg > 0 ? avg / matrix.maxAvg : 0;
                  return (
                    <td key={sIdx} className="p-0">
                      <div
                        className="rounded-md h-14 flex items-center justify-center cursor-help transition-transform hover:scale-105"
                        style={{
                          background: hasPost
                            ? `rgba(28, 28, 25, ${0.2 + intensity * 0.75})`
                            : 'rgba(0,0,0,0.04)',
                          color: intensity > 0.4 ? 'white' : '#1c1c19',
                        }}
                        title={
                          hasPost
                            ? `${day} ${SLOTS[sIdx].label} — ${cell.count} post, ${Math.round(avg)} eng medio`
                            : `${day} ${SLOTS[sIdx].label} — nessun post`
                        }
                      >
                        <div className="text-center">
                          <div className="text-sm font-medium tabular">
                            {hasPost ? cell.count : '—'}
                          </div>
                          {hasPost && intensity > 0.3 && (
                            <div className="text-[10px] opacity-80 tabular leading-tight">
                              {avg >= 1000 ? `${(avg / 1000).toFixed(1)}K` : Math.round(avg)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
