'use client';

import Link from 'next/link';
import { useState } from 'react';
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
  handles: Record<string, string>; // NUOVO: map platform → handle specifico
  username: string;
}

export function ProfileDashboardV5({
  initialProfile,
  initialPosts,
  initialChecklist,
  platform,
  selectedPlatforms,
  handles,
  username,
}: Props) {
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
      // Usa l'handle specifico per quel social, altrimenti fallback
      const tabHandle = handles[tab] || username;
      const res = await fetch(
        `/api/analyze?platform=${tab}&username=${encodeURIComponent(tabHandle)}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Errore ${res.status}`);
      }
      setPerPlatformData((prev) => ({ ...prev, [tab]: data }));
    } catch (e: any) {
      setTabErrors((prev) => ({ ...prev, [tab]: e.message }));
    } finally {
      setLoadingTab(null);
    }
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
              Suggerimento: torna in <Link href="/" className="underline">home</Link> e
              inserisci l&apos;handle/URL corretto per {activeTab}. Gli handle tra social sono
              spesso diversi (es. <code>@edunews_24</code> su Instagram ma{' '}
              <code>facebook.com/EduNews24.it</code> su Facebook).
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
            {activeTab === 'facebook' && (
              <FacebookAdsPanel profile={currentData.profile} />
            )}
          </div>
        )}
      </div>
    </main>
  );
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
