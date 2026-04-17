/**
 * Client HikerAPI: esteso v4 con endpoints Facebook.
 * HikerAPI supporta Facebook tramite endpoint dedicati.
 *
 * Vedi https://hiker-doc.readthedocs.io per il dettaglio.
 */

import type {
  HikerUser,
  HikerMedia,
  HikerMediasPage,
  HikerStory,
  HikerRelatedProfile,
  HikerHashtag,
} from './types';

export const COST_PER_REQUEST_USD = 0.0006;

interface FetchOptions {
  analysisId?: string;
}

export interface RequestLog {
  endpoint: string;
  params: Record<string, string>;
  requestCount: number;
  estimatedCost: number;
  analysisId?: string;
  timestamp: Date;
}

export interface FacebookPageData {
  page_id: string;
  name: string;
  username?: string;
  category?: string;
  likes?: number;
  followers?: number;
  about?: string;
  profile_picture_url?: string;
  cover_photo_url?: string;
  is_verified?: boolean;
  website?: string;
  created_at?: string;
}

export interface FacebookPost {
  id: string;
  post_url?: string;
  message?: string; // il "caption" di FB
  created_time?: number;
  type?: 'photo' | 'video' | 'link' | 'status' | 'album';
  reactions_count?: number;
  comments_count?: number;
  shares_count?: number;
  thumbnail_url?: string;
  full_picture?: string;
}

class HikerClient {
  private baseUrl: string;
  private accessKey: string;
  private requestLog: RequestLog[] = [];

  constructor() {
    this.baseUrl = process.env.HIKERAPI_BASE_URL || 'https://api.hikerapi.com';
    this.accessKey = process.env.HIKERAPI_ACCESS_KEY || '';
    if (!this.accessKey) {
      console.warn('[hikerapi] HIKERAPI_ACCESS_KEY non configurata');
    }
  }

