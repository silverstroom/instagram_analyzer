'use client';

import { useState } from 'react';
import { Avatar } from './Avatar';
import { VerifiedBadge } from './VerifiedBadge';
import { formatCompact, formatUsd } from '@/lib/utils';

interface Props {
  igUsername: string;
}

/**
 * Pannello Facebook: richiede iniziazione esplicita dall'utente perché ogni
 * ricerca consuma 1-2 request di SearchAPI (~$0.02). Spieghiamo chiaramente
 * il costo prima di procedere.
 */
export function FacebookPanel({ igUsername }: Props) {
  const [state, setState] = useState<
    | { stage: 'idle' }
    | { stage: 'searching'; query: string }
    | { stage: 'picker'; candidates: any[] }
    | { stage: 'loading' }
    | { stage: 'loaded'; pageInfo: any; ads: any[]; cost: number }
    | { stage: 'error'; message: string }
  >({ stage: 'idle' });

  const searchQuery = igUsername;

  async function startSearch() {
    setState({ stage: 'searching', query: searchQuery });
    try {
      const res = await fetch(
        `/api/facebook/search?q=${encodeURIComponent(searchQuery)}&country=IT`
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
        // Unica candidata, carica subito
        await loadPage(data.candidates[0].page_id);
      } else {
        setState({ stage: 'picker', candidates: data.candidates.slice(0, 5) });
      }
    } catch (e: any) {
      setState({ stage: 'error', message: e.message });
    }
  }

  async function loadPage(pageId: string) {
    setState({ stage: 'loading' });
    try {
      const res = await fetch(`/api/facebook/${pageId}?country=IT`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Errore ${res.status}`);
      }
      const data = await res.json();
      setState({
        stage: 'loaded',
        pageInfo: data.pageInfo,
        ads: data.ads || [],
        cost: data.cost?.usd || 0,
      });
    } catch (e: any) {
      setState({ stage: 'error', message: e.message });
    }
  }

  // Idle: bottone per iniziare
  if (state.stage === 'idle') {
    return (
      <div className="rounded-2xl border-2 border-dashed border-ink-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-ink-100 mb-4">
          <svg viewBox="0 0 24 24" fill="#1877F2" className="w-7 h-7">
            <path d="M14 13.5h2.5l1-4H14V7c0-1.03 0-2 2-2h1.5V1.64S16.19 1.5 14.62 1.5C10.96 1.5 9 3.92 9 7.07V9.5H6V13.5H9V22h5V13.5z" />
          </svg>
        </div>
        <h3 className="font-display text-xl mb-2">Analisi Facebook + ADS attive</h3>
        <p className="text-sm text-ink-600 max-w-md mx-auto mb-5">
          Cercheremo la pagina Facebook collegata a <strong>@{igUsername}</strong> e
          scaricheremo le ADS attive via <strong>Meta Ad Library</strong> (dati pubblici ufficiali).
        </p>
        <div className="inline-flex flex-col items-center gap-2">
          <button
            onClick={startSearch}
            className="px-5 py-2.5 bg-ink-900 text-white rounded-full text-sm font-medium hover:bg-ink-700 transition-colors"
          >
            Avvia analisi Facebook
          </button>
          <span className="text-[11px] text-ink-500">
            Costo stimato: ~$0.02 (2 request · fonte ufficiale Meta)
          </span>
        </div>
      </div>
    );
  }

  if (state.stage === 'searching' || state.stage === 'loading') {
    return (
      <div className="rounded-2xl border border-ink-100 p-8 text-center">
        <div className="inline-flex items-center gap-2 text-ink-600">
          <svg viewBox="0 0 24 24" className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeDasharray="30 10" />
          </svg>
          <span className="text-sm">
            {state.stage === 'searching' ? 'Cerco pagina Facebook...' : 'Carico dati pagina e ADS...'}
          </span>
        </div>
      </div>
    );
  }

  if (state.stage === 'picker') {
    return (
      <div className="rounded-2xl border border-ink-100 p-6">
        <h3 className="font-display text-lg mb-3">Quale pagina è quella giusta?</h3>
        <div className="space-y-2">
          {state.candidates.map((c) => (
            <button
              key={c.page_id}
              onClick={() => loadPage(c.page_id)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-ink-100 hover:border-ink-300 hover:bg-ink-50 transition-colors text-left"
            >
              <Avatar src={c.image_uri} alt={c.name} size={40} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{c.name}</div>
                <div className="text-xs text-ink-500">{c.category || 'Pagina Facebook'}</div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-ink-400">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (state.stage === 'error') {
    return (
      <div className="rounded-2xl border border-accent-200 bg-accent-50 p-6">
        <h3 className="font-medium text-accent-800 mb-2">Non è stato possibile caricare i dati Facebook</h3>
        <p className="text-sm text-accent-700 mb-3">{state.message}</p>
        <button
          onClick={() => setState({ stage: 'idle' })}
          className="px-3 py-1.5 text-xs border border-accent-300 rounded text-accent-800 hover:bg-accent-100"
        >
          Riprova
        </button>
      </div>
    );
  }

  // Loaded
  const { pageInfo, ads, cost } = state;
  const videoAds = ads.filter((a: any) => a.display_format === 'VIDEO').length;
  const imageAds = ads.filter((a: any) => a.display_format === 'IMAGE').length;
  const carouselAds = ads.filter((a: any) => a.display_format === 'DCO' || a.display_format === 'CAROUSEL').length;

  return (
    <div className="space-y-6">
      {/* Header pagina */}
      <section className="rounded-2xl border border-ink-100 p-5 bg-white">
        <div className="flex items-start gap-4">
          <Avatar src={pageInfo.page_profile_picture_url} alt={pageInfo.page_name} size={72} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="font-display text-2xl">{pageInfo.page_name}</h2>
              {pageInfo.page_verification === 'BLUE_VERIFIED' && (
                <VerifiedBadge source="facebook_api" size="md" />
              )}
            </div>
            <div className="text-sm text-ink-600 mb-2">
              {(pageInfo.page_categories || []).join(' · ')}
            </div>
            <div className="flex flex-wrap gap-4 text-sm tabular">
              {pageInfo.page_like_count != null && (
                <span className="text-ink-700">
                  <strong>{formatCompact(pageInfo.page_like_count)}</strong>{' '}
                  <span className="text-ink-500">like pagina</span>
                </span>
              )}
              {pageInfo.ig_username && (
                <span className="text-ink-700">
                  IG collegato: <strong>@{pageInfo.ig_username}</strong>
                </span>
              )}
            </div>
          </div>
          <span className="text-[11px] text-ink-500 tabular shrink-0">
            Ad Library · {formatUsd(cost)}
          </span>
        </div>
      </section>

      {/* Riepilogo ADS */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-display text-xl">ADS attive in Italia</h3>
          <span className="text-xs text-ink-500">
            Fonte: Meta Ad Library (pubblica)
          </span>
        </div>

        {ads.length === 0 ? (
          <div className="rounded-xl border border-ink-100 bg-ink-50 p-6 text-center">
            <p className="text-sm text-ink-600">
              Questa pagina non ha ADS attive in Italia al momento.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="p-4 rounded-lg bg-ink-900 text-white">
                <div className="text-[10px] uppercase tracking-widest text-ink-300">
                  ADS totali attive
                </div>
                <div className="font-display text-3xl tabular mt-1">{ads.length}</div>
              </div>
              <MiniStat label="Video" value={videoAds} />
              <MiniStat label="Immagini" value={imageAds} />
              <MiniStat label="Carousel" value={carouselAds} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ads.slice(0, 10).map((ad: any) => (
                <AdCard key={ad.ad_archive_id} ad={ad} />
              ))}
            </div>

            {ads.length > 10 && (
              <div className="mt-4 text-center text-xs text-ink-500">
                Visualizzate le prime 10 ADS · Totale: {ads.length}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 rounded-lg bg-ink-50 border border-ink-100">
      <div className="text-[10px] uppercase tracking-widest text-ink-500">
        {label}
      </div>
      <div className="font-display text-2xl tabular mt-1">{value}</div>
    </div>
  );
}

function AdCard({ ad }: { ad: any }) {
  const thumb = ad.videos?.[0]?.video_preview_image_url || ad.images?.[0]?.resized_image_url;
  const title = ad.snapshot?.title || ad.snapshot?.caption || 'ADS attiva';
  const body = ad.snapshot?.body?.text;
  const cta = ad.snapshot?.cta_text;
  const startDate = ad.start_date ? new Date(ad.start_date * 1000).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : '';
  const platforms = Array.isArray(ad.publisher_platform) ? ad.publisher_platform : [];

  return (
    <div className="rounded-lg border border-ink-100 overflow-hidden flex flex-col">
      {thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt={title}
          className="w-full h-40 object-cover bg-ink-100"
          loading="lazy"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
        />
      )}
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-ink-500 bg-ink-100 px-1.5 py-0.5 rounded">
            {ad.display_format}
          </span>
          {startDate && (
            <span className="text-[10px] text-ink-500">dal {startDate}</span>
          )}
          {ad.is_active && (
            <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
              attiva
            </span>
          )}
        </div>
        <h4 className="font-medium text-sm text-ink-900 line-clamp-2">{title}</h4>
        {body && (
          <p className="text-xs text-ink-600 mt-1 line-clamp-3">{body}</p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between">
          {cta && (
            <span className="text-[10px] font-medium text-ink-700 bg-ink-100 px-2 py-0.5 rounded">
              {cta}
            </span>
          )}
          {platforms.length > 0 && (
            <span className="text-[10px] text-ink-500">
              {platforms.map((p: string) => p.toUpperCase()).join(' · ')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
