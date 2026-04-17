'use client';

import type { AuthenticityReport } from '@/lib/analytics/authenticity';

interface Props {
  report: AuthenticityReport;
}

const RATING_MAP = {
  excellent: { label: 'Eccellente', color: '#1d9e75', bg: 'rgba(29,158,117,0.08)' },
  good: { label: 'Buono', color: '#639922', bg: 'rgba(99,153,34,0.08)' },
  suspicious: { label: 'Sospetto', color: '#ba7517', bg: 'rgba(186,117,23,0.08)' },
  poor: { label: 'Problematico', color: '#a32d2d', bg: 'rgba(163,45,45,0.08)' },
};

export function AuthenticityCard({ report }: Props) {
  const meta = RATING_MAP[report.rating];

  return (
    <section className="p-5 bg-ink-50 rounded-xl border border-ink-100">
      <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-ink-100">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-500 mb-1">
            Authenticity score
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl tabular">{report.overallScore}</span>
            <span className="text-ink-500 text-sm">/ 100</span>
          </div>
        </div>
        <div
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ background: meta.bg, color: meta.color }}
        >
          {meta.label}
        </div>
      </div>

      {/* Progress bar visuale */}
      <div className="w-full h-1.5 bg-ink-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${report.overallScore}%`,
            background: meta.color,
          }}
        />
      </div>

      {/* Signals */}
      <div className="space-y-3">
        {report.signals.map((s) => {
          const color =
            s.severity === 'danger'
              ? '#a32d2d'
              : s.severity === 'warning'
              ? '#ba7517'
              : '#1d9e75';
          return (
            <div key={s.id} className="text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-ink-800">{s.label}</span>
                <span className="tabular text-xs text-ink-500">
                  {s.score}/100
                </span>
              </div>
              <div className="w-full h-1 bg-ink-100 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${s.score}%`, background: color }}
                />
              </div>
              <p className="text-xs text-ink-500">{s.detail}</p>
            </div>
          );
        })}
      </div>

      {/* Red/Green flags */}
      {(report.redFlags.length > 0 || report.greenFlags.length > 0) && (
        <div className="mt-4 pt-4 border-t border-ink-100 space-y-1">
          {report.redFlags.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-red-700">
              <span className="mt-0.5">⚠</span>
              <span>{f}</span>
            </div>
          ))}
          {report.greenFlags.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-green-700">
              <span className="mt-0.5">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-[11px] text-ink-400 leading-relaxed">
        Lo score è un'indicazione statistica, non una certezza. Campagne pubblicitarie
        e boost legittimi possono generare pattern simili a quelli sospetti.
      </p>
    </section>
  );
}
