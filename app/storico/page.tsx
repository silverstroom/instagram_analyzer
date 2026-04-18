import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { Avatar } from '@/components/Avatar';
import { StoricoFilters } from '@/components/StoricoFilters';
import { formatCompact, formatDate } from '@/lib/utils';
import type { Platform } from '@/lib/scrapecreators/client';

export const dynamic = 'force-dynamic';

async function getAllHistory(platform?: string, days?: number) {
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('analyses_cache')
      .select('username, platform, analyzed_at, summary, profile_pic_url')
      .order('analyzed_at', { ascending: false });

    if (platform && platform !== 'all') {
      query = query.eq('platform', platform);
    }

    if (days && days > 0) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      query = query.gte('analyzed_at', since.toISOString());
    }

    const { data } = await query.limit(500);
    return data ?? [];
  } catch (e) {
    console.error('[storico]', e);
    return [];
  }
}

export default async function StoricoPage({
  searchParams,
}: {
  searchParams: { platform?: string; days?: string };
}) {
  const platform = searchParams.platform || 'all';
  const days = searchParams.days ? parseInt(searchParams.days, 10) : 0;

  const rows = await getAllHistory(platform, days);

  // Conta per platform per le pill filter
  const countsByPlatform: Record<string, number> = {};
  const allRows = await getAllHistory('all', 0);
  for (const r of allRows) {
    countsByPlatform[r.platform] = (countsByPlatform[r.platform] || 0) + 1;
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <nav className="mb-6">
          <Link
            href="/"
            className="text-sm text-ink-700 hover:text-ink-900 inline-flex items-center gap-1"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Home
          </Link>
        </nav>

        <header className="mb-8">
          <h1 className="font-display text-3xl md:text-5xl mb-2 text-ink-900">Storico ricerche</h1>
          <p className="text-base text-ink-700">
            Tutte le analisi salvate. Clicca su una riga per riaprire i dati dalla cache (istantaneo,
            nessun nuovo scan).
          </p>
        </header>

        <StoricoFilters
          currentPlatform={platform}
          currentDays={days}
          counts={countsByPlatform}
          total={allRows.length}
        />

        {rows.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-ink-200 rounded-xl">
            <p className="text-base text-ink-700">
              Nessuna analisi trovata con questi filtri.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-ink-100 mt-6">
            {rows.map((r: any) => {
              const summary = r.summary || {};
              return (
                <li key={`${r.username}_${r.platform}_${r.analyzed_at}`}>
                  <Link
                    href={`/dashboard/${r.platform}/${encodeURIComponent(r.username)}`}
                    className="flex items-center gap-4 py-4 group hover:bg-ink-50 -mx-3 px-3 rounded-md transition-colors"
                  >
                    <Avatar src={r.profile_pic_url} alt={r.username} size={44} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-ink-900">@{r.username}</span>
                        <span className="text-[10px] uppercase tracking-wider text-ink-700 px-1.5 py-0.5 bg-ink-100 rounded shrink-0">
                          {r.platform}
                        </span>
                        {summary.is_verified && (
                          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                            <path
                              d="M12 2l2.39 2.39 3.3-.43.43 3.3L20.5 10l-2.39 2.39.43 3.3-3.3.43L12 19l-2.39-2.39-3.3.43-.43-3.3L3.5 12l2.39-2.39-.43-3.3 3.3-.43L12 2z"
                              fill="#1877F2"
                            />
                            <path d="M10.5 14.5l-2-2 1-1 1 1 3-3 1 1-4 4z" fill="white" />
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-ink-700">{formatDate(r.analyzed_at)}</div>
                    </div>

                    <div className="hidden md:flex items-center gap-6 text-sm tabular">
                      {summary.followers != null && (
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-wider text-ink-700">Follower</div>
                          <div className="font-medium text-ink-900">
                            {formatCompact(summary.followers)}
                          </div>
                        </div>
                      )}
                      {summary.checklist_score != null && (
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-wider text-ink-700">Score</div>
                          <div className="font-medium text-ink-900">{summary.checklist_score}/100</div>
                        </div>
                      )}
                    </div>

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-5 h-5 text-ink-500 group-hover:text-ink-900 group-hover:translate-x-0.5 transition shrink-0"
                    >
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-8 text-center text-sm text-ink-700">
          {rows.length} risultat{rows.length === 1 ? 'o' : 'i'} su {allRows.length} totali
        </div>
      </div>
    </main>
  );
}
