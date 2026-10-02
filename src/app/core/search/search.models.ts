export type SearchType = 'all' | 'users' | 'businesses';

export interface SearchFilters {
  q?: string;
  type: SearchType;
  industry?: string;
  emirate?: string;
  verified?: boolean;
  page: number;
}

export interface SearchUserResult {
  type: 'user';
  id: number;
  display_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  industry: string | null;
  emirate: string | null;
  is_verified: boolean;
}

export interface SearchBusinessResult {
  type: 'business';
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  industry: string | null;
  emirate: string | null;
  is_verified: boolean;
}

export type SearchResult = SearchUserResult | SearchBusinessResult;

export interface SearchPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface SearchResponse {
  data: SearchResult[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: SearchPagination;
}
