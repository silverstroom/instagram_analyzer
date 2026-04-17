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
   * Gestisce il wrapper { response: ... } che HikerAPI usa su alcuni endpoint.
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
    // HikerAPI a volte wrappa la risposta in { response: ... }, a volte no.
    // Normalizziamo: se c'è il wrapper, lo togliamo.
    if (json && typeof json === 'object' && 'response' in json && json.response) {
      return json.response as T;
    }
    return json as T;
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

  async userByUsername(username: string, opts?: FetchOptions): Promise<HikerUser> {
    const data = await this.get<any>(
      '/v1/user/by/username',
      { username: username.replace('@', '').trim() },
      opts
    );
    // Supporta sia { user: {...} } sia risposta diretta
    return (data?.user ?? data) as HikerUser;
  }

  async userById(userId: string, opts?: FetchOptions): Promise<HikerUser> {
    const data = await this.get<any>(
      '/v1/user/by/id',
      { id: userId },
      opts
    );
    return (data?.user ?? data) as HikerUser;
  }

  /**
   * Recupera i media (post) di un utente, paginati.
   * L'endpoint v2 ritorna { items, num_results, more_available, next_max_id }
   * (wrapped in "response" che viene già rimosso nel metodo get).
   */
  async userMedias(
    userId: string,
    pageId?: string,
    opts?: FetchOptions
  ): Promise<HikerMediasPage> {
    const params: Record<string, string> = { user_id: userId };
    if (pageId) params.end_cursor = pageId;

    const data = await this.get<any>('/v2/user/medias', params, opts);

    // L'endpoint ritorna: { items: [...], num_results, more_available, next_max_id }
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
    const data = await this.get<any>(
      '/v1/user/stories',
      { user_id: userId },
      opts
    );
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
}

let _client: HikerClient | null = null;
export function getHikerClient(): HikerClient {
  if (!_client) _client = new HikerClient();
  return _client;
}

export type { HikerClient };
