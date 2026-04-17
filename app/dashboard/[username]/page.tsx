import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProfileDashboard } from '@/components/ProfileDashboard';
import { getHikerClient, COST_PER_REQUEST_USD } from '@/lib/hikerapi/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { calculateEngagement, engagementRating } from '@/lib/analytics/engagement';
import { analyzePostingPattern } from '@/lib/analytics/posting-patterns';
import { extractHashtagStats } from '@/lib/analytics/hashtags';
import { calculateAuthenticityScore } from '@/lib/analytics/authenticity';

export const dynamic = 'force-dynamic';

async function runQuickAnalysis(username: string) {
  const hiker = getHikerClient();
  const analysisId = `quick_${username}_${Date.now()}`;

  const user = await hiker.userByUsername(username, { analysisId });

  if (user.is_private) {
    return {
      username,
      user,
      private: true,
      message: 'Profilo privato: analisi limitata alle info pubbliche',
    };
  }

  const posts = await hiker.userMediasBulk(user.pk, 12, { analysisId });
  const engagement = calculateEngagement(user, posts);
  const rating = engagementRating(engagement.engagementRate);
  const pattern = analyzePostingPattern(posts);
  const hashtags = extractHashtagStats(posts).slice(0, 30);

  // Recupera snapshot storici per grafico crescita + authenticity
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
  } catch (e) {
    console.error('[dashboard] history fetch failed:', e);
  }

  // Authenticity score (senza audience quality: quella è nel deep focus)
  const authenticity = calculateAuthenticityScore(user, posts, snapshotHistory);

  // Top posts per engagement
  const topPosts = [...posts]
    .sort(
      (a, b) =>
        (b.like_count || 0) + (b.comment_count || 0) -
        ((a.like_count || 0) + (a.comment_count || 0))
    )
    .slice(0, 6);

  const logs = hiker.drainLog();
  const totalRequests = logs.length;
  const totalCost = totalRequests * COST_PER_REQUEST_USD;

  // Salva snapshot + log
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
      modules_used: ['profile', 'recent_posts'],
      request_count: totalRequests,
      estimated_cost_usd: totalCost,
      success: true,
    });
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

  return <ProfileDashboard initialData={data} username={username} />;
}
