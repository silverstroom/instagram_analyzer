import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { Avatar } from '@/components/Avatar';
import { SocialScanForm } from '@/components/SocialScanForm';
import { formatCompact, formatDate, formatUsd } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getRecentAnalyses() {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('analyses_cache')
      .select('username, platform, analyzed_at, summary, cost_usd, profile_pic_url')
      .order('analyzed_at', { ascending: false })
      .limit(12);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const recent = await getRecentAnalyses();

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-14">
        <header className="mb-10 md:mb-14 text-center">
          <h1 className="font-display text-4xl md:text-6xl mb-4 text-ink-900 leading-tight">
            Analizza qualsiasi profilo social
          </h1>
          <p className="text-base md:text-lg text-ink-700 max-w-2xl mx-auto">
            Scegli su quali social fare lo scan e incolla lo username del profilo.
            Il tool recupera dati pubblici da Instagram, Facebook, TikTok, YouTube, LinkedIn e Twitter.
          </p>
        </header>

        <SocialScanForm />

        {recent.length > 0 && (
          <section className="mt-14 md:mt-20">
            <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
              <h2 className="font-display text-2xl md:text-3xl text-ink-900">
                Analisi recenti
              </h2>
              <Link
                href="/storico"
                className="text-sm text-ink-600 hover:text-ink-900 underline"
              >
                Vedi tutto lo storico →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recent.map((r: any) => {
                const summary = r.summary || {};
                return (
                  <Link
                    key={`${r.username}_${r.platform}_${r.analyzed_at}`}
                    href={`/dashboard/${r.platform}/${r.username}`}
                    className="group p-4 rounded-xl border border-ink-100 bg-white hover:border-ink-300 hover:shadow-sm transition-all flex items-center gap-3"
                  >
                    <Avatar src={r.profile_pic_url} alt={r.username} size={48} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-ink-900 truncate">
                          @{r.username}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-ink-600 px-1.5 py-0.5 bg-ink-100 rounded shrink-0">
                          {r.platform}
                        </span>
                      </div>
                      <div className="text-xs text-ink-600 flex items-center gap-2 flex-wrap">
                        <span>{formatDate(r.analyzed_at)}</span>
                        {summary.followers != null && (
                          <span className="tabular">· {formatCompact(summary.followers)} follower</span>
                        )}
                      </div>
                    </div>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-4 h-4 text-ink-500 group-hover:text-ink-900 group-hover:translate-x-0.5 transition shrink-0"
                    >
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
