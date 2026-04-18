'use client';

import { useEffect, useState } from 'react';
import type { NormalizedProfile } from '@/lib/scrapecreators/normalizer';
import type { NormalizedAd } from '@/lib/scrapecreators/normalizer';
import { formatDate, proxiedImage } from '@/lib/utils';

interface Props {
  profile: NormalizedProfile;
}

type FilterType = 'all' | 'active' | 'inactive';

/**
 * Pannello ADS Meta Ad Library.
 * IMPORTANTE: il pageId per Ad Library è DIVERSO da quello del profilo FB.
 * Lo ScrapeCreators lo espone in `adLibrary.pageId` del payload profilo.
 */
export function FacebookAdsPanel({ profile }: Props) {
  const [state, setState] = useState<
    | { stage: 'idle' }
    | { stage: 'loading' }
    | { stage: 'loaded'; ads: NormalizedAd[]; activeCount: number; inactiveCount: number }
    | { stage: 'error'; message: string }
    | { stage: 'no_ads' }
  >({ stage: 'idle' });

  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (state.stage !== 'idle') return;

    // FIX v5.1: usa fbAdLibraryPageId (da adLibrary.pageId) invece di profile.id
    const adLibraryPageId = profile.fbAdLibraryPageId;

    if (!adLibraryPageId) {
      setState({ stage: 'no_ads' });
      return;
    }

    async function load() {
      setState({ stage: 'loading' });
      try {
        const res = await fetch(
          `/api/facebook/ads?pageId=${encodeURIComponent(adLibraryPageId!)}&country=IT`
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Errore ${res.status}`);
        }
        const data = await res.json();
        setState({
          stage: 'loaded',
          ads: data.ads || [],
          activeCount: data.activeCount || 0,
          inactiveCount: data.inactiveCount || 0,
        });
      } catch (e: any) {
        setState({ stage: 'error', message: e.message });
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.stage === 'no_ads') {
    return (
      <section className="rounded-2xl border border-ink-100 bg-ink-50 p-8 text-center">
        <h3 className="font-semibold text-ink-900 mb-1 text-lg">Nessuna inserzione rilevata</h3>
        <p className="text-base text-ink-700">
          Questa pagina non risulta aver mai usato Meta Ads, oppure la Ad Library non la
          mostra per questo paese.
        </p>
      </section>
    );
  }

  if (state.stage === 'loading') {
    return (
      <section className="rounded-2xl border border-ink-100 p-8 md:p-12 text-center">
        <div className="inline-flex items-center gap-2 text-ink-700">
          <svg viewBox="0 0 24 24" className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeDasharray="30 10" />
          </svg>
          Carico inserzioni da Meta Ad Library...
        </div>
      </section>
    );
  }

  if (state.stage === 'error') {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h3 className="font-semibold text-red-900 mb-1">Impossibile caricare le inserzioni</h3>
        <p className="text-sm text-red-800">{state.message}</p>
      </section>
    );
  }

  if (state.stage !== 'loaded') return null;

  const filtered =
    filter === 'all'
      ? state.ads
      : filter === 'active'
      ? state.ads.filter((a) => a.isActive)
      : state.ads.filter((a) => !a.isActive);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="font-display text-2xl md:text-3xl text-ink-900">Inserzioni Meta Ad Library</h3>
          <p className="text-sm text-ink-700 mt-1">
            {state.activeCount} attive · {state.inactiveCount} concluse · totale {state.ads.length}
          </p>
        </div>
        <div className="inline-flex gap-1 p-1 bg-ink-100 rounded-full text-sm">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full transition-all ${
                filter === f ? 'bg-white text-ink-900 shadow-sm font-medium' : 'text-ink-700'
              }`}
            >
              {f === 'all' ? 'Tutte' : f === 'active' ? 'Attive' : 'Concluse'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-ink-100 bg-ink-50 p-8 text-center">
          <p className="text-base text-ink-700">
            {filter === 'active'
              ? 'Nessuna inserzione attualmente attiva in Italia.'
              : filter === 'inactive'
              ? 'Nessuna inserzione conclusa da mostrare.'
              : 'Questa pagina non ha inserzioni in Italia.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.slice(0, 30).map((ad) => (
            <AdCard key={ad.id} ad={ad} profile={profile} />
          ))}
        </div>
      )}

      {filtered.length > 30 && (
        <div className="mt-4 text-center text-sm text-ink-700">
          Mostrate 30 su {filtered.length} totali
        </div>
      )}
    </section>
  );
}

