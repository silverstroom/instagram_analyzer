/**
 * Normalizer — trasforma le risposte di ScrapeCreators in modelli uniformi.
 * Payload `raw` sono tipati any perché le strutture variano tra social.
 * La tipizzazione forte è sui NormalizedProfile/Post/Ad (output).
 */

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
  coverPhotoUrl?: string;
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
  fbAdLibraryPageId?: string;
  fbEmail?: string;
  fbPhone?: string;
  raw: any;
}

export interface NormalizedPost {
  id: string;
  shortcode?: string;
  url?: string;
  type: 'photo' | 'video' | 'reel' | 'carousel' | 'status' | 'link';
  caption: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  takenAt: number;
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
  thumbnailUrls: string[];
  videoUrl?: string;
  raw: any;
}

// ============================================================
// INSTAGRAM
// ============================================================

export function normalizeInstagramProfile(raw: any): NormalizedProfile {
  const user: any = raw?.user || raw || {};
  const edges: any[] = user.edge_owner_to_timeline_media?.edges || [];

  return {
    platform: 'instagram',
    id: String(user.pk || user.pk_id || user.id || user.username || ''),
    handle: user.username || '',
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

export function normalizeInstagramPosts(raw: any): NormalizedPost[] {
  const edges: any[] = raw?.user?.edge_owner_to_timeline_media?.edges || [];

  return edges.map((e: any) => {
    const node = e.node || {};
    const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text || '';
    const isVideo = node.is_video || !!node.video_url;
    const isReel = node.product_type === 'clips';

    return {
      id: String(node.id || ''),
      shortcode: node.shortcode,
      url: `https://www.instagram.com/p/${node.shortcode}/`,
      type: isReel ? 'reel' : isVideo ? 'video' : node.__typename === 'GraphSidecar' ? 'carousel' : 'photo',
      caption,
      thumbnailUrl: node.thumbnail_src || node.display_url,
      mediaUrl: node.video_url || node.display_url,
      takenAt: node.taken_at_timestamp || 0,
      likeCount: node.edge_liked_by?.count ?? node.edge_media_preview_like?.count ?? 0,
      commentCount: node.edge_media_to_comment?.count ?? 0,
      videoViewCount: node.video_view_count,
    };
  });
}

// ============================================================
// FACEBOOK — fix per struttura ScrapeCreators reale
// ============================================================

export function normalizeFacebookProfile(raw: any): NormalizedProfile {
  const p: any = raw || {};

  const fullName = p.name || p.pageName || '';
  const profileId = String(p.id || p.pageId || '');

  let handle = '';
  if (p.url) {
    const m = p.url.match(/facebook\.com\/([^/?#]+)/);
    if (m) handle = m[1];
  }
  if (!handle) handle = fullName.toLowerCase().replace(/\s+/g, '');

  const coverPhoto =
    p.coverPhoto?.photo?.image?.uri ||
    p.coverPhoto?.viewer_image?.uri ||
    p.cover?.source;

  const profilePicUrl = p.profilePicLarge || p.profilePicMedium || p.profilePicSmall;
  const profilePicUrlHd = p.profilePicLarge || p.profilePicMedium;

  const followerCount = p.followerCount || p.followers || 0;
  const likeCount = p.likeCount || p.likes || 0;

  const biography = p.pageIntro || p.about || p.description || p.bio || '';
  const category = p.category || (Array.isArray(p.categories) ? p.categories.join(', ') : p.categories);

  const isBusiness = !!p.adLibrary?.pageId || !!p.isBusinessPageActive || true;
  const isVerified = !!(p.isVerified || p.is_verified || p.verified);

  const bioLinks: Array<{ title: string; url: string }> = [];
  if (p.website) bioLinks.push({ title: p.website, url: p.website });
  if (Array.isArray(p.links)) {
    for (const l of p.links) {
      if (typeof l === 'string') bioLinks.push({ title: l, url: l });
      else if (l?.url) bioLinks.push({ title: l.title || l.url, url: l.url });
    }
  }

  return {
    platform: 'facebook',
    id: profileId,
    handle,
    fullName,
    biography,
    profilePicUrl,
    profilePicUrlHd,
    coverPhotoUrl: coverPhoto,
    externalUrl: p.website || p.url_website,
    category,
    isVerified,
    isBusiness,
    isPrivate: false,
    followerCount: followerCount || likeCount,
    followingCount: 0,
    mediaCount: p.postCount || p.post_count || 0,
    bioLinks,
    fbAdLibraryPageId: p.adLibrary?.pageId,
    fbEmail: p.email,
    fbPhone: p.phone,
    raw,
  };
}

export function normalizeFacebookPosts(raw: any): NormalizedPost[] {
  let arr: any[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (Array.isArray(raw?.posts)) arr = raw.posts;
  else if (Array.isArray(raw?.data?.posts)) arr = raw.data.posts;
  else if (Array.isArray(raw?.results)) arr = raw.results;

  return arr.map((p: any) => {
    const text = p.text || p.message || p.content || p.story || '';
    const thumb =
      p.thumbnail ||
      p.image ||
      p.full_picture ||
      (Array.isArray(p.images) ? p.images[0] : undefined) ||
      p.thumbnailUrl ||
      p.photo_url;

    let type: NormalizedPost['type'] = 'status';
    if (p.video || p.videoUrl || p.video_url) type = 'video';
    else if (p.images?.length > 1 || p.attachments?.length > 1) type = 'carousel';
    else if (thumb) type = 'photo';
    else if (p.link || p.url_link) type = 'link';

    let takenAt = 0;
    const timeField = p.created_time || p.publishedDate || p.date || p.timestamp || p.creation_time;
    if (timeField) {
      if (typeof timeField === 'number') {
        takenAt = timeField > 1e12 ? timeField / 1000 : timeField;
      } else {
        const d = new Date(timeField);
        if (!isNaN(d.getTime())) takenAt = d.getTime() / 1000;
      }
    }

    return {
      id: String(p.id || p.postId || p.post_id || p.url || ''),
      url: p.url || p.postUrl || p.permalink_url,
      type,
      caption: text,
      thumbnailUrl: thumb,
      mediaUrl: p.video || p.videoUrl || p.video_url || thumb,
      takenAt,
      likeCount:
        p.reactionsCount ||
        p.reactions?.total ||
        p.likesCount ||
        p.likes_count ||
        p.likes ||
        0,
      commentCount: p.commentsCount || p.comments_count || p.comments || 0,
      shareCount: p.sharesCount || p.shares_count || p.shares || 0,
    };
  });
}

// ============================================================
// FACEBOOK ADS
// ============================================================

export function normalizeFacebookAd(raw: any): NormalizedAd {
  const snapshot: any = raw?.snapshot || raw?.creative || {};
  const thumbnailUrls: string[] = [];

  for (const v of snapshot.videos || []) {
    if (v.video_preview_image_url) thumbnailUrls.push(v.video_preview_image_url);
  }
  for (const img of snapshot.images || []) {
    const url = img.resized_image_url || img.original_image_url || img.url;
    if (url) thumbnailUrls.push(url);
  }
  for (const card of snapshot.cards || []) {
    const url = card.resized_image_url || card.original_image_url;
    if (url) thumbnailUrls.push(url);
  }
  if (thumbnailUrls.length === 0) {
    const fallback = raw?.image || raw?.thumbnail || raw?.imageUrl || raw?.preview;
    if (fallback) thumbnailUrls.push(fallback);
  }

  const parseDate = (v: any): Date | undefined => {
    if (!v) return undefined;
    if (typeof v === 'number') return new Date(v > 1e12 ? v : v * 1000);
    if (typeof v === 'string') {
      const d = new Date(v);
      return isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
  };

  const format = (snapshot.display_format || raw?.display_format || 'UNKNOWN').toUpperCase();
  const mappedFormat: NormalizedAd['format'] =
    format === 'VIDEO' || format === 'IMAGE' || format === 'CAROUSEL' || format === 'DCO'
      ? format
      : 'UNKNOWN';

  let bodyText: string | undefined;
  if (typeof snapshot.body === 'string') bodyText = snapshot.body;
  else if (snapshot.body?.text) bodyText = snapshot.body.text;
  else if (snapshot.body?.markup?.__html) {
    bodyText = snapshot.body.markup.__html.replace(/<[^>]*>/g, '').trim();
  }

  return {
    id: String(raw?.adArchiveID || raw?.ad_archive_id || raw?.adID || raw?.id || ''),
    pageId: String(raw?.pageID || raw?.page_id || ''),
    pageName: raw?.pageName || raw?.page_name || '',
    isActive: raw?.isActive ?? raw?.is_active ?? (raw?.endDate == null && raw?.end_date == null),
    startDate: parseDate(raw?.startDate || raw?.start_date),
    endDate: parseDate(raw?.endDate || raw?.end_date) || null,
    platforms: raw?.publisherPlatforms || raw?.publisher_platforms || raw?.publisher_platform || [],
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

export function normalizeFacebookAds(raw: any): NormalizedAd[] {
  const arr: any[] = Array.isArray(raw) ? raw : [];
  return arr.map(normalizeFacebookAd);
}

// ============================================================
// TIKTOK / YOUTUBE / LINKEDIN / TWITTER
// ============================================================

export function normalizeTikTokProfile(raw: any): NormalizedProfile {
  const u: any = raw?.user || raw?.data || raw || {};
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
  const c: any = raw?.channel || raw?.data || raw || {};
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
  const p: any = raw?.profile || raw?.company || raw?.data || raw || {};
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
  const u: any = raw?.user || raw?.data || raw || {};
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
