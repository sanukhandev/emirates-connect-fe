export type ReelStatus = 'uploading' | 'processing' | 'published' | 'failed';
export type ReelAuthorType = 'user' | 'business';

export interface UserReelAuthor {
  type: 'user';
  id: number;
  display_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

export interface BusinessReelAuthor {
  type: 'business';
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  is_verified: boolean;
}

export type ReelAuthor = UserReelAuthor | BusinessReelAuthor;

export interface Reel {
  id: number;
  caption: string | null;
  status: ReelStatus;
  author: ReelAuthor;
  playback_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  processing_error: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  reactions?: import('../reaction/reaction.models').ReactionSummary;
}

export interface ReelCursorMeta {
  path?: string;
  per_page: number;
  next_cursor: string | null;
  prev_cursor: string | null;
}

export interface ReelFeedResponse {
  data: Reel[];
  links: { first: string | null; last: string | null; prev: string | null; next: string | null };
  meta: ReelCursorMeta;
}

export interface ReelCreatePayload {
  author_type: ReelAuthorType;
  business_id?: number;
  caption?: string | null;
}

export interface ReelResponse { data: Reel; }
