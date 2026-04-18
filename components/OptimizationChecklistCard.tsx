'use client';

import { useState } from 'react';
import type { OptimizationChecklist } from '@/lib/evaluation/checklist';

interface Props {
  checklist: OptimizationChecklist;
}

const STATUS_STYLE = {
  pass: {
    color: '#0a7a55',
    bg: 'rgba(29,158,117,0.08)',
    border: 'rgba(29,158,117,0.3)',
    icon: '✓',
  },
  warn: {
    color: '#8a5800',
    bg: 'rgba(186,117,23,0.1)',
    border: 'rgba(186,117,23,0.3)',
    icon: '!',
  },
  fail: {
    color: '#a32d2d',
    bg: 'rgba(163,45,45,0.08)',
    border: 'rgba(163,45,45,0.3)',
    icon: '×',
  },
};

/**
 * Card checklist con voci di ottimizzazione profilo.
 * Espandibile: click su una voce per vedere il "come risolvere".
 */
export function OptimizationChecklistCard({ checklist }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const scoreColor =
    checklist.score >= 80 ? '#0a7a55' : checklist.score >= 60 ? '#8a5800' : '#a32d2d';

  return (
    <section className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
      {/* Header con score */}
      <div className="px-5 md:px-7 py-5 border-b border-ink-100">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-widest text-ink-600 mb-1">
              Checklist ottimizzazione profilo
            </div>
            <h3 className="font-display text-xl md:text-2xl text-ink-900">
              Punteggio di idoneità
            </h3>
            <p className="text-sm text-ink-700 mt-1">
              {checklist.passed} superati · {checklist.warnings} da migliorare · {checklist.failed} critici
            </p>
          </div>
          <div className="text-right">
            <div className="font-display text-4xl md:text-5xl tabular leading-none" style={{ color: scoreColor }}>
              {checklist.score}
            </div>
            <div className="text-sm text-ink-600 mt-1">su 100</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-ink-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${checklist.score}%`, background: scoreColor }}
          />
        </div>
      </div>

      {/* Lista voci */}
      <div className="p-3 md:p-4 space-y-2">
        {checklist.items.map((item) => {
          const style = STATUS_STYLE[item.status];
          const isExpanded = expandedId === item.id;
          const canExpand = !!item.howToFix;

          return (
            <div
              key={item.id}
              className="rounded-lg border transition-all"
              style={{ background: style.bg, borderColor: style.border }}
            >
              <button
                onClick={() => canExpand && setExpandedId(isExpanded ? null : item.id)}
                className="w-full text-left p-3 md:p-4 flex items-start gap-3"
                disabled={!canExpand}
              >
                <span
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: style.color, color: 'white' }}
                >
                  {style.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-base text-ink-900">{item.label}</div>
                  <div className="text-sm text-ink-700 mt-0.5 leading-relaxed">
                    {item.detail}
                  </div>
                  {canExpand && isExpanded && (
                    <div
                      className="mt-3 pt-3 border-t text-sm leading-relaxed"
                      style={{ borderColor: style.border, color: style.color }}
                    >
                      <div className="font-semibold mb-1">Come risolvere:</div>
                      <div className="text-ink-800">{item.howToFix}</div>
                    </div>
                  )}
                </div>
                {canExpand && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`w-4 h-4 mt-1 text-ink-500 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
