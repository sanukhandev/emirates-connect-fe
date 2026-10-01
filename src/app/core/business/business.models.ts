export type BusinessStatus = 'active' | 'inactive' | 'suspended';
export type BusinessRole = 'owner' | 'admin' | 'editor';

export interface Business {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  industry: string;
  emirate: string;
  website_url: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  status: BusinessStatus;
  current_user_role: BusinessRole | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessMember {
  id: number;
  role: BusinessRole;
  created_at: string;
  user: {
    id: number;
    name: string;
    profile: {
      display_name: string | null;
      headline: string | null;
      avatar_url: string | null;
    } | null;
  };
}

export interface BusinessPayload {
  name: string;
  tagline: string | null;
  description: string | null;
  industry: string;
  emirate: string;
  website_url: string | null;
  email: string | null;
  phone: string | null;
}

export interface AddMemberPayload {
  user_id: number;
  role: Exclude<BusinessRole, 'owner'>;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface ApiPage<T> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export type BusinessResponse = { data: Business };
export type MemberResponse = { data: BusinessMember };
