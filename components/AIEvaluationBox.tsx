'use client';

import { useEffect, useState } from 'react';
import type { Evaluation, Insight } from '@/lib/evaluation/evaluator';

interface Props {
  evaluation: Evaluation;
}

const SEVERITY_MAP = {
  positive: { color: '#1d9e75', bg: 'rgba(29,158,117,0.08)', border: 'rgba(29,158,117,0.25)' },
  neutral: { color: '#737369', bg: 'rgba(115,115,105,0.08)', border: 'rgba(115,115,105,0.2)' },
  warning: { color: '#ba7517', bg: 'rgba(186,117,23,0.08)', border: 'rgba(186,117,23,0.25)' },
  critical: { color: '#a32d2d', bg: 'rgba(163,45,45,0.08)', border: 'rgba(163,45,45,0.25)' },
};

/**
 * Box "Valutazione AI" con animazione shimmer iniziale e insights uno per volta.
 * Interattivo: click su un insight per espandere il suggerimento.
 */
export function AIEvaluationBox({ evaluation }: Props) {
  const [ready, setReady] = useState(false);
  const [visibleInsights, setVisibleInsights] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // Simula un brief "thinking" per dare sensazione AI
    const t1 = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (!ready) return;
    // Mostra insights progressivamente
    if (visibleInsights < evaluation.insights.length) {
      const t = setTimeout(() => setVisibleInsights((v) => v + 1), 180);
      return () => clearTimeout(t);
    }
  }, [ready, visibleInsights, evaluation.insights.length]);

  return (
    <section className="relative rounded-2xl border border-ink-200 bg-gradient-to-br from-ink-50/50 to-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-ink-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-ink-900 text-white flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
            <path
              d="M12 2l2.3 6.9H21l-5.6 4.1 2.2 6.9L12 15.8 6.4 19.9l2.2-6.9L3 8.9h6.7z"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-ink-500">
            Valutazione AI
          </div>
          <div className="font-medium text-ink-900">Analisi interpretativa dei dati</div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-2xl tabular">
            {ready ? evaluation.scoreOverall : '—'}
            <span className="text-ink-400 text-sm"> /100</span>
          </div>
        </div>
      </div>

      {/* Shimmer loading */}
      {!ready && (
        <div className="p-6 space-y-3">
          <ShimmerLine width="90%" />
          <ShimmerLine width="75%" />
          <ShimmerLine width="82%" />
          <div className="pt-3 text-[11px] text-ink-400 text-center animate-pulse">
            Elaborazione degli indicatori...
          </div>
        </div>
      )}

      {/* Summary + insights */}
      {ready && (
        <div className="p-6 space-y-5">
          <p className="text-ink-800 leading-relaxed animate-fade-in">
            {evaluation.summary}
          </p>

          {/* Strengths / Weaknesses / Opportunities in 3 colonne */}
          <div className="grid md:grid-cols-3 gap-3">
            <PointsList title="Punti di forza" items={evaluation.strengths} color="#1d9e75" />
            <PointsList title="Criticità" items={evaluation.weaknesses} color="#a32d2d" />
            <PointsList title="Opportunità" items={evaluation.opportunities} color="#378ADD" />
          </div>

          {/* Insights */}
          <div className="space-y-2">
            {evaluation.insights.slice(0, visibleInsights).map((ins, idx) => (
              <InsightCard
                key={ins.id}
                insight={ins}
                expanded={expandedId === ins.id}
                onToggle={() =>
                  setExpandedId(expandedId === ins.id ? null : ins.id)
                }
                delay={idx * 60}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ShimmerLine({ width }: { width: string }) {
  return (
    <div
      className="h-3 rounded animate-pulse"
      style={{
        width,
        background:
          'linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.06) 75%)',
        backgroundSize: '200% 100%',
      }}
    />
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
  if (items.length === 0) {
    return (
      <div className="rounded-lg p-3 bg-ink-50 border border-ink-100">
        <div className="text-[10px] uppercase tracking-widest text-ink-500 mb-2">
          {title}
        </div>
        <div className="text-sm text-ink-400">Nessun elemento rilevato</div>
      </div>
    );
  }
  return (
    <div className="rounded-lg p-3 bg-ink-50 border border-ink-100">
      <div
        className="text-[10px] uppercase tracking-widest mb-2"
        style={{ color }}
      >
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-ink-700 leading-snug flex gap-1.5">
            <span style={{ color }}>·</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InsightCard({
  insight,
  expanded,
  onToggle,
  delay,
}: {
  insight: Insight;
  expanded: boolean;
  onToggle: () => void;
  delay: number;
}) {
  const style = SEVERITY_MAP[insight.severity];

  return (
    <div
      className="rounded-lg border transition-all animate-fade-in"
      style={{
        background: style.bg,
        borderColor: style.border,
        animationDelay: `${delay}ms`,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-black/5 transition-colors"
        disabled={!insight.suggestion}
      >
        <span
          className="text-lg leading-none shrink-0 mt-0.5"
          style={{ color: style.color }}
        >
          {insight.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-ink-900">{insight.title}</div>
          <div className="text-xs text-ink-600 mt-0.5 leading-relaxed">
            {insight.detail}
          </div>
          {expanded && insight.suggestion && (
            <div
              className="mt-2 pt-2 border-t text-xs font-medium animate-slide-up"
              style={{ color: style.color, borderColor: style.border }}
            >
              Suggerimento: {insight.suggestion}
            </div>
          )}
        </div>
        {insight.suggestion && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`w-4 h-4 text-ink-400 transition-transform shrink-0 mt-1 ${
              expanded ? 'rotate-180' : ''
            }`}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  );
}
