import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { SearchBar } from '@/components/SearchBar';
import { BudgetIndicator } from '@/components/BudgetIndicator';
import { formatCompact } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getTrackedProfiles() {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('tracked_profiles')
      .select('username, role, added_at')
      .order('added_at', { ascending: false })
      .limit(20);

    if (!data || data.length === 0) return [];

    // Carica ultimo snapshot per ogni profilo
    const usernames = data.map((p) => p.username);
    const { data: snapshots } = await supabase
      .from('profile_snapshots')
      .select('username, follower_count, full_name, profile_pic_url, snapshot_date')
      .in('username', usernames)
      .order('snapshot_date', { ascending: false });

    const latestByUser = new Map<string, any>();
    (snapshots ?? []).forEach((s: any) => {
      if (!latestByUser.has(s.username)) latestByUser.set(s.username, s);
    });

    return data.map((p) => ({
      ...p,
      snapshot: latestByUser.get(p.username) || null,
    }));
  } catch (e) {
    console.error('[home] tracked profiles error:', e);
    return [];
  }
}

export default async function HomePage() {
  const tracked = await getTrackedProfiles();

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">

        <header className="mb-16 animate-fade-in">
          <div className="flex items-center justify-between mb-12">
            <span className="text-xs tracking-widest uppercase text-ink-500">
              Internal tool · v0.1
            </span>
            <BudgetIndicator />
          </div>

          <h1 className="font-display text-5xl md:text-7xl leading-none mb-6">
            Instagram
            <br />
            <span className="italic text-accent-600">Analyzer</span>
          </h1>

          <p className="text-ink-600 text-lg max-w-xl leading-relaxed">
            Inserisci uno username per un'analisi rapida gratuita.
            Attiva il deep focus solo quando serve davvero, con costo esatto in anticipo.
          </p>
        </header>

        <div className="mb-20 animate-slide-up">
          <SearchBar />
        </div>

        {tracked.length > 0 && (
          <section className="animate-slide-up">
            <div className="flex items-baseline justify-between mb-6 pb-3 border-b border-ink-200">
              <h2 className="font-display text-2xl">Profili monitorati</h2>
              <span className="text-xs text-ink-500 tabular">
                {tracked.length} trackati
              </span>
            </div>

            <ul className="divide-y divide-ink-100">
              {tracked.map((p) => (
                <li key={p.username}>
                  <Link
                    href={`/dashboard/${p.username}`}
                    className="flex items-center gap-4 py-4 group hover:bg-ink-50 -mx-3 px-3 rounded-md transition-colors"
                  >
                    {p.snapshot?.profile_pic_url ? (
                      <img
                        src={p.snapshot.profile_pic_url}
                        alt={p.username}
                        className="w-11 h-11 rounded-full object-cover bg-ink-200"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-ink-200 flex items-center justify-center text-ink-600 text-sm font-medium uppercase">
                        {p.username.slice(0, 2)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">@{p.username}</span>
                        {p.role === 'competitor' && (
                          <span className="text-[10px] uppercase tracking-wider text-ink-500 px-1.5 py-0.5 bg-ink-100 rounded">
                            competitor
                          </span>
                        )}
                      </div>
                      {p.snapshot?.full_name && (
                        <div className="text-sm text-ink-500 truncate">
                          {p.snapshot.full_name}
                        </div>
                      )}
                    </div>

                    {p.snapshot?.follower_count != null && (
                      <div className="text-right tabular">
                        <div className="text-sm font-medium">
                          {formatCompact(p.snapshot.follower_count)}
                        </div>
                        <div className="text-xs text-ink-500">follower</div>
                      </div>
                    )}

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-5 h-5 text-ink-400 group-hover:text-ink-700 group-hover:translate-x-0.5 transition"
                    >
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tracked.length === 0 && (
          <section className="text-center py-12 border border-dashed border-ink-200 rounded-xl animate-slide-up">
            <p className="text-ink-500">
              Nessun profilo monitorato. Inserisci uno username sopra per iniziare.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
