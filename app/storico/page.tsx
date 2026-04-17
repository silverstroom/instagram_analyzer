import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { Avatar } from '@/components/Avatar';
import { formatCompact, formatPct, formatUsd, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getHistory() {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('analyses_cache')
      .select('username, platform, analyzed_at, summary, cost_usd')
      .order('analyzed_at', { ascending: false })
      .limit(50);
    return data ?? [];
  } catch (e) {
    console.error('[storico]', e);
    return [];
  }
}

export default async function StoricoPage() {
  const rows = await getHistory();

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <nav className="mb-8">
          <Link
            href="/"
            className="text-sm text-ink-500 hover:text-ink-900 inline-flex items-center gap-1"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-4 h-4"
            >
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Home
          </Link>
        </nav>

        <header className="mb-10">
          <h1 className="font-display text-4xl mb-2">Storico ricerche</h1>
          <p className="text-ink-600">
            Ultime 50 analisi effettuate, ordinate dalla più recente.
          </p>
        </header>

        {rows.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-ink-200 rounded-xl">
            <p className="text-ink-500">Nessuna analisi salvata finora.</p>
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {rows.map((r: any) => {
              const summary = r.summary || {};
              return (
                <li key={`${r.username}_${r.platform}_${r.analyzed_at}`}>
                  <Link
                    href={`/dashboard/${r.username}`}
                    className="flex items-center gap-4 py-4 group hover:bg-ink-50 -mx-3 px-3 rounded-md transition-colors"
                  >
                    <Avatar alt={r.username} size={44} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium">@{r.username}</span>
                        <span className="text-[10px] uppercase tracking-wider text-ink-500 px-1.5 py-0.5 bg-ink-100 rounded">
                          {r.platform}
                        </span>
                      </div>
                      <div className="text-xs text-ink-500">
                        {formatDate(r.analyzed_at)} · {formatUsd(r.cost_usd || 0)}
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-6 text-sm tabular">
                      {summary.followers != null && (
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-wider text-ink-500">
                            Follower
                          </div>
                          <div className="font-medium">
                            {formatCompact(summary.followers)}
                          </div>
                        </div>
                      )}
                      {summary.engagement_rate != null && (
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-wider text-ink-500">
                            Engagement
                          </div>
                          <div className="font-medium">
                            {formatPct(summary.engagement_rate, 2)}
                          </div>
                        </div>
                      )}
                      {summary.overall_score != null && (
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-wider text-ink-500">
                            Score
                          </div>
                          <div className="font-medium">{summary.overall_score}/100</div>
                        </div>
                      )}
                    </div>

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-5 h-5 text-ink-400 group-hover:text-ink-700 group-hover:translate-x-0.5 transition"
                    >
                      <path
                        d="M9 5l7 7-7 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
