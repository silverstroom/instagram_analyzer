'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PlatformTabs, type TabId } from './PlatformTabs';
import { ProfileHeader } from './ProfileHeader';
import { AIEvaluationBox } from './AIEvaluationBox';
import { AuthenticityCard } from './AuthenticityCard';
import { FollowerGrowthChart } from './FollowerGrowthChart';
import { PostingHeatmap } from './PostingHeatmap';
import { TagCloud } from './TagCloud';
import { TopPostsGrid } from './TopPostsGrid';
import { ContentMixChart } from './ContentMixChart';
import { DeepFocusCard } from './DeepFocusCard';
import { DeepFocusResults } from './DeepFocusResults';
import { FacebookPanel } from './FacebookPanel';

interface Props {
  initialData: any;
  username: string;
}

export function ProfileDashboardV3({ initialData, username }: Props) {
  const [tab, setTab] = useState<TabId>('instagram');
  const [deepData, setDeepData] = useState<any>(null);
  const {
    user,
    engagement,
    pattern,
    hashtags,
    topPosts,
    posts,
    snapshotHistory,
    authenticity,
    evaluation,
    cost,
    private: isPrivate,
  } = initialData;

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <nav className="flex items-center justify-between mb-8">
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
          <Link
            href="/storico"
            className="text-xs text-ink-500 hover:text-ink-900"
          >
            Vedi storico ricerche
          </Link>
        </nav>

        <PlatformTabs active={tab} onChange={setTab} />

        {tab === 'instagram' && (
          <>
            <ProfileHeader
              user={user}
              engagementRate={engagement.engagementRate}
              avgPostsPerWeek={pattern.avgPostsPerWeek}
              analysisCost={cost}
            />

            {isPrivate ? (
              <div className="p-6 bg-ink-50 border border-ink-200 rounded-xl text-ink-700">
                Questo profilo è privato. Posso mostrarti solo i dati pubblici:
                follower, following, post count.
              </div>
            ) : (
              <div className="space-y-8 animate-slide-up">
                {/* Valutazione AI — la metto PER PRIMA perché è quella che dà un senso immediato */}
                <AIEvaluationBox evaluation={evaluation} />

                {/* Authenticity + Growth in 2 colonne */}
                <div className="grid md:grid-cols-2 gap-4">
                  {authenticity && <AuthenticityCard report={authenticity} />}
                  {snapshotHistory && (
                    <FollowerGrowthChart snapshots={snapshotHistory} />
                  )}
                </div>

                {/* Content Mix + Best times */}
                <div className="grid md:grid-cols-2 gap-4">
                  <ContentMixChart posts={posts} />
                  <div className="p-5 rounded-xl border border-ink-100 bg-ink-50">
                    <div className="text-[10px] uppercase tracking-widest text-ink-500 mb-3">
                      Momenti migliori per pubblicare
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-ink-500">Giorno migliore</div>
                        <div className="font-display text-3xl mt-1">
                          {pattern.bestDayOfWeek.day}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-ink-500">Ora migliore</div>
                        <div className="font-display text-3xl mt-1 tabular">
                          {String(pattern.bestHour.hour).padStart(2, '0')}:00
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-ink-500">Frequenza</div>
                        <div className="font-display text-xl mt-1 tabular">
                          {pattern.avgPostsPerWeek.toFixed(1)} post/settimana
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Heatmap */}
                {posts && posts.length > 0 && <PostingHeatmap posts={posts} />}

                {/* Top posts */}
                {topPosts && topPosts.length > 0 && (
                  <TopPostsGrid posts={topPosts} username={user.username} />
                )}

                {/* Tag cloud */}
                <TagCloud hashtags={hashtags} />

                {/* Deep focus trigger */}
                {!deepData && (
                  <DeepFocusCard
                    username={username}
                    user={user}
                    onComplete={setDeepData}
                  />
                )}

                {deepData && <DeepFocusResults data={deepData} />}
              </div>
            )}
          </>
        )}

        {tab === 'facebook' && <FacebookPanel igUsername={username} />}
      </div>
    </main>
  );
}
