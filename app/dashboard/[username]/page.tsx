import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProfileDashboardV3 } from '@/components/ProfileDashboardV3';
import { getHikerClient, COST_PER_REQUEST_USD } from '@/lib/hikerapi/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { calculateEngagement, engagementRating } from '@/lib/analytics/engagement';
import { analyzePostingPattern } from '@/lib/analytics/posting-patterns';
import { extractHashtagStats } from '@/lib/analytics/hashtags';
import { calculateAuthenticityScore } from '@/lib/analytics/authenticity';
import { evaluateProfile } from '@/lib/evaluation/evaluator';
import { round } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function runQuickAnalysis(username: string) {
  const hiker = getHikerClient();
  const analysisId = `quick_${username}_${Date.now()}`;

  const user = await hiker.userByUsername(username, { analysisId });

  if (user.is_private) {
    return { username, user, private: true };
  }

  const posts = await hiker.userMediasBulk(user.pk, 12, { analysisId });
  const engagement = calculateEngagement(user, posts);
  const rating = engagementRating(engagement.engagementRate);
  const pattern = analyzePostingPattern(posts);
  const hashtags = extractHashtagStats(posts);

  // Snapshot history
  let snapshotHistory: any[] = [];
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('profile_snapshots')
      .select('snapshot_date, follower_count, following_count, media_count')
      .eq('username', user.username)
      .order('snapshot_date', { ascending: true })
      .limit(365);
    snapshotHistory = data ?? [];
  } catch {}

  const authenticity = calculateAuthenticityScore(user, posts, snapshotHistory);

  const topPosts = [...posts]
    .sort(
      (a, b) =>
        (b.like_count || 0) + (b.comment_count || 0) -
        ((a.like_count || 0) + (a.comment_count || 0))
    )
    .slice(0, 6);

  // Valutazione AI deterministica
  const evaluation = evaluateProfile({
    user,
    posts,
    engagementRate: engagement.engagementRate,
    avgPostsPerWeek: pattern.avgPostsPerWeek,
    bestDay: pattern.bestDayOfWeek.day,
    bestHour: pattern.bestHour.hour,
    hashtagCount: hashtags.length,
    authenticity,
    snapshotCount: snapshotHistory.length,
  });

  const logs = hiker.drainLog();
  const totalRequests = logs.length;
  const totalCost = round(totalRequests * COST_PER_REQUEST_USD, 6);

  // Persistenza: snapshot + log + cache della ricerca
  try {
    const supabase = getSupabaseAdmin();

    await supabase.from('profile_snapshots').upsert(
      {
        username: user.username,
        instagram_id: user.pk,
        snapshot_date: new Date().toISOString().slice(0, 10),
        follower_count: user.follower_count,
        following_count: user.following_count,
        media_count: user.media_count,
        is_verified: user.is_verified,
        is_business: user.is_business,
        is_private: user.is_private,
        bio: user.biography,
        full_name: user.full_name,
        profile_pic_url: user.profile_pic_url,
        external_url: user.external_url,
        category: user.category,
      },
      { onConflict: 'username,snapshot_date' }
    );

    await supabase.from('api_usage').insert({
      profile_username: username,
      analysis_type: 'quick',
      request_count: totalRequests,
      estimated_cost_usd: totalCost,
      success: true,
    });

    // Cache dell'analisi completa per storico
    await supabase.from('analyses_cache').upsert(
      {
        username: user.username,
        analyzed_at: new Date().toISOString(),
        platform: 'instagram',
        summary: {
          followers: user.follower_count,
          engagement_rate: round(engagement.engagementRate, 2),
          overall_score: evaluation.scoreOverall,
          authenticity_score: authenticity.overallScore,
          top_hashtag_count: hashtags.length,
        },
        full_data: {
          user,
          engagement,
          pattern,
          hashtags: hashtags.slice(0, 30),
          topPosts,
          authenticity,
          evaluation,
        } as any,
        cost_usd: totalCost,
      },
      { onConflict: 'username,platform' }
    );
  } catch (e) {
    console.error('[dashboard] DB write failed:', e);
  }

  return {
    username,
    user,
    posts,
    topPosts,
    engagement,
    rating,
    pattern,
    hashtags,
    snapshotHistory,
    authenticity,
    evaluation,
    cost: { requests: totalRequests, usd: totalCost },
  };
}

export default async function DashboardPage({
  params,
}: {
  params: { username: string };
}) {
  const username = params.username.replace('@', '').trim().toLowerCase();

  let data;
  try {
    data = await runQuickAnalysis(username);
  } catch (err: any) {
    console.error('[dashboard] analysis error:', err);
    return (
      <main className="min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <Link
            href="/"
            className="text-sm text-ink-500 hover:text-ink-900 mb-6 inline-block"
          >
            ← Torna alla home
          </Link>
          <h1 className="font-display text-3xl mb-4">Analisi non riuscita</h1>
          <p className="text-ink-600">
            Non è stato possibile analizzare <strong>@{username}</strong>.
          </p>
          <pre className="mt-4 p-4 bg-ink-100 rounded-md text-sm text-accent-700 overflow-auto whitespace-pre-wrap">
            {err?.message ?? 'Errore sconosciuto'}
          </pre>
        </div>
      </main>
    );
  }

  if (!data.user) notFound();

  return <ProfileDashboardV3 initialData={data} username={username} />;
}
