'use client';

import { useState } from 'react';
import { Avatar } from './Avatar';
import { VerifiedBadge } from './VerifiedBadge';
import { TagCloud } from './TagCloud';
import { formatCompact, formatUsd } from '@/lib/utils';

interface Props {
  igUsername: string;
}

/**
 * FacebookPanel v4: struttura completa come Instagram tab.
 * Include pagina + post + ADS attive/inattive + tag cloud + metriche.
 */
export function FacebookPanel({ igUsername }: Props) {
  const [state, setState] = useState<
    | { stage: 'idle' }
    | { stage: 'searching' }
    | { stage: 'picker'; candidates: any[] }
    | { stage: 'loading' }
    | { stage: 'loaded'; data: any }
    | { stage: 'error'; message: string }
  >({ stage: 'idle' });

  const [adsFilter, setAdsFilter] = useState<'all' | 'active' | 'inactive'>('all');

  async function startSearch() {
    setState({ stage: 'searching' });
    try {
      const res = await fetch(
        `/api/facebook/search?q=${encodeURIComponent(igUsername)}&country=IT`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Errore ${res.status}`);
      }
      const data = await res.json();
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Nessuna pagina Facebook trovata per questo nome.');
      }
      if (data.candidates.length === 1) {
        await loadPage(data.candidates[0].page_id);
      } else {
        setState({
          stage: 'picker',
          candidates: data.candidates.slice(0, 5),
        });
      }
    } catch (e: any) {
      setState({ stage: 'error', message: e.message });
    }
  }

  async function loadPage(pageId: string) {
    setState({ stage: 'loading' });
    try {
      const res = await fetch(`/api/facebook-page/${pageId}?country=IT`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Errore ${res.status}`);
      }
      const data = await res.json();
      setState({ stage: 'loaded', data });
    } catch (e: any) {
      setState({ stage: 'error', message: e.message });
    }
  }

  // IDLE
  if (state.stage === 'idle') {
    return (
      <div className="rounded-2xl border-2 border-dashed border-ink-200 p-8 md:p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ink-100 mb-5">
          <svg viewBox="0 0 24 24" fill="#1877F2" className="w-8 h-8">
            <path d="M14 13.5h2.5l1-4H14V7c0-1.03 0-2 2-2h1.5V1.64S16.19 1.5 14.62 1.5C10.96 1.5 9 3.92 9 7.07V9.5H6V13.5H9V22h5V13.5z" />
          </svg>
        </div>
        <h3 className="font-display text-2xl mb-3">Analisi Facebook completa</h3>
        <p className="text-base text-ink-600 max-w-lg mx-auto mb-6 leading-relaxed">
          Cercheremo la pagina Facebook collegata a <strong>@{igUsername}</strong> e
          analizzeremo follower, post recenti, engagement e <strong>tutte le ADS
          attive e concluse</strong> via Meta Ad Library.
        </p>
        <div className="inline-flex flex-col items-center gap-2">
          <button
            onClick={startSearch}
            className="px-6 py-3 bg-ink-900 text-white rounded-full text-base font-medium hover:bg-ink-700 transition-colors"
          >
            Avvia analisi Facebook
          </button>
          <span className="text-sm text-ink-500">
            Costo stimato: ~$0.025 · fonti pubbliche ufficiali
          </span>
        </div>
      </div>
    );
  }

  if (state.stage === 'searching' || state.stage === 'loading') {
    return (
      <div className="rounded-2xl border border-ink-100 p-12 text-center">
        <div className="inline-flex items-center gap-3 text-ink-600">
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 animate-spin"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" strokeDasharray="30 10" />
          </svg>
          <span className="text-base">
            {state.stage === 'searching'
              ? 'Cerco pagina Facebook...'
              : 'Carico dati pagina, post e ADS...'}
          </span>
        </div>
      </div>
    );
  }

  if (state.stage === 'picker') {
    return (
      <div className="rounded-2xl border border-ink-100 p-6">
        <h3 className="font-display text-xl mb-4">Quale pagina è quella giusta?</h3>
        <div className="space-y-2">
          {state.candidates.map((c) => (
            <button
              key={c.page_id}
              onClick={() => loadPage(c.page_id)}
              className="w-full flex items-center gap-3 p-4 rounded-lg border border-ink-100 hover:border-ink-300 hover:bg-ink-50 transition-colors text-left"
            >
              <Avatar src={c.image_uri} alt={c.name} size={48} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-base truncate">{c.name}</div>
                <div className="text-sm text-ink-500">
                  {c.category || 'Pagina Facebook'}
                </div>
              </div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-5 h-5 text-ink-400"
              >
                <path
                  d="M9 5l7 7-7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (state.stage === 'error') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h3 className="font-medium text-red-800 mb-2 text-base">
          Non è stato possibile caricare i dati Facebook
        </h3>
        <p className="text-sm text-red-700 mb-4">{state.message}</p>
        <button
          onClick={() => setState({ stage: 'idle' })}
          className="px-4 py-2 text-sm border border-red-300 rounded text-red-800 hover:bg-red-100"
        >
          Riprova
        </button>
      </div>
    );
  }

  // LOADED
  const { pageInfo, posts, postMetrics, ads, activeAdsCount, inactiveAdsCount, cost } =
    state.data;
  const filteredAds =
    adsFilter === 'all'
      ? ads
      : adsFilter === 'active'
      ? ads.filter((a: any) => a.is_active)
      : ads.filter((a: any) => !a.is_active);

  return (
    <div className="space-y-8">
      {/* Header pagina */}
      <section className="rounded-2xl border border-ink-100 p-5 md:p-6 bg-white">
        <div className="flex items-start gap-4 md:gap-5">
          <Avatar
            src={pageInfo.profile_picture_url || pageInfo.page_profile_picture_url}
            alt={pageInfo.name || pageInfo.page_name}
            size={80}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="font-display text-2xl md:text-3xl">
                {pageInfo.name || pageInfo.page_name}
              </h2>
              {(pageInfo.is_verified ||
                pageInfo.page_verification === 'BLUE_VERIFIED') && (
                <VerifiedBadge source="facebook_api" size="md" />
              )}
            </div>
            {pageInfo.page_categories?.length > 0 && (
              <div className="text-sm text-ink-600 mb-2">
                {pageInfo.page_categories.join(' · ')}
              </div>
            )}
            {pageInfo.about && (
              <p className="text-sm text-ink-600 mb-2 line-clamp-2 max-w-xl">
                {pageInfo.about}
              </p>
            )}
          </div>
          <span className="text-xs text-ink-500 tabular shrink-0 hidden md:block">
            {formatUsd(cost.usd)}
          </span>
        </div>
      </section>

      {/* Metriche principali */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Follower"
          value={formatCompact(pageInfo.followers || pageInfo.page_follower_count || pageInfo.likes || 0)}
          verified
          source="facebook_api"
        />
        <MetricCard
          label="Post analizzati"
          value={String(postMetrics?.totalPosts || 0)}
          source="facebook_api"
        />
        <MetricCard
          label="Post/settimana"
          value={
            postMetrics?.avgPostsPerWeek
              ? postMetrics.avgPostsPerWeek.toFixed(1)
              : '—'
          }
          source="calculated"
        />
        <MetricCard
          label="Engagement medio"
          value={formatCompact(postMetrics?.avgEngagement || 0)}
          highlight
          source="calculated"
        />
      </section>

      {/* Post metrics dettaglio */}
      {postMetrics?.totalPosts > 0 && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label="Reazioni medie" value={formatCompact(postMetrics.avgReactions)} />
          <StatBox label="Commenti medi" value={formatCompact(postMetrics.avgComments)} />
          <StatBox label="Condivisioni medie" value={formatCompact(postMetrics.avgShares)} />
          <StatBox
            label="Best time"
            value={`${postMetrics.bestDay} ${String(postMetrics.bestHour).padStart(2, '0')}:00`}
          />
        </section>
      )}

      {/* ADS — con filtro attive/inattive */}
      <section>
        <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="font-display text-2xl">Inserzioni Meta Ad Library</h3>
            <p className="text-sm text-ink-600 mt-1">
              {activeAdsCount} attive · {inactiveAdsCount} concluse · totale{' '}
              {activeAdsCount + inactiveAdsCount}
            </p>
          </div>
          <div className="inline-flex gap-1 p-1 bg-ink-100 rounded-full text-sm">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setAdsFilter(f)}
                className={`px-3 py-1 rounded-full transition-all ${
                  adsFilter === f
                    ? 'bg-white text-ink-900 shadow-sm'
                    : 'text-ink-600'
                }`}
              >
                {f === 'all' ? 'Tutte' : f === 'active' ? 'Attive' : 'Concluse'}
              </button>
            ))}
          </div>
        </div>

        {filteredAds.length === 0 ? (
          <div className="rounded-xl border border-ink-100 bg-ink-50 p-8 text-center">
            <p className="text-base text-ink-600">
              {adsFilter === 'active'
                ? 'Nessuna ADS attiva in Italia al momento.'
                : adsFilter === 'inactive'
                ? 'Nessuna ADS conclusa registrata.'
                : 'Questa pagina non ha inserzioni in Italia.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAds.slice(0, 20).map((ad: any) => (
              <AdCard key={ad.ad_archive_id} ad={ad} />
            ))}
          </div>
        )}

        {filteredAds.length > 20 && (
          <div className="mt-4 text-center text-sm text-ink-500">
            Mostrate prime 20 · totale filtrate: {filteredAds.length}
          </div>
        )}
      </section>

      {/* Top posts */}
      {postMetrics?.topPosts?.length > 0 && (
        <section>
          <h3 className="font-display text-2xl mb-4">Post organici più performanti</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {postMetrics.topPosts.map((p: any) => (
              <FbPostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {/* Hashtag cloud */}
      {postMetrics?.hashtags?.length > 0 && (
        <TagCloud hashtags={postMetrics.hashtags} />
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  highlight,
  verified,
  source,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  verified?: boolean;
  source: 'facebook_api' | 'instagram_api' | 'calculated';
}) {
  return (
    <div
      className={`rounded-xl p-4 md:p-5 border ${
        highlight
          ? 'bg-ink-900 text-ink-50 border-ink-900'
          : 'bg-ink-50 border-ink-100'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span
          className={`text-xs uppercase tracking-widest ${
            highlight ? 'text-ink-300' : 'text-ink-500'
          }`}
        >
          {label}
        </span>
        {verified && <VerifiedBadge source={source} />}
      </div>
      <div className="font-display text-3xl md:text-4xl tabular leading-tight">
        {value}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink-50 border border-ink-100 p-4">
      <div className="text-xs uppercase tracking-widest text-ink-500 mb-1">
        {label}
      </div>
      <div className="font-display text-xl tabular">{value}</div>
    </div>
  );
}

function AdCard({ ad }: { ad: any }) {
  const thumb =
    ad.videos?.[0]?.video_preview_image_url ||
    ad.images?.[0]?.resized_image_url;
  const title = ad.snapshot?.title || ad.snapshot?.caption || '—';
  const body = ad.snapshot?.body?.text;
  const cta = ad.snapshot?.cta_text;
  const startDate = ad.start_date
    ? new Date(ad.start_date * 1000).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
      })
    : '';
  const endDate = ad.end_date
    ? new Date(ad.end_date * 1000).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
      })
    : null;
  const platforms = Array.isArray(ad.publisher_platform)
    ? ad.publisher_platform
    : [];

  return (
    <div
      className={`rounded-lg border overflow-hidden flex flex-col ${
        ad.is_active ? 'border-ink-100 bg-white' : 'border-ink-200 bg-ink-50/50'
      }`}
    >
      {thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt={title}
          className={`w-full h-44 object-cover bg-ink-100 ${
            ad.is_active ? '' : 'grayscale opacity-70'
          }`}
          loading="lazy"
          onError={(e) =>
            ((e.currentTarget as HTMLImageElement).style.display = 'none')
          }
        />
      )}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {ad.is_active ? (
            <span className="text-xs font-medium text-green-800 bg-green-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
              ATTIVA
            </span>
          ) : (
            <span className="text-xs font-medium text-ink-600 bg-ink-100 px-2 py-0.5 rounded-full">
              CONCLUSA
            </span>
          )}
          <span className="text-xs uppercase tracking-wider text-ink-500 bg-ink-50 px-2 py-0.5 rounded">
            {ad.display_format}
          </span>
        </div>
        <h4 className="font-medium text-base text-ink-900 line-clamp-2 mb-1">
          {title}
        </h4>
        {body && (
          <p className="text-sm text-ink-600 mt-1 line-clamp-3">{body}</p>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between flex-wrap gap-1 text-xs">
          <div className="text-ink-500 tabular">
            {endDate ? `${startDate} → ${endDate}` : `dal ${startDate}`}
          </div>
          {platforms.length > 0 && (
            <span className="text-ink-500 font-medium">
              {platforms.map((p: string) => p.toUpperCase()).join(' · ')}
            </span>
          )}
        </div>
        {cta && (
          <div className="mt-2 text-xs font-medium text-ink-700 bg-ink-100 px-2 py-1 rounded inline-block w-fit">
            {cta}
          </div>
        )}
      </div>
    </div>
  );
}

function FbPostCard({ post }: { post: any }) {
  const reactions = post.reactions_count || 0;
  const comments = post.comments_count || 0;
  const shares = post.shares_count || 0;
  const total = reactions + comments + shares;
  const date = post.created_time
    ? new Date(post.created_time * 1000).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
      })
    : '';

  return (
    <a
      href={post.post_url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group block aspect-square rounded-lg overflow-hidden bg-ink-100 border border-ink-100 hover:border-ink-300 transition-all relative"
    >
      {(post.full_picture || post.thumbnail_url) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.full_picture || post.thumbnail_url}
          alt={post.message || 'Post Facebook'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) =>
            ((e.currentTarget as HTMLImageElement).style.display = 'none')
          }
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white text-sm">
        <div className="flex gap-3 items-center tabular">
          <span>♡ {formatCompact(reactions)}</span>
          <span>◯ {formatCompact(comments)}</span>
          <span>↗ {formatCompact(shares)}</span>
        </div>
        <div className="text-xs text-white/70 mt-1">{date}</div>
      </div>
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur text-xs font-medium px-2 py-0.5 rounded-full tabular text-ink-900 group-hover:opacity-0 transition-opacity">
        {formatCompact(total)}
      </div>
    </a>
  );
}
