'use client';

import { useEffect, useState } from 'react';
import type { Evaluation } from '@/lib/evaluation/evaluator';

interface Props {
  evaluation: Evaluation;
}

const SEVERITY_STYLE = {
  positive: {
    color: '#1d9e75',
    bg: 'rgba(29,158,117,0.08)',
    border: 'rgba(29,158,117,0.25)',
  },
  neutral: {
    color: '#737369',
    bg: 'rgba(115,115,105,0.08)',
    border: 'rgba(115,115,105,0.2)',
  },
  warning: {
    color: '#ba7517',
    bg: 'rgba(186,117,23,0.08)',
    border: 'rgba(186,117,23,0.25)',
  },
  critical: {
    color: '#a32d2d',
    bg: 'rgba(163,45,45,0.08)',
    border: 'rgba(163,45,45,0.25)',
  },
};

const PRIORITY_STYLE = {
  high: { color: '#a32d2d', bg: 'rgba(163,45,45,0.1)', label: 'Alta priorità' },
  medium: { color: '#ba7517', bg: 'rgba(186,117,23,0.1)', label: 'Media priorità' },
  low: { color: '#378ADD', bg: 'rgba(55,138,221,0.1)', label: 'Bassa priorità' },
};

export function AIEvaluationBox({ evaluation }: Props) {
  const [ready, setReady] = useState(false);
  const [activeSection, setActiveSection] = useState<'storia' | 'benchmark' | 'azioni'>(
    'storia'
  );

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
      {/* Header con score */}
      <div className="px-5 md:px-7 py-5 border-b border-ink-100 flex items-center gap-3 md:gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-ink-900 text-white flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 md:w-6 md:h-6">
            <path
              d="M12 2l2.3 6.9H21l-5.6 4.1 2.2 6.9L12 15.8 6.4 19.9l2.2-6.9L3 8.9h6.7z"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-widest text-ink-500 mb-0.5">
            Valutazione AI
          </div>
          <div className="font-medium text-ink-900 text-base md:text-lg">
            Analisi interpretativa completa
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-3xl md:text-4xl tabular leading-none">
            {ready ? evaluation.scoreOverall : '—'}
          </div>
          <div className="text-xs text-ink-400 mt-1">su 100</div>
        </div>
      </div>

      {!ready ? (
        <div className="p-5 md:p-7 space-y-3">
          <div className="h-4 rounded shimmer" style={{ width: '92%' }} />
          <div className="h-4 rounded shimmer" style={{ width: '78%' }} />
          <div className="h-4 rounded shimmer" style={{ width: '85%' }} />
          <p className="text-sm text-ink-400 text-center pt-2">
            Elaborazione benchmark e insights...
          </p>
        </div>
      ) : (
        <div className="animate-fade-in">
          {/* Summary grande in alto */}
          <div className="px-5 md:px-7 py-5 bg-ink-50/50 border-b border-ink-100">
            <p className="text-base md:text-lg text-ink-900 leading-relaxed font-medium">
              {evaluation.summary}
            </p>
          </div>

          {/* Tabs interne */}
          <div className="px-5 md:px-7 pt-5">
            <div className="flex gap-1 p-1 bg-ink-100 rounded-full w-fit">
              {[
                { id: 'storia', label: 'Storia' },
                { id: 'benchmark', label: 'Benchmark' },
                { id: 'azioni', label: `Azioni (${evaluation.actions.length})` },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveSection(t.id as any)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeSection === t.id
                      ? 'bg-white text-ink-900 shadow-sm'
                      : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contenuto tab */}
          <div className="px-5 md:px-7 pb-6 pt-5">
            {activeSection === 'storia' && (
              <div className="space-y-5 animate-fade-in">
                <p className="text-base text-ink-700 leading-relaxed">
                  {evaluation.storyline}
                </p>

                <div className="grid md:grid-cols-3 gap-3">
                  <PointsList
                    title="Punti di forza"
                    items={evaluation.strengths}
                    color="#1d9e75"
                  />
                  <PointsList
                    title="Criticità"
                    items={evaluation.weaknesses}
                    color="#a32d2d"
                  />
                  <PointsList
                    title="Opportunità"
                    items={evaluation.opportunities}
                    color="#378ADD"
                  />
                </div>

                {evaluation.insights.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs uppercase tracking-widest text-ink-500">
                      Insight rilevanti
                    </div>
                    {evaluation.insights.map((ins) => {
                      const style = SEVERITY_STYLE[ins.severity];
                      return (
                        <div
                          key={ins.id}
                          className="rounded-lg border px-4 py-3 flex gap-3"
                          style={{ background: style.bg, borderColor: style.border }}
                        >
                          <span
                            className="text-xl shrink-0 leading-none mt-0.5"
                            style={{ color: style.color }}
                          >
                            {ins.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-base text-ink-900 mb-1">
                              {ins.title}
                            </div>
                            <div className="text-sm text-ink-700 leading-relaxed">
                              {ins.detail}
                            </div>
                            {ins.suggestion && (
                              <div
                                className="mt-2 pt-2 border-t text-sm font-medium"
                                style={{
                                  color: style.color,
                                  borderColor: style.border,
                                }}
                              >
                                → {ins.suggestion}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'benchmark' && (
              <div className="space-y-3 animate-fade-in">
                <p className="text-sm text-ink-600 mb-3">
                  Confronto tra i tuoi dati e le medie del settore per profili della tua dimensione.
                </p>
                {evaluation.benchmarks.map((b, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-ink-100 bg-ink-50 p-4"
                  >
                    <div className="flex items-center justify-between mb-2 gap-3">
                      <div className="text-sm font-medium text-ink-900">{b.label}</div>
                      <div
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          b.isGood
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.delta > 0 ? '+' : ''}
                        {b.delta.toFixed(0)}%
                      </div>
                    </div>
                    <div className="flex items-baseline gap-4 text-sm">
                      <div>
                        <span className="text-ink-500">Tu: </span>
                        <span className="font-display text-xl tabular">
                          {b.yourValue}
                        </span>
                      </div>
                      <div className="text-ink-500">
                        Media: <span className="text-ink-700">{b.industryAvg}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'azioni' && (
              <div className="space-y-3 animate-fade-in">
                {evaluation.actions.length === 0 ? (
                  <p className="text-sm text-ink-600 py-6 text-center">
                    Nessuna azione urgente identificata. Il profilo è in buona forma.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-ink-600 mb-3">
                      Azioni consigliate in ordine di priorità con impatto stimato.
                    </p>
                    {evaluation.actions.map((a, i) => {
                      const style = PRIORITY_STYLE[a.priority];
                      return (
                        <div
                          key={i}
                          className="rounded-lg border border-ink-100 bg-white p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium tabular"
                              style={{ background: style.bg, color: style.color }}
                            >
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span
                                  className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium"
                                  style={{ background: style.bg, color: style.color }}
                                >
                                  {style.label}
                                </span>
                              </div>
                              <div className="font-medium text-base text-ink-900 mb-1">
                                {a.title}
                              </div>
                              <div className="text-sm text-ink-700 leading-relaxed mb-2">
                                {a.detail}
                              </div>
                              <div className="text-sm font-medium" style={{ color: style.color }}>
                                Impatto stimato: {a.estimatedImpact}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function PointsList({
  title,
  items,
  color,
}: {
  title: string;
  items: string[];
  color: string;
}) {
  return (
    <div className="rounded-lg p-3 bg-ink-50 border border-ink-100">
      <div
        className="text-xs uppercase tracking-widest mb-2 font-medium"
        style={{ color }}
      >
        {title}
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-ink-400">—</div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it, i) => (
            <li
              key={i}
              className="text-sm text-ink-800 leading-snug flex gap-1.5"
            >
              <span style={{ color }} className="shrink-0">
                ·
              </span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
