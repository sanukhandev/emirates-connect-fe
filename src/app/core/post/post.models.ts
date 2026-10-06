import { Business } from '../business/business.models';
import { ReactionSummary } from '../reaction/reaction.models';

export type PostStatus = 'draft' | 'published';
export type PostAuthorType = 'user' | 'business';

export interface UserPostAuthor {
  type: 'user';
  id: number;
  name: string;
  display_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  is_verified?: boolean;
  location?: string | null;
}

export interface BusinessPostAuthor {
  type: 'business';
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  is_verified?: boolean;
  industry?: string | null;
  location?: string | null;
}

export type PostAuthor = UserPostAuthor | BusinessPostAuthor;

export interface PostMedia {
  id: number;
  type: 'image';
  url: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  sort_order: number;
}

export interface PostPollOption {
  id: number;
  text: string;
  votes: number;
}

export interface PostPoll {
  question: string;
  options: PostPollOption[];
  total_votes: number;
  user_voted_option_id?: number | null;
  expires_at?: string;
  days_remaining?: number;
}

export interface Post {
  id: number;
  body: string | null;
  status: PostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author: PostAuthor;
  media: PostMedia[];
  reactions?: ReactionSummary;
  poll?: PostPoll;
  tags?: string[];
  shares_count?: number;
  comments_count?: number;
  is_saved?: boolean;
}

export interface CreatePostPayload {
  author_type: PostAuthorType;
  business_id?: number;
  body: string | null;
  status: PostStatus;
}

export interface UpdatePostPayload {
  body: string | null;
  status: PostStatus;
}

export interface PaginatedPostResponse {
  data: Post[];
  links: { first: string | null; last: string | null; prev: string | null; next: string | null };
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

export interface PostResponse { data: Post; }
export type ManagedBusiness = Business;
