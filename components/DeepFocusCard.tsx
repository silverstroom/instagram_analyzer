'use client';

import { useState } from 'react';
import { formatUsd } from '@/lib/utils';

const DEFAULT_MODULES = [
  { id: 'posts_90', label: 'Ultimi 90 post', description: 'Trend engagement nel tempo', default: true },
  { id: 'hashtag_analysis', label: 'Mappa hashtag', description: 'Performance per tag', default: true },
  { id: 'stories', label: 'Stories attive', description: 'Ultime stories e highlights', default: false },
  { id: 'audience_quality', label: 'Audience quality', description: 'Sample per rilevare bot', default: false },
  { id: 'competitor_discovery', label: 'Competitor discovery', description: 'Profili simili suggeriti', default: true },
];

interface Props {
  username: string;
  user: any;
  onComplete: (data: any) => void;
}

export function DeepFocusCard({ username, user, onComplete }: Props) {
  const [selected, setSelected] = useState<string[]>(
    DEFAULT_MODULES.filter((m) => m.default).map((m) => m.id)
  );
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    setEstimate(null);
  };

  const calculateEstimate = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/deep-focus/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, modules: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore stima');
      setEstimate(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const executeDeepFocus = async () => {
    if (!estimate) return;
    setExecuting(true);
    setError(null);
    try {
      const res = await fetch('/api/deep-focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          modules: selected,
          confirmedCost: estimate.estimate.total,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore deep focus');
      onComplete(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <section className="relative border-2 border-ink-900 rounded-2xl p-6 md:p-8 bg-surface animate-slide-up">
      <div className="absolute -top-3 left-6 px-3 py-0.5 bg-ink-900 text-ink-50 text-[10px] uppercase tracking-widest rounded-full">
        Deep focus
      </div>

      <div className="mb-6">
        <h2 className="font-display text-2xl mb-2">
          Analisi approfondita di @{username}
        </h2>
        <p className="text-sm text-ink-600 max-w-lg">
          Seleziona i moduli che ti interessano. Vedrai il costo esatto prima di procedere.
        </p>
      </div>

      {/* Moduli */}
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        {DEFAULT_MODULES.map((m) => {
          const active = selected.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              className={`text-left p-4 rounded-lg border transition-all ${
                active
                  ? 'border-ink-900 bg-ink-50'
                  : 'border-ink-200 bg-transparent hover:border-ink-400'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-4 h-4 rounded border-2 mt-0.5 flex-shrink-0 flex items-center justify-center ${
                    active ? 'border-ink-900 bg-ink-900' : 'border-ink-300'
                  }`}
                >
                  {active && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{m.label}</div>
                  <div className="text-xs text-ink-500 mt-0.5">{m.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stima / Conferma */}
      {!estimate && (
        <button
          onClick={calculateEstimate}
          disabled={loading || selected.length === 0}
          className="w-full py-3 bg-ink-100 text-ink-900 rounded-lg text-sm font-medium hover:bg-ink-200 disabled:opacity-40 transition-colors"
        >
          {loading ? 'Calcolo stima...' : 'Calcola costo esatto'}
        </button>
      )}

      {estimate && (
        <div className="border-t border-ink-200 pt-5 mt-2 animate-fade-in">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-ink-500 mb-1">
                Costo stimato
              </div>
              <div className="font-display text-4xl tabular">
                {formatUsd(estimate.estimate.total)}
              </div>
              <div className="text-xs text-ink-500 mt-1 tabular">
                {estimate.estimate.totalRequests} request API
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-ink-500 mb-1">
                Budget residuo
              </div>
              <div className="tabular text-sm">{formatUsd(estimate.budget.remaining)}</div>
              <div className="text-xs text-ink-500 tabular">
                di {formatUsd(estimate.budget.monthlyCap)}
              </div>
            </div>
          </div>

          {estimate.budget.willExceedBudget && (
            <div className="p-3 bg-accent-50 text-accent-800 text-sm rounded-md mb-4">
              ⚠️ Questa analisi supererebbe il budget mensile configurato.
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={executeDeepFocus}
              disabled={executing || estimate.budget.willExceedBudget}
              className="flex-1 py-3 bg-ink-900 text-ink-50 rounded-lg text-sm font-medium hover:bg-ink-700 disabled:opacity-40 transition-colors"
            >
              {executing ? 'Analizzo...' : 'Conferma e avvia'}
            </button>
            <button
              onClick={() => setEstimate(null)}
              className="px-5 py-3 border border-ink-200 rounded-lg text-sm hover:bg-ink-50 transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-accent-50 text-accent-800 text-sm rounded-md">
          {error}
        </div>
      )}
    </section>
  );
}
