import { NextResponse } from 'next/server';
import { getScrapeCreatorsClient } from '@/lib/scrapecreators/client';
import { normalizeFacebookAds } from '@/lib/scrapecreators/normalizer';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/facebook/ads?pageId=...&country=IT
 *
 * Scarica TUTTE le ADS (attive+concluse) di una pagina tramite ScrapeCreators
 * Facebook Ad Library company endpoint.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pageId = searchParams.get('pageId');
  const country = searchParams.get('country') || 'IT';

  if (!pageId) {
    return NextResponse.json({ error: 'pageId richiesto' }, { status: 400 });
  }

  const client = getScrapeCreatorsClient();
  if (!client.isConfigured()) {
    return NextResponse.json(
      { error: 'SCRAPECREATORS_API_KEY non configurata' },
      { status: 503 }
    );
  }

  try {
    const rawAds = await client.fbAdLibraryCompanyAds(pageId, {
      country,
      status: 'all',
      trim: false, // vogliamo i dati completi inclusi snapshot e immagini
    });

    const ads = normalizeFacebookAds(rawAds);
    const activeCount = ads.filter((a) => a.isActive).length;
    const inactiveCount = ads.length - activeCount;

    // Ordina: attive prima (più recenti), poi concluse
    ads.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      const aTime = (a.endDate || a.startDate)?.getTime() || 0;
      const bTime = (b.endDate || b.startDate)?.getTime() || 0;
      return bTime - aTime;
    });

    // Log in DB
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('facebook_analyses').upsert(
        {
          page_id: pageId,
          analyzed_at: new Date().toISOString(),
          page_name: ads[0]?.pageName || pageId,
          page_info: {} as any,
          ads_count: ads.length,
          ads_data: ads as any,
          cost_usd: 0,
        },
        { onConflict: 'page_id' }
      );
    } catch (e) {
      console.error('[fb-ads] DB failed:', e);
    }

    return NextResponse.json({
      ads,
      totalCount: ads.length,
      activeCount,
      inactiveCount,
    });
  } catch (err: any) {
    console.error('[fb-ads]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
