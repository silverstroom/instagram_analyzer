/**
 * Normalizer — trasforma le risposte (spesso disomogenee) di ScrapeCreators
 * in modelli uniformi consumati da tutto il frontend.
 */

import type { SCInstagramProfile, SCFacebookProfile, SCFacebookPost, SCFacebookAd } from './client';

// ============================================================
// NORMALIZED MODELS
// ============================================================

export interface NormalizedProfile {
  platform: 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter';
  id: string;
  handle: string;
  fullName: string;
  biography: string;
  profilePicUrl?: string;
  profilePicUrlHd?: string;
  externalUrl?: string;
  category?: string;
  isVerified: boolean;
  isBusiness: boolean;
  isPrivate: boolean;
  followerCount: number;
  followingCount: number;
  mediaCount: number;
  bioLinks: Array<{ title: string; url: string }>;
  hasHighlights?: boolean;
  raw: any; // payload originale per debugging
}

export interface NormalizedPost {
  id: string;
  shortcode?: string;
  url?: string;
  type: 'photo' | 'video' | 'reel' | 'carousel' | 'status' | 'link';
  caption: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  takenAt: number; // unix seconds
  likeCount: number;
  commentCount: number;
  shareCount?: number;
  viewCount?: number;
  videoViewCount?: number;
}

export interface NormalizedAd {
  id: string;
  pageId: string;
  pageName: string;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date | null;
  platforms: string[];
  format: 'VIDEO' | 'IMAGE' | 'CAROUSEL' | 'DCO' | 'UNKNOWN';
  title?: string;
  bodyText?: string;
  ctaText?: string;
  linkUrl?: string;
  linkDescription?: string;
  thumbnailUrl?: string;
  thumbnailUrls: string[]; // multiple thumbnails per carousel
  videoUrl?: string;
  raw: any;
}

// ============================================================
// INSTAGRAM NORMALIZERS
// ============================================================

export function normalizeInstagramProfile(raw: SCInstagramProfile): NormalizedProfile {
  const user = raw.user || (raw as any);
  const edges = user.edge_owner_to_timeline_media?.edges || [];

  const user: any = raw.user || (raw as any);
    handle: user.username,
    fullName: user.full_name || '',
    biography: user.biography || user.biography_with_entities?.raw_text || '',
    profilePicUrl: user.profile_pic_url,
    profilePicUrlHd: user.profile_pic_url_hd || user.profile_pic_url,
    externalUrl: user.external_url || user.bio_links?.[0]?.url,
    category: user.category || user.category_name || user.business_category_name,
    isVerified: !!user.is_verified,
    isBusiness: !!(user.is_business_account || user.is_professional_account),
    isPrivate: !!user.is_private,
    followerCount: user.follower_count ?? user.edge_followed_by?.count ?? 0,
    followingCount: user.following_count ?? user.edge_follow?.count ?? 0,
    mediaCount: user.media_count ?? user.edge_owner_to_timeline_media?.count ?? edges.length,
    bioLinks: (user.bio_links || []).map((l: any) => ({
      title: l.title || l.url,
      url: l.url,
    })),
    hasHighlights: (user.highlight_reel_count || 0) > 0,
    raw,
  };
}

export function normalizeInstagramPosts(raw: SCInstagramProfile): NormalizedPost[] {
  const edges = raw.user?.edge_owner_to_timeline_media?.edges || [];

  return edges.map((e) => {
    const node = e.node;
    const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text || '';
    const isVideo = node.is_video || !!node.video_url;
    const isReel = node.product_type === 'clips';

    return {
      id: node.id,
      shortcode: node.shortcode,
      url: `https://www.instagram.com/p/${node.shortcode}/`,
      type: isReel ? 'reel' : isVideo ? 'video' : node.__typename === 'GraphSidecar' ? 'carousel' : 'photo',
      caption,
      thumbnailUrl: node.thumbnail_src || node.display_url,
      mediaUrl: node.video_url || node.display_url,
      takenAt: node.taken_at_timestamp,
      likeCount: node.edge_liked_by?.count ?? node.edge_media_preview_like?.count ?? 0,
      commentCount: node.edge_media_to_comment?.count ?? 0,
      videoViewCount: node.video_view_count,
    };
  });
}

// ============================================================
// FACEBOOK NORMALIZERS
// ============================================================

export function normalizeFacebookProfile(raw: any): NormalizedProfile {
  const p = raw?.data || raw?.profile || raw;

  return {
    platform: 'facebook',
    id: String(p.pageId || p.page_id || p.id || p.url || ''),
    handle: p.username || p.vanity || p.pageId || '',
    fullName: p.name || p.pageName || '',
    biography: p.about || p.description || p.bio || '',
    profilePicUrl: p.profilePicture || p.profile_picture || p.profilePictureUrl || p.profile_pic_url,
    profilePicUrlHd: p.profilePicture || p.profile_picture,
    externalUrl: p.website || p.url_website,
    category: p.category || (Array.isArray(p.categories) ? p.categories.join(', ') : p.categories),
    isVerified: !!(p.isVerified || p.is_verified),
    isBusiness: true,
    isPrivate: false,
    followerCount: p.followers || p.followerCount || p.follower_count || 0,
    followingCount: p.following || p.followingCount || 0,
    mediaCount: p.postCount || p.post_count || 0,
    bioLinks: p.website ? [{ title: p.website, url: p.website }] : [],
    raw,
  };
}

