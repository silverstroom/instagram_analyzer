'use client';

import type { OptimizationChecklist } from '@/lib/evaluation/checklist';
import type { NormalizedProfile, NormalizedPost } from '@/lib/scrapecreators/normalizer';

interface Props {
  checklist: OptimizationChecklist;
  profile: NormalizedProfile;
  posts: NormalizedPost[];
}

/**
 * Card "Azioni consigliate" costruita dalla checklist + pattern.
 * Toni costruttivi, mai giudicanti. Ogni azione ha il "come" non solo il "cosa".
 */
export function StrategyActionsCard({ checklist, profile, posts }: Props) {
  const failedItems = checklist.items.filter((i) => i.status === 'fail' && i.howToFix);
  const warnItems = checklist.items.filter((i) => i.status === 'warn' && i.howToFix);

  // Se tutto passato o non ci sono azioni howToFix, mostra messaggio positivo
  if (failedItems.length === 0 && warnItems.length === 0) {
    return (
      <section className="rounded-2xl border border-green-200 bg-green-50 p-6">
        <h3 className="font-display text-xl md:text-2xl mb-2 text-green-900">
          Profilo in forma eccellente
        </h3>
        <p className="text-base text-green-900 leading-relaxed">
          Non emergono azioni urgenti dalla checklist. Mantieni la frequenza di pubblicazione e
          continua a sperimentare con i formati che performano meglio.
        </p>
      </section>
    );
  }

  const highPriority = failedItems.slice(0, 3);
  const mediumPriority = [...failedItems.slice(3), ...warnItems].slice(0, 3);

  return (
    <section className="rounded-2xl border-2 border-ink-200 bg-white overflow-hidden">
      <div className="px-5 md:px-7 py-5 border-b border-ink-100 bg-ink-50/50">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-ink-900 text-white flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 md:w-6 md:h-6">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-ink-700 mb-0.5">
              Strategia di intervento
            </div>
            <h3 className="font-display text-2xl md:text-3xl text-ink-900 leading-tight">
              Cosa fare per migliorare
            </h3>
          </div>
        </div>
        <p className="text-sm text-ink-700 mt-2">
          Azioni concrete e prioritizzate basate sulla checklist di ottimizzazione.
          Ognuna spiega il "come", non solo il "cosa".
        </p>
      </div>

      {/* Azioni alta priorità */}
      {highPriority.length > 0 && (
        <div className="px-5 md:px-7 py-5 border-b border-ink-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold">
              !
            </span>
            <h4 className="font-semibold text-base text-ink-900">
              Alta priorità ({highPriority.length})
            </h4>
          </div>
          <div className="space-y-3">
            {highPriority.map((item, i) => (
              <ActionItem key={item.id} item={item} number={i + 1} tone="high" />
            ))}
          </div>
        </div>
      )}

      {/* Azioni media priorità */}
      {mediumPriority.length > 0 && (
        <div className="px-5 md:px-7 py-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold">
              !
            </span>
            <h4 className="font-semibold text-base text-ink-900">
              Media priorità ({mediumPriority.length})
            </h4>
          </div>
          <div className="space-y-3">
            {mediumPriority.map((item, i) => (
              <ActionItem key={item.id} item={item} number={highPriority.length + i + 1} tone="medium" />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ActionItem({
  item,
  number,
  tone,
}: {
  item: { label: string; detail: string; howToFix?: string };
  number: number;
  tone: 'high' | 'medium';
}) {
  const color = tone === 'high' ? '#a32d2d' : '#8a5800';
  const bg = tone === 'high' ? 'rgba(163,45,45,0.05)' : 'rgba(186,117,23,0.06)';
  const border = tone === 'high' ? 'rgba(163,45,45,0.25)' : 'rgba(186,117,23,0.25)';

  return (
    <div className="rounded-lg border p-4" style={{ background: bg, borderColor: border }}>
      <div className="flex items-start gap-3">
        <span
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm tabular"
          style={{ background: color }}
        >
          {number}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base text-ink-900 mb-1">{item.label}</div>
          <div className="text-sm text-ink-800 leading-relaxed mb-2">
            <strong>Stato attuale:</strong> {item.detail}
          </div>
          {item.howToFix && (
            <div
              className="text-sm leading-relaxed pt-2 border-t"
              style={{ color, borderColor: border }}
            >
              <strong>Azione:</strong> <span className="text-ink-800">{item.howToFix}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
