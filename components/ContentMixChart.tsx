'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { HikerMedia } from '@/lib/hikerapi/types';
import { formatPct } from '@/lib/utils';

interface Props {
  posts: HikerMedia[];
}

const COLORS = {
  photo: '#7F77DD',
  video: '#1D9E75',
  carousel: '#D85A30',
};

export function ContentMixChart({ posts }: Props) {
  if (posts.length === 0) return null;

  const video = posts.filter(
    (p) => p.media_type === 2 || p.product_type === 'clips'
  ).length;
  const carousel = posts.filter((p) => p.media_type === 8).length;
  const photo = posts.length - video - carousel;

  const data = [
    { name: 'Foto', value: photo, color: COLORS.photo },
    { name: 'Video / Reels', value: video, color: COLORS.video },
    { name: 'Carousel', value: carousel, color: COLORS.carousel },
  ].filter((d) => d.value > 0);

  // Engagement medio per tipologia
  const avgEngByType: Record<string, number> = {
    Foto: 0,
    'Video / Reels': 0,
    Carousel: 0,
  };
  const countByType: Record<string, number> = {
    Foto: 0,
    'Video / Reels': 0,
    Carousel: 0,
  };
  for (const p of posts) {
    const eng = (p.like_count || 0) + (p.comment_count || 0);
    if (p.media_type === 2 || p.product_type === 'clips') {
      avgEngByType['Video / Reels'] += eng;
      countByType['Video / Reels']++;
    } else if (p.media_type === 8) {
      avgEngByType.Carousel += eng;
      countByType.Carousel++;
    } else {
      avgEngByType.Foto += eng;
      countByType.Foto++;
    }
  }

  return (
    <div className="p-5 rounded-xl border border-ink-100 bg-ink-50">
      <div className="text-[10px] uppercase tracking-widest text-ink-500 mb-3">
        Mix dei contenuti
      </div>

      <div className="flex items-center gap-4">
        <div style={{ width: 140, height: 140 }} className="shrink-0">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '0.5px solid rgba(0,0,0,0.15)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {data.map((d) => {
            const pct = (d.value / posts.length) * 100;
            const avgEng = countByType[d.name]
              ? avgEngByType[d.name] / countByType[d.name]
              : 0;
            return (
              <div key={d.name} className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ background: d.color }}
                    />
                    <span className="text-ink-800">{d.name}</span>
                  </span>
                  <span className="tabular text-ink-600 text-xs">
                    {d.value} · {formatPct(pct, 0)}
                  </span>
                </div>
                <div className="text-[10px] text-ink-500 mt-0.5 ml-4.5 tabular">
                  avg {Math.round(avgEng).toLocaleString('it-IT')} engagement
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