export function normalizeFacebookPosts(raw: any[]): NormalizedPost[] {
  return (raw || []).map((p) => {
    const text = p.text || p.message || p.content || '';
    const thumb =
      p.thumbnail ||
      p.image ||
      (Array.isArray(p.images) ? p.images[0] : undefined) ||
      p.thumbnailUrl;

    let type: NormalizedPost['type'] = 'status';
    if (p.video || p.videoUrl) type = 'video';
    else if (p.images?.length > 1) type = 'carousel';
    else if (thumb) type = 'photo';
    else if (p.link) type = 'link';

    let takenAt = 0;
    if (p.created_time) takenAt = new Date(p.created_time).getTime() / 1000;
    else if (p.publishedDate) takenAt = new Date(p.publishedDate).getTime() / 1000;
    else if (p.date) takenAt = new Date(p.date).getTime() / 1000;
    else if (p.timestamp) takenAt = typeof p.timestamp === 'number' ? p.timestamp : new Date(p.timestamp).getTime() / 1000;

    return {
      id: String(p.id || p.postId || p.post_id || p.url),
      url: p.url || p.postUrl,
      type,
      caption: text,
      thumbnailUrl: thumb,
      mediaUrl: p.video || p.videoUrl || thumb,
      takenAt,
      likeCount: p.reactionsCount || p.reactions?.total || p.likesCount || p.likes_count || 0,
      commentCount: p.commentsCount || p.comments_count || p.comments || 0,
      shareCount: p.sharesCount || p.shares_count || p.shares || 0,
    };
  });
}

// ============================================================
// FACEBOOK ADS NORMALIZERS (IMPORTANTE: questa è la parte critica)
// ============================================================

/**
 * Normalizza una singola ad dall'Ad Library.
 * La struttura dati ScrapeCreators può avere le immagini in:
 * - snapshot.images[].resized_image_url / original_image_url
 * - snapshot.videos[].video_preview_image_url
 * - snapshot.cards[].resized_image_url (per carousel)
 */
