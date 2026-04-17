import { NextResponse } from 'next/server';
import { getHikerClient, COST_PER_REQUEST_USD } from '@/lib/hikerapi/client';
import { getSearchAPIClient, SEARCHAPI_COST_USD } from '@/lib/searchapi/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { extractHashtagsFromText } from '@/lib/analytics/hashtags';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/facebook-page/[page_id]?country=IT
 *
 * Analisi COMPLETA di una pagina Facebook:
 * - Info pagina (likes, follower, about, verified)
 * - Post recenti con engagement
 * - Ads attive e inattive
 * - Metriche calcolate (mix contenuti, pattern, hashtag)
 *
 * Usa HikerAPI (~$0.003 per 5 request) + SearchAPI ($0.02) = ~$0.025 totali
 */
export async function GET(
  req: Request,
  { params }: { params: { page_id: string } }
) {
  const url = new URL(req.url);
  const country = url.searchParams.get('country') || 'IT';
  const pageId = params.page_id;

  const hiker = getHikerClient();
  const search = getSearchAPIClient();

  try {
    // Chiamate parallele per velocità
    const [pageInfo, posts, adsInfo, pageInfoSearch] = await Promise.all([
      hiker.fbPageInfo(pageId).catch((e) => {
        console.warn('[fb-page] hiker pageInfo failed:', e);
        return null;
      }),
      hiker.fbPagePosts(pageId, 20).catch((e) => {
        console.warn('[fb-page] hiker posts failed:', e);
        return [];
      }),
      search.isConfigured()
        ? search.getAdsByPageId(pageId, country, 'all').catch((e) => {
            console.warn('[fb-page] ads failed:', e);
            return null;
          })
        : Promise.resolve(null),
      search.isConfigured()
        ? search.pageInfo(pageId).catch(() => null)
        : Promise.resolve(null),
    ]);

    // Merge dei dati pagina (HikerAPI + SearchAPI si completano a vicenda)
    const mergedPageInfo = {
      ...(pageInfoSearch || {}),
      ...(pageInfo || {}),
      // Preferiamo i valori più grandi tra like/follower delle due fonti
      likes: Math.max(
        pageInfo?.likes || 0,
        pageInfoSearch?.page_like_count || 0
      ),
      followers: Math.max(
        pageInfo?.followers || 0,
        pageInfoSearch?.page_follower_count || 0
      ),
    };

    // Calcolo metriche sui post
    const postMetrics = computePostMetrics(posts);

    // ADS
    const ads = adsInfo?.ads || [];
    const activeAds = ads.filter((a) => a.is_active);
    const inactiveAds = ads.filter((a) => !a.is_active);

    const sortedAds = [
      ...activeAds.sort((a, b) => (b.start_date || 0) - (a.start_date || 0)),
      ...inactiveAds.sort(
        (a, b) =>
          (b.end_date || b.start_date || 0) -
          (a.end_date || a.start_date || 0)
      ),
    ];

    const hikerLogs = hiker.drainLog();
    const searchReqs = search.drainRequestCount();
    const totalCost =
      hikerLogs.length * COST_PER_REQUEST_USD +
      searchReqs * SEARCHAPI_COST_USD;

    // Salva in DB
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('facebook_analyses').upsert(
        {
          page_id: pageId,
          analyzed_at: new Date().toISOString(),
          page_name: mergedPageInfo.name || mergedPageInfo.page_name,
          page_info: mergedPageInfo as any,
          ads_count: ads.length,
          ads_data: sortedAds as any,
          cost_usd: totalCost,
        },
        { onConflict: 'page_id' }
      );

      await supabase.from('api_usage').insert({
        profile_username: mergedPageInfo.name || mergedPageInfo.page_name || pageId,
        analysis_type: 'facebook_full',
        request_count: hikerLogs.length + searchReqs,
        estimated_cost_usd: totalCost,
        success: true,
      });
    } catch (e) {
      console.error('[fb-page] DB write failed:', e);
    }

    return NextResponse.json({
      pageInfo: mergedPageInfo,
      posts,
      postMetrics,
      ads: sortedAds,
      activeAdsCount: activeAds.length,
      inactiveAdsCount: inactiveAds.length,
      totalAdsCount: ads.length,
      cost: {
        requests: hikerLogs.length + searchReqs,
        usd: totalCost,
      },
    });
  } catch (err: any) {
    console.error('[fb-page] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function computePostMetrics(posts: any[]) {
  if (posts.length === 0) {
    return {
      totalPosts: 0,
      avgReactions: 0,
      avgComments: 0,
      avgShares: 0,
      avgEngagement: 0,
      avgPostsPerWeek: 0,
      bestDay: '—',
      bestHour: 0,
      contentMix: { video: 0, photo: 0, link: 0, status: 0, album: 0 },
      topPosts: [],
      hashtags: [],
      hourDistribution: new Array(24).fill(0),
    };
  }

  let totalReactions = 0;
  let totalComments = 0;
  let totalShares = 0;
  const byDay: Record<string, { count: number; totalEng: number }> = {};
  const byHour = Array.from({ length: 24 }, () => ({ count: 0, totalEng: 0 }));
  const contentMix = { video: 0, photo: 0, link: 0, status: 0, album: 0 };
  const hashtagMap = new Map<string, { count: number; totalEng: number }>();
  const DAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  for (const p of posts) {
    const reactions = p.reactions_count || 0;
    const comments = p.comments_count || 0;
    const shares = p.shares_count || 0;
    totalReactions += reactions;
    totalComments += comments;
    totalShares += shares;
    const eng = reactions + comments + shares;

    if (p.created_time) {
      const d = new Date(p.created_time * 1000);
      const day = DAYS[d.getDay()];
      const hour = d.getHours();
      if (!byDay[day]) byDay[day] = { count: 0, totalEng: 0 };
      byDay[day].count++;
      byDay[day].totalEng += eng;
      byHour[hour].count++;
      byHour[hour].totalEng += eng;
    }

    const type = (p.type || 'status').toLowerCase();
    if (type.includes('video')) contentMix.video++;
    else if (type.includes('photo')) contentMix.photo++;
    else if (type.includes('link')) contentMix.link++;
    else if (type.includes('album')) contentMix.album++;
    else contentMix.status++;

    const hashtags = extractHashtagsFromText(p.message || '');
    for (const h of hashtags) {
      const cur = hashtagMap.get(h) || { count: 0, totalEng: 0 };
      cur.count++;
      cur.totalEng += eng;
      hashtagMap.set(h, cur);
    }
  }

  const timestamps = posts
    .filter((p) => p.created_time)
    .map((p) => p.created_time);
  const spanDays =
    timestamps.length > 1
      ? (Math.max(...timestamps) - Math.min(...timestamps)) / (24 * 3600)
      : 1;
  const avgPostsPerWeek =
    spanDays > 0 ? (posts.length / Math.max(spanDays, 1)) * 7 : 0;

  const bestDay = Object.entries(byDay).reduce(
    (best, [day, stats]) => {
      const avg = stats.totalEng / stats.count;
      return avg > best.avg ? { day, avg } : best;
    },
    { day: '—', avg: 0 }
  );

  const bestHourIdx = byHour.reduce(
    (maxIdx, h, i, arr) => {
      const avg = h.count > 0 ? h.totalEng / h.count : 0;
      const maxAvg =
        arr[maxIdx].count > 0 ? arr[maxIdx].totalEng / arr[maxIdx].count : 0;
      return avg > maxAvg ? i : maxIdx;
    },
    0
  );

  const topPosts = [...posts]
    .sort(
      (a, b) =>
        (b.reactions_count || 0) +
        (b.comments_count || 0) +
        (b.shares_count || 0) -
        ((a.reactions_count || 0) +
          (a.comments_count || 0) +
          (a.shares_count || 0))
    )
    .slice(0, 6);

  const hashtags = Array.from(hashtagMap.entries())
    .map(([tag, stats]) => ({
      tag,
      usageCount: stats.count,
      avgEngagement: stats.totalEng / stats.count,
      totalEngagement: stats.totalEng,
      posts: [],
    }))
    .sort((a, b) => b.usageCount - a.usageCount);

  return {
    totalPosts: posts.length,
    avgReactions: totalReactions / posts.length,
    avgComments: totalComments / posts.length,
    avgShares: totalShares / posts.length,
    avgEngagement: (totalReactions + totalComments + totalShares) / posts.length,
    avgPostsPerWeek,
    bestDay: bestDay.day,
    bestHour: bestHourIdx,
    contentMix,
    topPosts,
    hashtags,
    hourDistribution: byHour.map((h) => (h.count > 0 ? h.totalEng / h.count : 0)),
  };
}
