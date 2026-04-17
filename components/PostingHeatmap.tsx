'use client';

import type { HikerMedia } from '@/lib/hikerapi/types';

interface Props {
  posts: HikerMedia[];
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export function PostingHeatmap({ posts }: Props) {
  if (posts.length === 0) {
    return null;
  }

  // Costruisco matrice 7 giorni x 24 ore con engagement medio
  const matrix: { count: number; totalEng: number }[][] = Array.from(
    { length: 7 },
    () => Array.from({ length: 24 }, () => ({ count: 0, totalEng: 0 }))
  );

  for (const p of posts) {
    const d = new Date(p.taken_at * 1000);
    const day = (d.getDay() + 6) % 7; // Lunedì = 0
    const hour = d.getHours();
    const eng = (p.like_count || 0) + (p.comment_count || 0);
    matrix[day][hour].count++;
    matrix[day][hour].totalEng += eng;
  }

  // Trovo il max engagement medio per normalizzare le intensità
  let maxAvg = 0;
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (matrix[d][h].count > 0) {
        const avg = matrix[d][h].totalEng / matrix[d][h].count;
        if (avg > maxAvg) maxAvg = avg;
      }
    }
  }

  return (
    <div className="p-5 bg-ink-50 rounded-xl border border-ink-100">
      <div className="text-xs uppercase tracking-wider text-ink-500 mb-3">
        Heatmap pubblicazioni (giorno × ora)
      </div>
      <div className="text-[10px] text-ink-400 mb-3">
        Colore più intenso = engagement medio più alto quando pubblica in quello slot
      </div>

      <div className="overflow-x-auto">
        <div className="inline-grid grid-flow-col" style={{ minWidth: '600px' }}>
          {/* Asse ore (header) */}
          <div className="grid grid-cols-[40px_repeat(24,minmax(20px,1fr))] items-center mb-1">
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className="text-[9px] text-ink-400 text-center tabular"
              >
                {h % 3 === 0 ? h : ''}
              </div>
            ))}
          </div>

          {/* Righe: giorni */}
          {DAYS.map((dayLabel, d) => (
            <div
              key={d}
              className="grid grid-cols-[40px_repeat(24,minmax(20px,1fr))] items-center gap-0.5 mb-0.5"
            >
              <div className="text-[10px] text-ink-500 pr-2 text-right tabular">
                {dayLabel}
              </div>
              {Array.from({ length: 24 }, (_, h) => {
                const cell = matrix[d][h];
                const avg = cell.count > 0 ? cell.totalEng / cell.count : 0;
                const intensity = maxAvg > 0 ? avg / maxAvg : 0;
                const hasPost = cell.count > 0;

                return (
                  <div
                    key={h}
                    className="aspect-square rounded-sm relative group cursor-help"
                    style={{
                      background: hasPost
                        ? `rgba(28, 28, 25, ${0.15 + intensity * 0.85})`
                        : 'rgba(0,0,0,0.04)',
                    }}
                    title={
                      hasPost
                        ? `${dayLabel} ${h}:00 — ${cell.count} post, ${avg.toFixed(0)} engagement medio`
                        : `${dayLabel} ${h}:00 — nessun post`
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