export function normalizeFacebookAd(raw: any): NormalizedAd {
  const snapshot = raw.snapshot || raw.creative || {};

  // Raccolta di TUTTE le possibili immagini
  const thumbnailUrls: string[] = [];

  // 1) Video preview images
  for (const v of snapshot.videos || []) {
    if (v.video_preview_image_url) thumbnailUrls.push(v.video_preview_image_url);
  }

  // 2) Images array (foto statiche)
  for (const img of snapshot.images || []) {
    const url = img.resized_image_url || img.original_image_url || img.url;
    if (url) thumbnailUrls.push(url);
  }

  // 3) Cards (carousel)
  for (const card of snapshot.cards || []) {
    const url = card.resized_image_url || card.original_image_url;
    if (url) thumbnailUrls.push(url);
  }

  // 4) Fallback a campi top-level
  if (thumbnailUrls.length === 0) {
    const fallback = raw.image || raw.thumbnail || raw.imageUrl || raw.preview;
    if (fallback) thumbnailUrls.push(fallback);
  }

  // Timestamps: ScrapeCreators li può dare in Unix seconds, Unix ms o string ISO
  const parseDate = (v: any): Date | undefined => {
    if (!v) return undefined;
    if (typeof v === 'number') {
      // Euristica: se > 10^12 sono ms, altrimenti secondi
      return new Date(v > 1e12 ? v : v * 1000);
    }
    if (typeof v === 'string') {
      const d = new Date(v);
      return isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
  };

  const format = (snapshot.display_format || raw.display_format || 'UNKNOWN').toUpperCase();
  const mappedFormat: NormalizedAd['format'] =
    format === 'VIDEO' || format === 'IMAGE' || format === 'CAROUSEL' || format === 'DCO'
      ? format
      : 'UNKNOWN';

  // Body: può essere stringa o oggetto { text } o markup HTML
  let bodyText: string | undefined;
  if (typeof snapshot.body === 'string') bodyText = snapshot.body;
  else if (snapshot.body?.text) bodyText = snapshot.body.text;
  else if (snapshot.body?.markup?.__html) {
    // strip HTML
    bodyText = snapshot.body.markup.__html.replace(/<[^>]*>/g, '').trim();
  }

  return {
    id: String(raw.adArchiveID || raw.ad_archive_id || raw.adID || raw.id || ''),
    pageId: String(raw.pageID || raw.page_id || ''),
    pageName: raw.pageName || raw.page_name || '',
    isActive: raw.isActive ?? raw.is_active ?? (raw.endDate == null && raw.end_date == null),
    startDate: parseDate(raw.startDate || raw.start_date),
    endDate: parseDate(raw.endDate || raw.end_date) || null,
    platforms: raw.publisherPlatforms || raw.publisher_platforms || raw.publisher_platform || [],
    format: mappedFormat,
    title: snapshot.title,
    bodyText,
    ctaText: snapshot.cta_text,
    linkUrl: snapshot.link_url,
    linkDescription: snapshot.link_description,
    thumbnailUrl: thumbnailUrls[0],
    thumbnailUrls,
    videoUrl: snapshot.videos?.[0]?.video_hd_url || snapshot.videos?.[0]?.video_sd_url,
    raw,
  };
}

export function normalizeFacebookAds(raw: any[]): NormalizedAd[] {
  return (raw || []).map(normalizeFacebookAd);
}

// ============================================================
// TIKTOK / YOUTUBE / LINKEDIN / TWITTER (minimalista)
// ============================================================

export function normalizeTikTokProfile(raw: any): NormalizedProfile {
  const u = raw?.user || raw?.data || raw;
  return {
    platform: 'tiktok',
    id: String(u.id || u.sec_uid || u.uniqueId || u.username || ''),
    handle: u.uniqueId || u.username || u.handle || '',
    fullName: u.nickname || u.displayName || '',
    biography: u.signature || u.bio || '',
    profilePicUrl: u.avatarLarger || u.avatarMedium || u.avatarThumb || u.profilePicUrl,
    profilePicUrlHd: u.avatarLarger || u.avatarMedium,
    externalUrl: u.bioLink?.link,
    category: u.category,
    isVerified: !!u.verified,
    isBusiness: false,
    isPrivate: !!u.privateAccount,
    followerCount: u.followerCount || u.stats?.followerCount || 0,
    followingCount: u.followingCount || u.stats?.followingCount || 0,
    mediaCount: u.videoCount || u.stats?.videoCount || 0,
    bioLinks: u.bioLink?.link ? [{ title: u.bioLink.link, url: u.bioLink.link }] : [],
    raw,
  };
}

export function normalizeYouTubeChannel(raw: any): NormalizedProfile {
  const c = raw?.channel || raw?.data || raw;
  return {
    platform: 'youtube',
    id: String(c.channelId || c.id || c.handle || ''),
    handle: c.handle || c.customUrl || c.channelId || '',
    fullName: c.title || c.name || '',
    biography: c.description || '',
    profilePicUrl: c.thumbnailUrl || c.avatar,
    profilePicUrlHd: c.thumbnailUrl || c.avatar,
    externalUrl: c.externalLinks?.[0]?.url,
    category: c.category,
    isVerified: !!c.verified,
    isBusiness: false,
    isPrivate: false,
    followerCount: c.subscriberCount || c.subscribers || 0,
    followingCount: 0,
    mediaCount: c.videoCount || 0,
    bioLinks: [],
    raw,
  };
}

export function normalizeLinkedInProfile(raw: any): NormalizedProfile {
  const p = raw?.profile || raw?.company || raw?.data || raw;
  return {
    platform: 'linkedin',
    id: String(p.id || p.publicIdentifier || p.universalName || ''),
    handle: p.publicIdentifier || p.universalName || p.vanityName || '',
    fullName: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
    biography: p.description || p.headline || p.summary || '',
    profilePicUrl: p.profilePicture || p.logo || p.logoUrl || p.pictureUrl,
    profilePicUrlHd: p.profilePicture || p.logo,
    externalUrl: p.website,
    category: p.industry,
    isVerified: !!p.verified,
    isBusiness: !!p.company,
    isPrivate: false,
    followerCount: p.followers || p.followerCount || 0,
    followingCount: p.following || 0,
    mediaCount: p.postsCount || 0,
    bioLinks: p.website ? [{ title: p.website, url: p.website }] : [],
    raw,
  };
}

export function normalizeTwitterProfile(raw: any): NormalizedProfile {
  const u = raw?.user || raw?.data || raw;
  return {
    platform: 'twitter',
    id: String(u.id || u.id_str || u.screen_name || u.username || ''),
    handle: u.username || u.screen_name || u.handle || '',
    fullName: u.name || u.displayName || '',
    biography: u.description || u.bio || '',
    profilePicUrl: u.profile_image_url_https?.replace('_normal', '_400x400') || u.avatar || u.profileImageUrl,
    profilePicUrlHd: u.profile_image_url_https?.replace('_normal', '_400x400') || u.avatar,
    externalUrl: u.url || u.entities?.url?.urls?.[0]?.expanded_url,
    category: undefined,
    isVerified: !!u.verified,
    isBusiness: false,
    isPrivate: !!u.protected,
    followerCount: u.followers_count || u.followersCount || 0,
    followingCount: u.friends_count || u.followingCount || 0,
    mediaCount: u.statuses_count || u.tweetsCount || 0,
    bioLinks: u.url ? [{ title: u.url, url: u.url }] : [],
    raw,
  };
}
