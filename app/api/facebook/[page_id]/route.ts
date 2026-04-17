import { NextResponse } from 'next/server';
import { getSearchAPIClient, SEARCHAPI_COST_USD } from '@/lib/searchapi/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/facebook/[page_id]?country=IT
 *
 * Restituisce info pagina + ADS attive.
 * Costa 2 request a SearchAPI (~$0.02).
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
    const [pageInfo, adsResult] = await Promise.all([
      client.pageInfo(pageId),
      client.getAdsByPageId(pageId, country, 'active'),
    ]);

    const requestCount = client.drainRequestCount();
    const cost = requestCount * SEARCHAPI_COST_USD;

    // Salva in DB per consultazioni future
    try {
      const supabase = getSupabaseAdmin();

      await supabase.from('facebook_analyses').upsert(
        {
          page_id: pageId,
          analyzed_at: new Date().toISOString(),
          page_name: pageInfo.page_name,
          page_info: pageInfo as any,
          ads_count: adsResult.ads.length,
          ads_data: adsResult.ads as any,
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
      ads: adsResult.ads,
      totalAdsCount: adsResult.total_count,
      cost: { requests: requestCount, usd: cost },
    });
  } catch (err: any) {
    console.error('[facebook/page]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
