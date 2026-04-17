import type { HikerMedia } from '../hikerapi/types';

export interface HashtagStat {
  tag: string;
  usageCount: number;
  avgEngagement: number;
  totalEngagement: number;
  posts: string[]; // shortcodes dei post
}

/**
 * Estrae hashtag dalle caption dei post e li ordina per performance.
 */
export function extractHashtagStats(posts: HikerMedia[]): HashtagStat[] {
  const stats = new Map<string, HashtagStat>();

  for (const post of posts) {
    const tags = extractHashtags(post.caption_text || '');
    const engagement = (post.like_count || 0) + (post.comment_count || 0);

    for (const tag of tags) {
      const existing = stats.get(tag) ?? {
        tag,
        usageCount: 0,
        avgEngagement: 0,
        totalEngagement: 0,
        posts: [],
      };
      existing.usageCount += 1;
      existing.totalEngagement += engagement;
      existing.posts.push(post.code);
      stats.set(tag, existing);
    }
  }

  // Calcola media e ordina
  return Array.from(stats.values())
    .map((s) => ({ ...s, avgEngagement: s.totalEngagement / s.usageCount }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement);
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\p{L}0-9_]+/gu) || [];
  return Array.from(new Set(matches.map((m) => m.toLowerCase())));
}
