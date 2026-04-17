import type {
  HikerUser,
  HikerMedia,
  HikerMediasPage,
  HikerStory,
  HikerRelatedProfile,
  HikerHashtag,
} from './types';

/**
 * Costo medio HikerAPI: $0.0006 per request
 * https://hikerapi.com/pricing
 */
export const COST_PER_REQUEST_USD = 0.0006;

interface FetchOptions {
  /** ID opzionale per aggregare i costi di una specifica analisi */
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

  /**
   * Esegue una chiamata GET all'API HikerAPI con tracking dei costi.
   */
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
        'Accept': 'application/json',
      },
      // Cache di default a 5 minuti per ridurre chiamate duplicate
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

    return res.json() as Promise<T>;
  }

  /** Restituisce e pulisce il log delle richieste (per report di costo) */
  drainLog(): RequestLog[] {
    const log = this.requestLog;
    this.requestLog = [];
    return log;
  }

  /** Somma costo stimato delle richieste registrate */
  totalCost(): number {
    return this.requestLog.reduce((sum, r) => sum + r.estimatedCost, 0);
  }

  // ------------------------------------------------------------------
  // USER ENDPOINTS
  // ------------------------------------------------------------------

  /**
   * Recupera le info di un profilo dall'username.
   * Costo: 1 request
   */
  async userByUsername(username: string, opts?: FetchOptions): Promise<HikerUser> {
    const data = await this.get<{ user: HikerUser }>(
      '/v1/user/by/username',
      { username: username.replace('@', '').trim() },
      opts
    );
    return data.user ?? (data as unknown as HikerUser);
  }

  /**
   * Recupera le info di un profilo dal suo ID (pk).
   * Costo: 1 request
   */
  async userById(userId: string, opts?: FetchOptions): Promise<HikerUser> {
    const data = await this.get<{ user: HikerUser }>(
      '/v1/user/by/id',
      { id: userId },
      opts
    );
    return data.user ?? (data as unknown as HikerUser);
  }

  /**
   * Recupera i media (post) di un utente, paginati.
   * Costo: 1 request per pagina (~12 post)
   */
  async userMedias(
    userId: string,
    pageId?: string,
    opts?: FetchOptions
  ): Promise<HikerMediasPage> {
    const params: Record<string, string> = { user_id: userId };
    if (pageId) params.page_id = pageId;
    const data = await this.get<HikerMediasPage>('/v2/user/medias', params, opts);
    return data;
  }

  /**
   * Recupera N medias di un utente (gestendo paginazione interna).
   * Costo: ceil(count / 12) requests
   */
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

  /**
   * Recupera le stories attive di un utente.
   * Costo: 1 request
   */
  async userStories(userId: string, opts?: FetchOptions): Promise<HikerStory[]> {
    const data = await this.get<{ reels: Record<string, { items: HikerStory[] }> }>(
      '/v1/user/stories',
      { user_id: userId },
      opts
    );
    const reels = Object.values(data.reels || {});
    return reels.flatMap((r) => r.items || []);
  }

  /**
   * Recupera profili "related" (suggeriti) — utili per auto-discovery competitor.
   * Costo: 1 request
   */
  async userRelatedProfiles(
    userId: string,
    opts?: FetchOptions
  ): Promise<HikerRelatedProfile[]> {
    const data = await this.get<{ users: HikerRelatedProfile[] }>(
      '/v1/user/related/profiles',
      { user_id: userId },
      opts
    );
    return data.users || [];
  }

  /**
   * Recupera un sample di follower di un utente.
   * Costo: 1 request per pagina
   */
  async userFollowersPage(
    userId: string,
    pageId?: string,
    opts?: FetchOptions
  ): Promise<{ users: Array<{ pk: string; username: string; is_private: boolean; is_verified: boolean; profile_pic_url: string }>; next_page_id?: string }> {
    const params: Record<string, string> = { user_id: userId };
    if (pageId) params.page_id = pageId;
    return this.get('/v1/user/followers', params, opts);
  }

  // ------------------------------------------------------------------
  // HASHTAG ENDPOINTS
  // ------------------------------------------------------------------

  /**
   * Info su un hashtag (post count, top posts).
   * Costo: 1 request
   */
  async hashtagInfo(name: string, opts?: FetchOptions): Promise<HikerHashtag> {
    return this.get<HikerHashtag>(
      '/v1/hashtag/by/name',
      { name: name.replace('#', '').trim() },
      opts
    );
  }
}

// Singleton
let _client: HikerClient | null = null;
export function getHikerClient(): HikerClient {
  if (!_client) _client = new HikerClient();
  return _client;
}

export type { HikerClient };
