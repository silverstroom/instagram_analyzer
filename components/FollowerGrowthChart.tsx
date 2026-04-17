'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { formatCompact } from '@/lib/utils';

interface Props {
  snapshots: Array<{
    snapshot_date: string;
    follower_count: number;
    following_count?: number;
    media_count?: number;
  }>;
}

export function FollowerGrowthChart({ snapshots }: Props) {
  if (!snapshots || snapshots.length < 2) {
    return (
      <div className="p-6 bg-ink-50 rounded-xl border border-ink-100 text-center text-sm text-ink-500">
        <p className="mb-1">Il grafico di crescita appare dopo almeno 2 giorni di tracking.</p>
        <p className="text-xs">
          {snapshots.length === 0
            ? 'Nessuno snapshot ancora registrato.'
            : `Al momento c'è 1 solo snapshot: tornare domani per vedere l'andamento.`}
        </p>
      </div>
    );
  }

  const data = snapshots.map((s) => ({
    date: s.snapshot_date,
    follower: s.follower_count,
    dateShort: new Date(s.snapshot_date).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
    }),
  }));

  const first = snapshots[0].follower_count;
  const last = snapshots[snapshots.length - 1].follower_count;
  const delta = last - first;
  const deltaPct = first > 0 ? ((delta / first) * 100) : 0;

  return (
    <div className="p-5 bg-ink-50 rounded-xl border border-ink-100">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-500 mb-1">
            Crescita follower
          </div>
          <div className="font-display text-lg">
            {snapshots.length} snapshot · {snapshots[0].snapshot_date} →{' '}
            {snapshots[snapshots.length - 1].snapshot_date}
          </div>
        </div>
        <div className="text-right">
          <div
            className={`text-sm font-medium ${
              delta > 0 ? 'text-green-700' : delta < 0 ? 'text-red-700' : 'text-ink-600'
            }`}
          >
            {delta > 0 ? '+' : ''}
            {delta.toLocaleString('it-IT')}
          </div>
          <div className="text-xs text-ink-500">
            {deltaPct > 0 ? '+' : ''}
            {deltaPct.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis
              dataKey="dateShort"
              tick={{ fontSize: 11, fill: '#737369' }}
              axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#737369' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCompact(v)}
              width={45}
            />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '0.5px solid rgba(0,0,0,0.15)',
                borderRadius: '8px',
                fontSize: '13px',
              }}
              formatter={(value: number) => [
                value.toLocaleString('it-IT'),
                'Follower',
              ]}
            />
            <Line
              type="monotone"
              dataKey="follower"
              stroke="#1c1c19"
              strokeWidth={2}
              dot={{ r: 3, fill: '#1c1c19' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
