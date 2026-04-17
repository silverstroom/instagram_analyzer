'use client';

import { useMemo } from 'react';
import type { HikerMedia } from '@/lib/hikerapi/types';

interface Props {
  posts: HikerMedia[];
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
// Raggruppiamo le 24 ore in 4 fasce: mattina, pomeriggio, sera, notte
const SLOTS = [
  { label: 'Mattina', subLabel: '6-12', start: 6, end: 12 },
  { label: 'Pomeriggio', subLabel: '12-18', start: 12, end: 18 },
  { label: 'Sera', subLabel: '18-24', start: 18, end: 24 },
  { label: 'Notte', subLabel: '0-6', start: 0, end: 6 },
];

/**
 * Heatmap compatta a 7 giorni x 4 fasce orarie.
 * Molto più leggibile del 7x24 originale, funziona bene anche su mobile.
 */
export function PostingHeatmap({ posts }: Props) {
  const matrix = useMemo(() => {
    if (posts.length === 0) return null;

    const m: { count: number; totalEng: number }[][] = Array.from(
      { length: 7 },
      () => SLOTS.map(() => ({ count: 0, totalEng: 0 }))
    );

    for (const p of posts) {
      const d = new Date(p.taken_at * 1000);
      const day = (d.getDay() + 6) % 7; // Lun = 0
      const hour = d.getHours();
      const slotIdx = SLOTS.findIndex((s) =>
        s.start > s.end
          ? hour >= s.start || hour < s.end
          : hour >= s.start && hour < s.end
      );
      if (slotIdx < 0) continue;
      const eng = (p.like_count || 0) + (p.comment_count || 0);
      m[day][slotIdx].count++;
      m[day][slotIdx].totalEng += eng;
    }

    // Trova max engagement per normalizzare
    let maxAvg = 0;
    for (const row of m) {
      for (const cell of row) {
        if (cell.count > 0) {
          const avg = cell.totalEng / cell.count;
          if (avg > maxAvg) maxAvg = avg;
        }
      }
    }

    return { m, maxAvg };
  }, [posts]);

  if (!matrix || posts.length === 0) return null;

  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50 p-5 md:p-6">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-widest text-ink-500 mb-1">
          Quando pubblica e quando performa meglio
        </div>
        <p className="text-sm text-ink-600">
          Incrocio tra giorno della settimana e fascia oraria. Colore più intenso = engagement medio più alto.
        </p>
      </div>

      <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
        <table className="w-full border-separate border-spacing-1" style={{ minWidth: '460px' }}>
          <thead>
            <tr>
              <th className="w-16"></th>
              {SLOTS.map((s) => (
                <th key={s.label} className="text-left pb-2">
                  <div className="text-sm font-medium text-ink-700">{s.label}</div>
                  <div className="text-xs text-ink-500 tabular">{s.subLabel}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, dIdx) => (
              <tr key={day}>
                <td className="pr-3 text-sm font-medium text-ink-700 align-middle">
                  {day}
                </td>
                {SLOTS.map((_, sIdx) => {
                  const cell = matrix.m[dIdx][sIdx];
                  const hasPost = cell.count > 0;
                  const avg = hasPost ? cell.totalEng / cell.count : 0;
                  const intensity = matrix.maxAvg > 0 ? avg / matrix.maxAvg : 0;
                  return (
                    <td key={sIdx} className="p-0">
                      <div
                        className="rounded-md relative group h-14 flex items-center justify-center cursor-help transition-transform hover:scale-105"
                        style={{
                          background: hasPost
                            ? `rgba(28, 28, 25, ${0.2 + intensity * 0.75})`
                            : 'rgba(0,0,0,0.04)',
                          color: intensity > 0.4 ? 'white' : '#1c1c19',
                        }}
                        title={
                          hasPost
                            ? `${day} ${SLOTS[sIdx].label} — ${cell.count} post, ${Math.round(avg).toLocaleString('it-IT')} engagement medio`
                            : `${day} ${SLOTS[sIdx].label} — nessun post`
                        }
                      >
                        <div className="text-center">
                          <div className="text-sm font-medium tabular">
                            {hasPost ? cell.count : '—'}
                          </div>
                          {hasPost && intensity > 0.3 && (
                            <div className="text-[10px] opacity-80 tabular leading-tight">
                              {avg >= 1000
                                ? `${(avg / 1000).toFixed(1)}K`
                                : Math.round(avg)}
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

      {/* Legenda */}
      <div className="mt-4 pt-4 border-t border-ink-200 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-ink-600">
          <span>Meno</span>
          <div className="flex gap-0.5">
            {[0.15, 0.35, 0.55, 0.75, 0.95].map((v) => (
              <div
                key={v}
                className="w-4 h-4 rounded-sm"
                style={{ background: `rgba(28, 28, 25, ${v})` }}
              />
            ))}
          </div>
          <span>Più engagement</span>
        </div>
        <div className="text-xs text-ink-500">
          Il numero nelle celle rappresenta quanti post sono stati pubblicati in quello slot
        </div>
      </div>
    </div>
  );
}
