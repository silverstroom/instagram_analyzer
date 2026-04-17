// Tipi che riflettono le risposte dell'API HikerAPI
// Riferimento: https://hiker-doc.readthedocs.io

export interface HikerUser {
  pk: string;
  username: string;
  full_name: string;
  biography: string;
  is_private: boolean;
  is_verified: boolean;
  is_business: boolean;
  category: string | null;
  profile_pic_url: string;
  profile_pic_url_hd?: string;
  follower_count: number;
  following_count: number;
  media_count: number;
  external_url: string | null;
  public_email?: string | null;
  public_phone_number?: string | null;
}

export interface HikerMedia {
  pk: string;
  id: string;
  code: string; // shortcode per URL post
  taken_at: number; // unix timestamp
  media_type: number; // 1=foto, 2=video, 8=carousel
  product_type?: 'clips' | 'feed' | 'igtv' | string;
  caption_text: string;
  like_count: number;
  comment_count: number;
  play_count?: number | null;
  view_count?: number | null;
  thumbnail_url?: string;
  video_url?: string | null;
  user: Pick<HikerUser, 'pk' | 'username' | 'full_name' | 'profile_pic_url'>;
  usertags?: { user: { username: string } }[];
  location?: {
    name: string;
    lat?: number;
    lng?: number;
  } | null;
}

export interface HikerHashtag {
  id: string;
  name: string;
  media_count: number;
  profile_pic_url?: string;
}

export interface HikerStory {
  pk: string;
  id: string;
  taken_at: number;
  media_type: number;
  thumbnail_url?: string;
  video_url?: string | null;
  expiring_at: number;
}

export interface HikerRelatedProfile {
  pk: string;
  username: string;
  full_name: string;
  profile_pic_url: string;
  is_verified: boolean;
}

// Risposte paginate
export interface HikerMediasPage {
  items: HikerMedia[];
  next_page_id?: string | null;
}

// Errore standard
export interface HikerError {
  detail: string;
  status: number;
}
