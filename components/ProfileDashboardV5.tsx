'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { NormalizedProfile, NormalizedPost } from '@/lib/scrapecreators/normalizer';
import type { OptimizationChecklist } from '@/lib/evaluation/checklist';
import type { Platform } from '@/lib/scrapecreators/client';
import { ProfileHeader } from './ProfileHeader';
import { OptimizationChecklistCard } from './OptimizationChecklistCard';
import { ContentMixHero } from './ContentMixHero';
import { TopPostsGrid } from './TopPostsGrid';
import { TagCloud } from './TagCloud';
import { PostingHeatmap } from './PostingHeatmap';
import { StrategyActionsCard } from './StrategyActionsCard';
import { FacebookAdsPanel } from './FacebookAdsPanel';
import { MultiPlatformTabs } from './MultiPlatformTabs';
import { extractHashtagsFromText } from '@/lib/utils';

interface Props {
  initialProfile: NormalizedProfile;
  initialPosts: NormalizedPost[];
  initialChecklist: OptimizationChecklist;
  platform: string;
  selectedPlatforms: string[];
  handles: Record<string, string>;
  username: string;
  analyzedAt: string;
  fromCache: boolean;
}

export function ProfileDashboardV5({
  initialProfile,
  initialPosts,
  initialChecklist,
  platform,
  selectedPlatforms,
  handles,
  username,
  analyzedAt,
  fromCache,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<Platform>(platform as Platform);
  const [perPlatformData, setPerPlatformData] = useState<
    Record<string, { profile: NormalizedProfile; posts: NormalizedPost[]; checklist: OptimizationChecklist } | null>
  >({
    [platform]: {
      profile: initialProfile,
      posts: initialPosts,
      checklist: initialChecklist,
    },
  });
  const [loadingTab, setLoadingTab] = useState<string | null>(null);
  const [tabErrors, setTabErrors] = useState<Record<string, string>>({});

  const currentData = perPlatformData[activeTab];
  const currentError = tabErrors[activeTab];

  async function switchTab(tab: Platform) {
    setActiveTab(tab);
    if (perPlatformData[tab]) return;

    setLoadingTab(tab);
    setTabErrors((prev) => ({ ...prev, [tab]: '' }));
    try {
      const tabHandle = handles[tab] || username;
      const res = await fetch(
        `/api/analyze?platform=${tab}&username=${encodeURIComponent(tabHandle)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Errore ${res.status}`);
      setPerPlatformData((prev) => ({ ...prev, [tab]: data }));
    } catch (e: any) {
      setTabErrors((prev) => ({ ...prev, [tab]: e.message }));
    } finally {
      setLoadingTab(null);
    }
  }

  function handleRefresh() {
    const current = new URL(window.location.href);
    current.searchParams.set('refresh', '1');
    startTransition(() => {
      router.push(current.pathname + current.search);
      router.refresh();
    });
  }

  const hashtagStats = currentData ? aggregateHashtags(currentData.posts) : [];

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <nav className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-sm text-ink-700 hover:text-ink-900 inline-flex items-center gap-1"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Home
          </Link>
          <Link href="/storico" className="text-sm text-ink-700 hover:text-ink-900">
            Storico
          </Link>
        </nav>

        {/* Banner cache + pulsante aggiorna */}
        <div className="mb-5 p-3 rounded-lg border border-ink-200 bg-ink-50 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-ink-700 flex-wrap">
            {fromCache ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" strokeLinecap="round" />
                </svg>
                <span>
                  <strong>Dati da storico</strong> · ultima analisi {formatRelativeTime(analyzedAt)}
                </span>
              </>
            ) : (
              <>
                <span className="text-green-700 inline-flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9 12l2 2 4-4" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <strong>Analisi appena completata</strong>
                </span>
                <span className="text-ink-600">· salvata in storico</span>
              </>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-ink-300 text-sm font-medium text-ink-800 hover:bg-ink-100 transition-colors disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`}
            >
              <path d="M4 4v6h6M20 20v-6h-6M20 4a9 9 0 00-15.5 3M4 20a9 9 0 0015.5-3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {isPending ? 'Aggiornamento...' : 'Aggiorna analisi'}
          </button>
        </div>

        <MultiPlatformTabs
          platforms={selectedPlatforms as Platform[]}
          active={activeTab}
          onChange={switchTab}
          loadingTab={loadingTab}
        />

        {loadingTab === activeTab && (
          <div className="py-12 text-center text-ink-700">
            <div className="inline-flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="30 10" />
              </svg>
              Carico {activeTab}...
            </div>
          </div>
        )}

        {currentError && !loadingTab && (
          <div className="my-6 p-5 rounded-xl border border-red-200 bg-red-50 text-red-900">
            <div className="font-semibold mb-2">Errore caricando {activeTab}</div>
            <div className="text-sm mb-3">{currentError}</div>
            <div className="text-xs text-red-800">
              Torna in <Link href="/" className="underline">home</Link> e inserisci
              l&apos;handle/URL corretto per {activeTab}.
            </div>
          </div>
        )}

        {currentData && !loadingTab && !currentError && (
          <div className="space-y-6 md:space-y-8 animate-fade-in">
            <ProfileHeader profile={currentData.profile} posts={currentData.posts} />
            <OptimizationChecklistCard checklist={currentData.checklist} />
            {currentData.posts.length > 0 && (
              <ContentMixHero posts={currentData.posts} profile={currentData.profile} />
            )}
            <StrategyActionsCard
              checklist={currentData.checklist}
              profile={currentData.profile}
              posts={currentData.posts}
            />
            {currentData.posts.length > 0 && (
              <TopPostsGrid posts={currentData.posts} profile={currentData.profile} />
            )}
            {currentData.posts.filter((p) => p.takenAt > 0).length >= 3 && (
              <PostingHeatmap posts={currentData.posts} />
            )}
            <TagCloud hashtags={hashtagStats} />
            {activeTab === 'facebook' && <FacebookAdsPanel profile={currentData.profile} />}
          </div>
        )}
      </div>
    </main>
  );
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'poco fa';
  if (diffMin < 60) return `${diffMin} min fa`;
  if (diffHr < 24) return `${diffHr} ${diffHr === 1 ? 'ora' : 'ore'} fa`;
  if (diffDay < 30) return `${diffDay} ${diffDay === 1 ? 'giorno' : 'giorni'} fa`;
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface HashtagStat {
  tag: string;
  usageCount: number;
  avgEngagement: number;
}

function aggregateHashtags(posts: NormalizedPost[]): HashtagStat[] {
  const map = new Map<string, { uses: number; totalEng: number }>();
  for (const p of posts) {
    const tags = extractHashtagsFromText(p.caption);
    const eng = p.likeCount + p.commentCount + (p.shareCount || 0);
    for (const t of tags) {
      const cur = map.get(t) || { uses: 0, totalEng: 0 };
      cur.uses++;
      cur.totalEng += eng;
      map.set(t, cur);
    }
  }
  return Array.from(map.entries())
    .map(([tag, v]) => ({
      tag,
      usageCount: v.uses,
      avgEngagement: v.uses > 0 ? v.totalEng / v.uses : 0,
    }))
    .sort((a, b) => b.usageCount - a.usageCount);
}
