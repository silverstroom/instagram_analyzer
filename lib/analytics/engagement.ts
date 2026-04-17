import type { HikerMedia, HikerUser } from '../hikerapi/types';

export interface EngagementStats {
  avgLikes: number;
  avgComments: number;
  avgViews: number | null;
  engagementRate: number; // percentuale (0-100)
  totalInteractions: number;
  sampleSize: number;
}

/**
 * Calcola statistiche di engagement basate sui post forniti.
 * Formula standard: ((like + commenti) / follower) / n_post * 100
 */
export function calculateEngagement(
  user: HikerUser,
  posts: HikerMedia[]
): EngagementStats {
  if (posts.length === 0 || user.follower_count === 0) {
    return {
      avgLikes: 0,
      avgComments: 0,
      avgViews: null,
      engagementRate: 0,
      totalInteractions: 0,
      sampleSize: 0,
    };
  }

  const totalLikes = posts.reduce((s, p) => s + (p.like_count || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.comment_count || 0), 0);
  const viewsPosts = posts.filter((p) => p.play_count || p.view_count);
  const totalViews = viewsPosts.reduce(
    (s, p) => s + (p.play_count || p.view_count || 0),
    0
  );

  const avgLikes = totalLikes / posts.length;
  const avgComments = totalComments / posts.length;
  const avgViews = viewsPosts.length > 0 ? totalViews / viewsPosts.length : null;

  const engagementRate =
    ((totalLikes + totalComments) / posts.length / user.follower_count) * 100;

  return {
    avgLikes,
    avgComments,
    avgViews,
    engagementRate,
    totalInteractions: totalLikes + totalComments,
    sampleSize: posts.length,
  };
}

/**
 * Benchmark di settore (indicativi):
 * < 1%: sotto la media
 * 1-3%: buono
 * 3-6%: ottimo
 * > 6%: eccellente
 */
export function engagementRating(rate: number): {
  label: string;
  color: 'danger' | 'warning' | 'success' | 'info';
} {
  if (rate < 1) return { label: 'Sotto la media', color: 'danger' };
  if (rate < 3) return { label: 'Nella media', color: 'warning' };
  if (rate < 6) return { label: 'Ottimo', color: 'success' };
  return { label: 'Eccellente', color: 'info' };
}