  private async get<T>(
    endpoint: string,
    params: Record<string, string> = {},
    options: FetchOptions = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-access-key': this.accessKey,
        Accept: 'application/json',
      },
      next: { revalidate: 300 },
    });

    this.requestLog.push({
      endpoint,
      params,
      requestCount: 1,
      estimatedCost: COST_PER_REQUEST_USD,
      analysisId: options.analysisId,
      timestamp: new Date(),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `HikerAPI error ${res.status} on ${endpoint}: ${body.slice(0, 200)}`
      );
    }

    const json = await res.json();
    // Unwrap "response" wrapper se presente
    if (
      json &&
      typeof json === 'object' &&
      'response' in json &&
      json.response
    ) {
      return json.response as T;
    }
    return json as T;
  }

  drainLog(): RequestLog[] {
    const log = this.requestLog;
    this.requestLog = [];
    return log;
  }

  totalCost(): number {
    return this.requestLog.reduce((sum, r) => sum + r.estimatedCost, 0);
  }

  // ---- INSTAGRAM (unchanged) ----

  async userByUsername(username: string, opts?: FetchOptions): Promise<HikerUser> {
    const data = await this.get<any>(
      '/v1/user/by/username',
      { username: username.replace('@', '').trim() },
      opts
    );
    return (data?.user ?? data) as HikerUser;
  }

  async userById(userId: string, opts?: FetchOptions): Promise<HikerUser> {
    const data = await this.get<any>('/v1/user/by/id', { id: userId }, opts);
    return (data?.user ?? data) as HikerUser;
  }

  async userMedias(
    userId: string,
    pageId?: string,
    opts?: FetchOptions
  ): Promise<HikerMediasPage> {
    const params: Record<string, string> = { user_id: userId };
    if (pageId) params.end_cursor = pageId;
    const data = await this.get<any>('/v2/user/medias', params, opts);
    return {
      items: data?.items ?? [],
      next_page_id: data?.next_max_id ?? null,
    };
  }

  async userMediasBulk(
    userId: string,
    count: number = 12,
    opts?: FetchOptions
  ): Promise<HikerMedia[]> {
    const out: HikerMedia[] = [];
    let nextPage: string | undefined;
    let safety = 0;

    while (out.length < count && safety < 20) {
      const page = await this.userMedias(userId, nextPage, opts);
      if (!page.items?.length) break;
      out.push(...page.items);
      if (!page.next_page_id) break;
      nextPage = page.next_page_id;
      safety++;
    }

    return out.slice(0, count);
  }

  async userStories(userId: string, opts?: FetchOptions): Promise<HikerStory[]> {
    const data = await this.get<any>('/v1/user/stories', { user_id: userId }, opts);
    const reels = Object.values(data?.reels || {}) as any[];
    return reels.flatMap((r) => r.items || []);
  }

  async userRelatedProfiles(
    userId: string,
    opts?: FetchOptions
  ): Promise<HikerRelatedProfile[]> {
    const data = await this.get<any>(
      '/v1/user/related/profiles',
      { user_id: userId },
      opts
    );
    return data?.users || [];
  }

  async userFollowersPage(
    userId: string,
    pageId?: string,
    opts?: FetchOptions
  ): Promise<{ users: any[]; next_page_id?: string }> {
    const params: Record<string, string> = { user_id: userId };
    if (pageId) params.end_cursor = pageId;
    const data = await this.get<any>('/v1/user/followers', params, opts);
    return {
      users: data?.users ?? data?.items ?? [],
      next_page_id: data?.next_max_id ?? data?.end_cursor ?? undefined,
    };
  }

  async hashtagInfo(name: string, opts?: FetchOptions): Promise<HikerHashtag> {
    return this.get<HikerHashtag>(
      '/v1/hashtag/by/name',
      { name: name.replace('#', '').trim() },
      opts
    );
  }

  // ---- FACEBOOK (NUOVO) ----
  // Nota: HikerAPI ha endpoint facebook con path /v1/fb/*
  // Le query response sono wrapped in { response: ... } come Instagram

  /**
   * Cerca una pagina Facebook per nome/URL/username.
   */
  async fbPageSearch(
    query: string,
    opts?: FetchOptions
  ): Promise<Array<{ page_id: string; name: string; category?: string }>> {
    try {
      const data = await this.get<any>(
        '/v1/fb/page/search',
        { query },
        opts
      );
      return (data?.pages || data?.results || []).map((p: any) => ({
        page_id: String(p.id || p.page_id),
        name: p.name,
        category: p.category,
      }));
    } catch (e) {
      console.warn('[fb] search failed, returning empty:', e);
      return [];
    }
  }

  /**
   * Info pagina Facebook dato il page_id.
   */
  async fbPageInfo(pageId: string, opts?: FetchOptions): Promise<FacebookPageData> {
    const data = await this.get<any>(
      '/v1/fb/page/by/id',
      { id: pageId },
      opts
    );
    const p = data?.page ?? data;
    return {
      page_id: String(p.id || p.page_id || pageId),
      name: p.name || '',
      username: p.username || p.link_name,
      category: p.category,
      likes: p.fan_count || p.likes,
      followers: p.followers_count || p.fan_count,
      about: p.about || p.description,
      profile_picture_url: p.profile_picture?.url || p.profile_pic_url,
      cover_photo_url: p.cover?.source,
      is_verified: p.is_verified || p.verified,
      website: p.website,
      created_at: p.founded || p.founded_date,
    };
  }

  /**
   * Post recenti di una pagina FB.
   */
  async fbPagePosts(
    pageId: string,
    limit: number = 12,
    opts?: FetchOptions
  ): Promise<FacebookPost[]> {
    try {
      const data = await this.get<any>(
        '/v1/fb/page/posts',
        { page_id: pageId, limit: String(limit) },
        opts
      );
      const items = data?.posts || data?.items || [];
      return items.map((p: any) => ({
        id: String(p.id || p.post_id),
        post_url: p.permalink_url || p.link,
        message: p.message || p.story,
        created_time: p.created_time
          ? new Date(p.created_time).getTime() / 1000
          : undefined,
        type: p.type || (p.attachments?.[0]?.type ?? 'status'),
        reactions_count: p.reactions?.summary?.total_count || p.likes_count,
        comments_count: p.comments?.summary?.total_count || p.comments_count,
        shares_count: p.shares?.count || p.shares_count,
        thumbnail_url: p.full_picture || p.picture,
        full_picture: p.full_picture,
      }));
    } catch (e) {
      console.warn('[fb] posts failed:', e);
      return [];
    }
  }
}

let _client: HikerClient | null = null;
export function getHikerClient(): HikerClient {
  if (!_client) _client = new HikerClient();
  return _client;
}

export type { HikerClient };
