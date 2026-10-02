export type UserStatus = 'pending' | 'active' | 'suspended' | 'disabled';

export interface UserProfile {
  display_name: string | null;
  headline: string | null;
  bio: string | null;
  job_title: string | null;
  company_name: string | null;
  industry: string | null;
  emirate: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  onboarding_completed: boolean;
  is_verified: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  account_status: UserStatus;
  created_at: string;
  updated_at: string;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
  is_verified?: boolean;
  profile?: UserProfile | null;
}

export interface ApiResponse<T> {
  data: T;
}

export interface AuthPayload {
  user: User;
}

export interface AccountUpdatePayload {
  name?: string;
  email?: string;
}

export interface ResetPasswordPayload {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ValidationErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}