function AdCard({ ad, profile }: { ad: NormalizedAd; profile: NormalizedProfile }) {
  const thumb = ad.thumbnailUrl ? proxiedImage(ad.thumbnailUrl) : null;
  const startStr = ad.startDate ? formatDate(ad.startDate) : '—';
  const endStr = ad.endDate ? formatDate(ad.endDate) : null;

  const platformIcons: Record<string, React.ReactNode> = {
    facebook: (
      <svg viewBox="0 0 24 24" fill="#1877F2" className="w-4 h-4">
        <path d="M14 13.5h2.5l1-4H14V7c0-1.03 0-2 2-2h1.5V1.64S16.19 1.5 14.62 1.5C10.96 1.5 9 3.92 9 7.07V9.5H6V13.5H9V22h5V13.5z" />
      </svg>
    ),
    instagram: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="1.8" className="w-4 h-4">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.7" fill="#E1306C" />
      </svg>
    ),
    messenger: (
      <svg viewBox="0 0 24 24" fill="#0084FF" className="w-4 h-4">
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    audience_network: (
      <svg viewBox="0 0 24 24" fill="#444" className="w-4 h-4">
        <rect x="4" y="4" width="16" height="16" rx="3" />
      </svg>
    ),
    threads: (
      <svg viewBox="0 0 24 24" fill="#000" className="w-4 h-4">
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  };

  return (
    <article className="rounded-lg border border-ink-200 bg-white overflow-hidden flex flex-col shadow-sm">
      <header className="px-4 pt-3 pb-2 border-b border-ink-100">
        <div className="flex items-start justify-between gap-2 mb-2">
          <StatusBadge active={ad.isActive} />
          <span className="text-ink-500" aria-label="Altre opzioni">⋯</span>
        </div>

        <div className="space-y-1 text-xs">
          <div>
            <span className="text-ink-600">ID libreria: </span>
            <span className="text-ink-800 tabular font-mono">{ad.id}</span>
          </div>
          <div className="text-ink-700 tabular">
            {startStr}
            {endStr ? ` - ${endStr}` : ad.isActive ? ' · in corso' : ''}
          </div>
          <div className="text-ink-600 flex items-center gap-1.5 flex-wrap">
            <span>Piattaforme:</span>
            {ad.platforms.length > 0 ? (
              ad.platforms.map((p) => (
                <span key={p} title={p} className="inline-flex">
                  {platformIcons[p.toLowerCase()] || <span className="text-ink-700 text-[10px] uppercase">{p}</span>}
                </span>
              ))
            ) : (
              <span className="text-ink-500">—</span>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 py-3 flex-1">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-ink-100">
          {profile.profilePicUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={proxiedImage(profile.profilePicUrl)}
              alt={profile.fullName}
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
            />
          )}
          <div className="min-w-0">
            <div className="font-semibold text-sm text-ink-900 truncate">{profile.fullName || ad.pageName}</div>
            <div className="text-xs text-ink-600">Sponsorizzato</div>
          </div>
        </div>

        {ad.title && (
          <h4 className="font-medium text-sm text-ink-900 mb-1 line-clamp-2">{ad.title}</h4>
        )}
        {ad.bodyText && (
          <p className="text-sm text-ink-800 line-clamp-4 leading-relaxed whitespace-pre-wrap">
            {ad.bodyText}
          </p>
        )}
      </div>

      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt={ad.title || 'Inserzione'}
          className={`w-full aspect-square object-cover bg-ink-100 ${ad.isActive ? '' : 'grayscale-[40%] opacity-90'}`}
          loading="lazy"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
        />
      ) : (
        <div className="w-full aspect-square bg-ink-100 flex items-center justify-center text-ink-500 text-sm">
          Nessuna anteprima disponibile
        </div>
      )}

      {(ad.ctaText || ad.linkUrl) && (
        <footer className="px-4 py-3 border-t border-ink-100 flex items-center justify-between gap-2 bg-ink-50/50">
          {ad.linkUrl ? (
            <a
              href={ad.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-ink-700 truncate hover:text-ink-900"
            >
              {(() => {
                try { return new URL(ad.linkUrl).hostname.replace('www.', ''); }
                catch { return ad.linkUrl; }
              })()}
            </a>
          ) : (
            <span />
          )}
          {ad.ctaText && (
            <span className="text-xs font-medium text-ink-800 bg-white border border-ink-200 px-3 py-1.5 rounded">
              {ad.ctaText}
            </span>
          )}
        </footer>
      )}

      <div className="px-4 py-2 border-t border-ink-100 text-xs text-ink-600 uppercase tracking-wider bg-ink-50">
        {ad.format} · Trasparenza UE
      </div>
    </article>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        active ? 'text-ink-900' : 'text-ink-700'
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full flex items-center justify-center ${
          active ? 'bg-[#1877F2]' : 'bg-ink-300'
        }`}
      >
        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="white">
          <path d="M4.5 8.5l-2-2 1-1 1 1 3-3 1 1-4 4z" />
        </svg>
      </span>
      {active ? 'Attiva' : 'Non attiva'}
    </span>
  );
}
