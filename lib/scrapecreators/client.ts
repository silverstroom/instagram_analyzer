/**
 * ScrapeCreators API client — fonte unica di dati social.
 *
 * Docs: https://docs.scrapecreators.com
 * Auth: x-api-key header
 * Base URL: https://api.scrapecreators.com/v1/
 *
 * Ogni social ha endpoint dedicati; questo wrapper normalizza la risposta.
 */

export const CREDIT_COST_USD = 0.002; // placeholder: il prezzo varia per credito, media stimata

export type Platform = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter';

interface FetchOptions {
  analysisId?: string;
}

export interface RequestLog {
  endpoint: string;
  params: Record<string, string>;
  creditsUsed: number;
  timestamp: Date;
}

// ============================================================
// RESPONSE SHAPES (tipizzate a partire dalla documentazione)
// ============================================================

export interface SCInstagramProfile {
  user: {
    pk?: string;
    pk_id?: string;
    username: string;
    full_name: string;
    biography: string;
    biography_with_entities?: {
      raw_text: string;
      entities?: Array<{ user?: { username: string }; hashtag?: { name: string } }>;
    };
    bio_links?: Array<{ title: string; url: string; link_type: string; lynx_url?: string }>;
    external_url?: string;
    follower_count?: number;
    following_count?: number;
    media_count?: number;
    edge_followed_by?: { count: number };
    edge_follow?: { count: number };
    edge_owner_to_timeline_media?: {
      count: number;
      edges: Array<{
        node: {
          __typename: string;
          id: string;
          shortcode: string;
          display_url: string;
          thumbnail_src?: string;
          video_url?: string;
          is_video: boolean;
          taken_at_timestamp: number;
          edge_media_to_caption?: { edges: Array<{ node: { text: string } }> };
          edge_media_to_comment?: { count: number };
          edge_liked_by?: { count: number };
          edge_media_preview_like?: { count: number };
          video_view_count?: number;
          product_type?: string;
        };
      }>;
    };
    profile_pic_url: string;
    profile_pic_url_hd?: string;
    is_verified: boolean;
    is_business_account?: boolean;
    is_professional_account?: boolean;
    category?: string;
    category_name?: string;
    business_category_name?: string;
    is_private: boolean;
    highlight_reel_count?: number;
    has_clips?: boolean;
  };
}

export interface SCFacebookProfile {
  name: string;
  category?: string;
  profilePicture?: string;
  coverPhoto?: string;
  pageId?: string;
  likes?: number;
  followers?: number;
  isVerified?: boolean;
  about?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  creationDate?: string;
  [key: string]: any;
}

export interface SCFacebookPost {
  id: string;
  url?: string;
  text?: string;
  message?: string;
  type?: string;
  created_time?: string;
  publishedDate?: string;
  reactions?: { total?: number; like?: number; love?: number; [k: string]: any };
  reactionsCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  thumbnail?: string;
  image?: string;
  images?: string[];
  video?: string;
  [key: string]: any;
}

export interface SCFacebookAd {
  adArchiveID?: string;
  ad_archive_id?: string;
  adID?: string;
  pageID?: string;
  pageName?: string;
  isActive?: boolean;
  is_active?: boolean;
  startDate?: number;
  endDate?: number | null;
  publisherPlatforms?: string[];
  publisher_platforms?: string[];
  snapshot?: {
    title?: string;
    body?: { text?: string; markup?: { __html?: string } };
    caption?: string;
    cta_text?: string;
    link_url?: string;
    link_description?: string;
    display_format?: string;
    videos?: Array<{ video_hd_url?: string; video_preview_image_url?: string; video_sd_url?: string }>;
    images?: Array<{
      resized_image_url?: string;
      original_image_url?: string;
      url?: string;
    }>;
    cards?: Array<{
      title?: string;
      body?: string;
      resized_image_url?: string;
      original_image_url?: string;
    }>;
  };
  [key: string]: any;
}

// ============================================================
// CLIENT
// ============================================================

class ScrapeCreatorsClient {
  private apiKey: string;
  private baseUrl = 'https://api.scrapecreators.com/v1';
  private log: RequestLog[] = [];

