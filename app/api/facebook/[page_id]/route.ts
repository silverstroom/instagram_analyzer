import { NextResponse } from 'next/server';
import { getSearchAPIClient, SEARCHAPI_COST_USD } from '@/lib/searchapi/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/facebook/[page_id]?country=IT
 *
 * Restituisce:
 * - info pagina (name, likes, verification, category, creation date)
 * - ADS attive E inattive (per vedere anche lo storico campagne)
 */
export async function GET(
  req: Request,
  { params }: { params: { page_id: string } }
) {
  const url = new URL(req.url);
  const country = url.searchParams.get('country') || 'IT';
  const pageId = params.page_id;

  const client = getSearchAPIClient();
  if (!client.isConfigured()) {
    return NextResponse.json(
      { error: 'SearchAPI non configurato' },
      { status: 503 }
    );
  }

  try {
    // Chiediamo "all" per includere anche campagne passate
    const [pageInfo, adsResult] = await Promise.all([
      client.pageInfo(pageId),
      client.getAdsByPageId(pageId, country, 'all'),
    ]);

    const requestCount = client.drainRequestCount();
    const cost = requestCount * SEARCHAPI_COST_USD;

    // Calcolo metriche derivate
    const activeAds = adsResult.ads.filter((a) => a.is_active);
    const inactiveAds = adsResult.ads.filter((a) => !a.is_active);

    const videoCount = adsResult.ads.filter((a) => a.display_format === 'VIDEO').length;
    const imageCount = adsResult.ads.filter((a) => a.display_format === 'IMAGE').length;
    const carouselCount = adsResult.ads.filter(
      (a) => a.display_format === 'DCO' || a.display_format === 'CAROUSEL'
    ).length;

    // Ordina per data: attive in cima (più recenti prima), poi inattive
    const sortedAds = [
      ...activeAds.sort((a, b) => (b.start_date || 0) - (a.start_date || 0)),
      ...inactiveAds.sort((a, b) => (b.end_date || b.start_date || 0) - (a.end_date || a.start_date || 0)),
    ];

    try {
      const supabase = getSupabaseAdmin();

      await supabase.from('facebook_analyses').upsert(
        {
          page_id: pageId,
          analyzed_at: new Date().toISOString(),
          page_name: pageInfo.page_name,
          page_info: pageInfo as any,
          ads_count: adsResult.ads.length,
          ads_data: sortedAds as any,
          cost_usd: cost,
        },
        { onConflict: 'page_id' }
      );

      await supabase.from('api_usage').insert({
        profile_username: pageInfo.page_name || pageId,
        analysis_type: 'facebook_full',
        request_count: requestCount,
        estimated_cost_usd: cost,
        success: true,
      });
    } catch (e) {
      console.error('[facebook] DB write failed:', e);
    }

    return NextResponse.json({
      pageInfo: { ...pageInfo, ...adsResult.page_info },
      ads: sortedAds,
      activeAdsCount: activeAds.length,
      inactiveAdsCount: inactiveAds.length,
      totalAdsCount: adsResult.total_count,
      stats: {
        videoCount,
        imageCount,
        carouselCount,
      },
      cost: { requests: requestCount, usd: cost },
    });
  } catch (err: any) {
    console.error('[facebook/page]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
