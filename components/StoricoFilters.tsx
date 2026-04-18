'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface Props {
  currentPlatform: string;
  currentDays: number;
  counts: Record<string, number>;
  total: number;
}

const PLATFORMS = [
  { id: 'all', label: 'Tutti' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'twitter', label: 'Twitter' },
];

const TIME_RANGES = [
  { days: 0, label: 'Sempre' },
  { days: 7, label: 'Ultimi 7 giorni' },
  { days: 30, label: 'Ultimi 30 giorni' },
  { days: 90, label: 'Ultimi 90 giorni' },
];

export function StoricoFilters({ currentPlatform, currentDays, counts, total }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(key: string, value: string | number) {
    const params = new URLSearchParams(searchParams);
    if ((key === 'platform' && value === 'all') || (key === 'days' && Number(value) === 0)) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    router.push(`/storico${params.toString() ? `?${params.toString()}` : ''}`);
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs uppercase tracking-widest text-ink-700 mb-2">Social</div>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const isActive = currentPlatform === p.id;
            const count = p.id === 'all' ? total : counts[p.id] || 0;
            return (
              <button
                key={p.id}
                onClick={() => setFilter('platform', p.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-ink-900 text-white'
                    : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                }`}
              >
                {p.label}
                <span
                  className={`text-xs tabular ${
                    isActive ? 'text-ink-300' : 'text-ink-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-ink-700 mb-2">Periodo</div>
        <div className="flex flex-wrap gap-2">
          {TIME_RANGES.map((r) => {
            const isActive = currentDays === r.days;
            return (
              <button
                key={r.days}
                onClick={() => setFilter('days', r.days)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-ink-900 text-white'
                    : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
