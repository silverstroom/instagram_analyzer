import { NextResponse } from 'next/server';
import { getHikerClient, COST_PER_REQUEST_USD } from '@/lib/hikerapi/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { estimateDeepFocusCost, type DeepFocusModuleId } from '@/lib/hikerapi/endpoints';
import { calculateEngagement } from '@/lib/analytics/engagement';
import { analyzePostingPattern } from '@/lib/analytics/posting-patterns';
import { extractHashtagStats } from '@/lib/analytics/hashtags';
import type { HikerMedia, HikerStory, HikerRelatedProfile, HikerHashtag } from '@/lib/hikerapi/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/deep-focus
 * Body: { username: string, modules: DeepFocusModuleId[], confirmedCost: number }
 *
 * Esegue la deep focus analysis. L'utente deve aver confermato il costo
 * tramite /api/deep-focus/estimate prima di chiamare questo endpoint.
 */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    username: string;
    modules: DeepFocusModuleId[];
    confirmedCost: number;
  };

  const { username, modules, confirmedCost } = body;
  const cleanUsername = username.replace('@', '').trim().toLowerCase();
  const analysisId = `deep_${cleanUsername}_${Date.now()}`;

  if (!modules || modules.length === 0) {
    return NextResponse.json(
      { error: 'Nessun modulo selezionato' },
      { status: 400 }
    );
  }

  try {
    const hiker = getHikerClient();

    // Fetch profilo (condiviso fra tutti i moduli)
    const user = await hiker.userByUsername(cleanUsername, { analysisId });

    // Verifica budget (double-check: la stima potrebbe essere stata fatta tempo fa)
    const monthlyCap = parseFloat(process.env.NEXT_PUBLIC_MONTHLY_BUDGET_CAP || '20');
    const budget = await getCurrentMonthBudget();
    const estimate = estimateDeepFocusCost(user, modules);

    if (budget.spent + estimate.total > monthlyCap) {
      return NextResponse.json(
        {
          error: 'Budget mensile superato',
          budget: {
            cap: monthlyCap,
            spent: budget.spent,
            wouldCost: estimate.total,
          },
        },
        { status: 402 } // Payment Required
      );
    }

    // ---- Esegui moduli richiesti ----
    const results: Record<string, any> = {};

    let posts: HikerMedia[] = [];
    if (modules.includes('posts_90')) {
      posts = await hiker.userMediasBulk(user.pk, 90, { analysisId });
      const engagement = calculateEngagement(user, posts);
      const pattern = analyzePostingPattern(posts);
      results.posts = {
        items: posts,
        engagement,
        pattern,
      };
    }

    if (modules.includes('hashtag_analysis')) {
      // Se abbiamo già i post, estraiamo hashtag da quelli
      const postsForHashtags = posts.length > 0 ? posts : await hiker.userMediasBulk(user.pk, 30, { analysisId });
      const topTags = extractHashtagStats(postsForHashtags).slice(0, 3);

      const hashtagDetails: (HikerHashtag & { performance: any })[] = [];
      for (const tagStat of topTags) {
        try {
          const info = await hiker.hashtagInfo(tagStat.tag.replace('#', ''), { analysisId });
          hashtagDetails.push({ ...info, performance: tagStat });
        } catch (e) {
          console.warn('[deep-focus] hashtag fetch failed for', tagStat.tag);
        }
      }
      results.hashtags = {
        topByPerformance: extractHashtagStats(postsForHashtags).slice(0, 20),
        details: hashtagDetails,
      };
    }

    if (modules.includes('stories')) {
      let stories: HikerStory[] = [];
      try {
        stories = await hiker.userStories(user.pk, { analysisId });
      } catch (e) {
        console.warn('[deep-focus] stories non disponibili:', e);
      }
      results.stories = stories;
    }

    if (modules.includes('audience_quality')) {
      const sample: any[] = [];
      let nextPage: string | undefined;
      for (let i = 0; i < 5; i++) {
        try {
          const page = await hiker.userFollowersPage(user.pk, nextPage, { analysisId });
          sample.push(...page.users);
          if (!page.next_page_id) break;
          nextPage = page.next_page_id;
        } catch (e) {
          console.warn('[deep-focus] followers page fetch failed:', e);
          break;
        }
      }

      // Score qualità audience grezzo: %verified, %private, %con foto profilo
      const verified = sample.filter((u) => u.is_verified).length;
      const privateCount = sample.filter((u) => u.is_private).length;
      const withPic = sample.filter((u) => u.profile_pic_url && !u.profile_pic_url.includes('default')).length;

      results.audience = {
        sampleSize: sample.length,
        verifiedPct: sample.length ? (verified / sample.length) * 100 : 0,
        privatePct: sample.length ? (privateCount / sample.length) * 100 : 0,
        withProfilePicPct: sample.length ? (withPic / sample.length) * 100 : 0,
      };
    }

    if (modules.includes('competitor_discovery')) {
      let related: HikerRelatedProfile[] = [];
      try {
        related = await hiker.userRelatedProfiles(user.pk, { analysisId });
      } catch (e) {
        console.warn('[deep-focus] related profiles failed:', e);
      }
      results.competitors = related.slice(0, 10);
    }

    // ---- Log costi reali ----
    const logs = hiker.drainLog();
    const actualRequests = logs.length;
    const actualCost = actualRequests * COST_PER_REQUEST_USD;

    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('api_usage').insert({
        profile_username: cleanUsername,
        analysis_type: 'deep_focus',
        modules_used: modules,
        request_count: actualRequests,
        estimated_cost_usd: actualCost,
        success: true,
      });

      await supabase.from('deep_focus_results').insert({
        username: cleanUsername,
        modules_used: modules,
        cost_usd: actualCost,
        data: { user, ...results },
      });
    } catch (e) {
      console.error('[deep-focus] DB write failed:', e);
    }

    return NextResponse.json({
      username: cleanUsername,
      user,
      ...results,
      cost: {
        requests: actualRequests,
        usd: actualCost,
        estimated: confirmedCost,
      },
    });
  } catch (err: any) {
    console.error('[deep-focus] error:', err);
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('api_usage').insert({
        profile_username: cleanUsername,
        analysis_type: 'deep_focus',
        modules_used: modules,
        request_count: 0,
        estimated_cost_usd: 0,
        success: false,
        error_message: err?.message ?? 'unknown',
      });
    } catch {}

    return NextResponse.json(
      { error: err?.message ?? 'Errore durante la deep analysis' },
      { status: 500 }
    );
  }
}

async function getCurrentMonthBudget(): Promise<{ spent: number }> {
  try {
    const supabase = getSupabaseAdmin();
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('api_usage')
      .select('estimated_cost_usd')
      .gte('timestamp', firstOfMonth.toISOString())
      .eq('success', true);

    const spent = (data ?? []).reduce(
      (s, row: any) => s + Number(row.estimated_cost_usd || 0),
      0
    );
    return { spent };
  } catch {
    return { spent: 0 };
  }
}
