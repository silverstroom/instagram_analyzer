import type { HikerMedia } from '../hikerapi/types';

export interface HashtagStat {
  tag: string;
  usageCount: number;
  avgEngagement: number;
  totalEngagement: number;
  posts: string[];
}

/**
 * Estrae il testo della caption in modo robusto.
 * HikerAPI a volte usa caption_text (stringa), altre volte caption (oggetto con .text).
 * Questa funzione li gestisce entrambi + fallback a altri campi comuni.
 */
export function extractCaptionText(post: any): string {
  if (!post) return '';

  // Campi possibili in ordine di probabilità
  const candidates = [
    post.caption_text,
    typeof post.caption === 'string' ? post.caption : null,
    post.caption?.text,
    post.text,
    post.accessibility_caption,
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c;
  }
  return '';
}

/**
 * Estrae hashtag da una stringa, normalizzati lowercase.
 * Unicode-aware: funziona con caratteri accentati, emoji esclusi.
 */
export function extractHashtagsFromText(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#[\p{L}0-9_]+/gu) || [];
  return Array.from(new Set(matches.map((m) => m.toLowerCase())));
}

/**
 * Calcola statistiche hashtag dai post.
 */
export function extractHashtagStats(posts: HikerMedia[]): HashtagStat[] {
  const stats = new Map<string, HashtagStat>();

  for (const post of posts) {
    const caption = extractCaptionText(post);
    const tags = extractHashtagsFromText(caption);
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
      if (post.code) existing.posts.push(post.code);
      stats.set(tag, existing);
    }
  }

  return Array.from(stats.values())
    .map((s) => ({
      ...s,
      avgEngagement: s.usageCount > 0 ? s.totalEngagement / s.usageCount : 0,
    }))
    .sort((a, b) => b.usageCount - a.usageCount); // primario: frequenza d'uso
}

/**
 * Debug helper: loggal primi 3 post per verificare struttura dati
 */
export function debugCaptionStructure(posts: any[]): void {
  if (!posts || posts.length === 0) return;
  const sample = posts.slice(0, 3).map((p) => ({
    code: p.code,
    has_caption_text: typeof p.caption_text === 'string',
    caption_text_preview: typeof p.caption_text === 'string' ? p.caption_text.slice(0, 100) : null,
    has_caption_obj: typeof p.caption === 'object' && p.caption !== null,
    caption_obj_text_preview:
      typeof p.caption === 'object' && p.caption?.text ? p.caption.text.slice(0, 100) : null,
    has_caption_string: typeof p.caption === 'string',
    caption_string_preview: typeof p.caption === 'string' ? p.caption.slice(0, 100) : null,
  }));
  console.log('[hashtag-debug]', JSON.stringify(sample, null, 2));
}