  constructor() {
    this.apiKey = process.env.SCRAPECREATORS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[scrapecreators] SCRAPECREATORS_API_KEY non configurata');
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private async get<T>(
    endpoint: string,
    params: Record<string, string> = {},
    creditCost: number = 1,
    options: FetchOptions = {}
  ): Promise<T> {
    if (!this.apiKey) throw new Error('SCRAPECREATORS_API_KEY non configurata');

    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'x-api-key': this.apiKey, Accept: 'application/json' },
      next: { revalidate: 300 },
    });

    this.log.push({
      endpoint,
      params,
      creditsUsed: creditCost,
      timestamp: new Date(),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `ScrapeCreators ${res.status} on ${endpoint}: ${body.slice(0, 200)}`
      );
    }

    const json = await res.json();
    // Unwrap { success, data } se presente
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data as T;
    }
    return json as T;
  }

  drainLog(): RequestLog[] {
    const l = this.log;
    this.log = [];
    return l;
  }

  totalCreditsUsed(): number {
    return this.log.reduce((s, r) => s + r.creditsUsed, 0);
  }

  // ============================================================
  // INSTAGRAM
  // ============================================================

  async instagramProfile(handle: string, opts?: FetchOptions): Promise<SCInstagramProfile> {
    return this.get<SCInstagramProfile>(
      '/instagram/profile',
      { handle: handle.replace('@', '').trim() },
      1,
      opts
    );
  }

  async instagramReels(handle: string, opts?: FetchOptions): Promise<any> {
    return this.get<any>(
      '/instagram/user/reels/simple',
      { handle: handle.replace('@', '').trim() },
      1,
      opts
    );
  }

  // ============================================================
  // FACEBOOK
  // ============================================================

  async facebookProfile(url: string, opts?: FetchOptions): Promise<SCFacebookProfile> {
    return this.get<SCFacebookProfile>('/facebook/profile', { url }, 1, opts);
  }

  async facebookPosts(url: string, opts?: FetchOptions): Promise<SCFacebookPost[]> {
    const res = await this.get<any>('/facebook/profile/posts', { url }, 1, opts);
    return res?.posts || res?.data?.posts || (Array.isArray(res) ? res : []);
  }

  async facebookReels(url: string, opts?: FetchOptions): Promise<any[]> {
    try {
      const res = await this.get<any>('/facebook/profile/reels', { url }, 1, opts);
      return res?.reels || (Array.isArray(res) ? res : []);
    } catch {
      return [];
    }
  }

  // ============================================================
  // FACEBOOK AD LIBRARY
  // ============================================================

  /**
   * Cerca aziende nell'Ad Library per nome.
   */
  async fbAdLibrarySearchCompanies(query: string, opts?: FetchOptions): Promise<any[]> {
    const res = await this.get<any>(
      '/facebook/adLibrary/search/companies',
      { query },
      1,
      opts
    );
    return res?.searchResults || res?.companies || (Array.isArray(res) ? res : []);
  }

  /**
   * Ottiene le ADS di una company per pageId.
   * Endpoint principale per il tab Facebook.
   */
  async fbAdLibraryCompanyAds(
    pageId: string,
    options: {
      country?: string;
      status?: 'active' | 'inactive' | 'all';
      trim?: boolean;
    } = {},
    opts?: FetchOptions
  ): Promise<SCFacebookAd[]> {
    const params: Record<string, string> = {
      pageId,
      country: options.country || 'IT',
      status: options.status || 'all',
    };
    if (options.trim !== undefined) params.trim = String(options.trim);

    const res = await this.get<any>(
      '/facebook/adLibrary/company/ads',
      params,
      2, // costa di più perché paginato
      opts
    );

    return res?.results || res?.ads || (Array.isArray(res) ? res : []);
  }

  // ============================================================
  // TIKTOK
  // ============================================================

  async tiktokProfile(handle: string, opts?: FetchOptions): Promise<any> {
    return this.get<any>(
      '/tiktok/profile',
      { handle: handle.replace('@', '').trim() },
      1,
      opts
    );
  }

  async tiktokProfileVideos(handle: string, opts?: FetchOptions): Promise<any> {
    return this.get<any>(
      '/tiktok/profile/videos',
      { handle: handle.replace('@', '').trim() },
      1,
      opts
    );
  }

  // ============================================================
  // YOUTUBE
  // ============================================================

  async youtubeChannel(handle: string, opts?: FetchOptions): Promise<any> {
    return this.get<any>('/youtube/channel', { handle }, 1, opts);
  }

  async youtubeChannelVideos(handle: string, opts?: FetchOptions): Promise<any> {
    return this.get<any>('/youtube/channel/videos', { handle }, 1, opts);
  }

  // ============================================================
  // LINKEDIN
  // ============================================================

  async linkedinProfile(url: string, opts?: FetchOptions): Promise<any> {
    return this.get<any>('/linkedin/profile', { url }, 1, opts);
  }

  async linkedinCompany(url: string, opts?: FetchOptions): Promise<any> {
    return this.get<any>('/linkedin/company', { url }, 1, opts);
  }

  // ============================================================
  // TWITTER
  // ============================================================

  async twitterProfile(handle: string, opts?: FetchOptions): Promise<any> {
    return this.get<any>(
      '/twitter/profile',
      { handle: handle.replace('@', '').trim() },
      1,
      opts
    );
  }

  async twitterUserTweets(handle: string, opts?: FetchOptions): Promise<any> {
    return this.get<any>(
      '/twitter/user-tweets',
      { handle: handle.replace('@', '').trim() },
      1,
      opts
    );
  }
}

let _client: ScrapeCreatorsClient | null = null;
export function getScrapeCreatorsClient(): ScrapeCreatorsClient {
  if (!_client) _client = new ScrapeCreatorsClient();
  return _client;
}
