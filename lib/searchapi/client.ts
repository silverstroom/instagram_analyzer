/**
 * Client per SearchAPI.io — fornisce accesso alla Meta Ad Library
 * in modo più affidabile e legalmente coperto rispetto allo scraping diretto.
 *
 * Docs: https://www.searchapi.io/docs/meta-ad-library-api
 *
 * Pricing: pay-per-request, ~$0.01 per query sul piano base.
 */

export const SEARCHAPI_COST_USD = 0.01;

export interface AdLibraryAd {
  ad_archive_id: string;
  page_id: string;
  page_name: string;
  display_format: string; // VIDEO, IMAGE, CAROUSEL
  snapshot?: {
    body?: { text?: string };
    title?: string;
    caption?: string;
    cta_text?: string;
    link_url?: string;
  };
  videos?: Array<{ video_hd_url?: string; video_preview_image_url?: string }>;
  images?: Array<{ resized_image_url?: string; original_image_url?: string }>;
  publisher_platform?: string[]; // ['facebook', 'instagram', ...]
  start_date?: number; // unix
  end_date?: number | null;
  total_active_time?: number; // seconds
  is_active?: boolean;
}

export interface AdLibraryPageInfo {
  page_id: string;
  page_name: string;
  page_profile_picture_url?: string;
  page_categories?: string[];
  page_like_count?: number;
  ig_username?: string;
  page_verification?: string;
  total_ads_running?: number;
}

export interface AdLibrarySearchResult {
  ads: AdLibraryAd[];
  total_count: number;
  page_info?: AdLibraryPageInfo;
}

class SearchAPIClient {
  private apiKey: string;
  private baseUrl = 'https://www.searchapi.io/api/v1/search';
  private requestCount = 0;

  constructor() {
    this.apiKey = process.env.SEARCHAPI_KEY || '';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private async call<T>(params: Record<string, string>): Promise<T> {
    if (!this.apiKey) {
      throw new Error(
        'SEARCHAPI_KEY non configurata — iscriviti su searchapi.io per ottenere una chiave'
      );
    }

    const url = new URL(this.baseUrl);
    url.searchParams.set('api_key', this.apiKey);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 }, // ADS cambiano lentamente, cache 1h
    });

    this.requestCount++;

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `SearchAPI error ${res.status}: ${body.slice(0, 200)}`
      );
    }

    return res.json() as Promise<T>;
  }

  drainRequestCount(): number {
    const c = this.requestCount;
    this.requestCount = 0;
    return c;
  }

  /**
   * Cerca una pagina Facebook per nome/keyword, restituisce candidati con page_id.
   * Usato come step 1 prima della ricerca ADS.
   */
  async pageSearch(
    query: string,
    country: string = 'IT'
  ): Promise<Array<{ page_id: string; name: string; category?: string; image_uri?: string }>> {
    const data = await this.call<any>({
      engine: 'meta_ad_library_page_search',
      q: query,
      country,
    });

    return (data.page_results || []).map((p: any) => ({
      page_id: p.page_id,
      name: p.name || p.page_name,
      category: p.category,
      image_uri: p.image_uri,
    }));
  }

  /**
   * Restituisce info pubbliche di una pagina Facebook dal suo ID.
   */
  async pageInfo(pageId: string): Promise<AdLibraryPageInfo> {
    const data = await this.call<any>({
      engine: 'meta_ad_library_page_info',
      page_id: pageId,
    });

    const info = data.ad_library_page_info || {};
    const page = data.page || {};

    return {
      page_id: pageId,
      page_name: page.name || info.page_name || '',
      page_profile_picture_url: info.profile_photo,
      page_categories: info.page_categories || [],
      page_like_count: info.likes,
      ig_username: info.instagram_username,
      page_verification: info.page_verification,
      total_ads_running: info.active_ads_count,
    };
  }

  /**
   * Restituisce le ADS attive di una pagina nel paese specificato.
   */
  async getAdsByPageId(
    pageId: string,
    country: string = 'IT',
    activeStatus: 'active' | 'inactive' | 'all' = 'active'
  ): Promise<AdLibrarySearchResult> {
    const data = await this.call<any>({
      engine: 'meta_ad_library',
      page_id: pageId,
      country,
      active_status: activeStatus,
      ad_type: 'all',
    });

    const ads: AdLibraryAd[] = (data.ads || []).map((a: any) => ({
      ad_archive_id: a.ad_archive_id || a.id,
      page_id: a.page_id || pageId,
      page_name: a.page_name || a.current_page_name || '',
      display_format: a.display_format || 'IMAGE',
      snapshot: {
        body: a.body ? { text: typeof a.body === 'string' ? a.body : a.body.text } : undefined,
        title: a.title,
        caption: a.caption,
        cta_text: a.cta_text,
        link_url: a.link_url,
      },
      videos: a.videos,
      images: a.images,
      publisher_platform: a.publisher_platform,
      start_date: a.start_date,
      end_date: a.end_date,
      is_active: a.is_active ?? true,
    }));

    return {
      ads,
      total_count: data.search_information?.ads_count || ads.length,
      page_info: data.search_information?.ad_library_page_info
        ? {
            page_id: pageId,
            page_name: data.search_information.ad_library_page_info.page_name,
            page_profile_picture_url: data.search_information.ad_library_page_info.profile_photo,
            page_categories: data.search_information.ad_library_page_info.page_categories,
            page_like_count: data.search_information.ad_library_page_info.likes,
            ig_username: data.search_information.ad_library_page_info.instagram_username,
            page_verification: data.search_information.ad_library_page_info.page_verification,
          }
        : undefined,
    };
  }
}

let _client: SearchAPIClient | null = null;
export function getSearchAPIClient(): SearchAPIClient {
  if (!_client) _client = new SearchAPIClient();
  return _client;
}
