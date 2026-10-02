import { UserProfile } from '../auth/auth.models';

export interface MetaOption {
  value: string;
  label: string;
}

export interface ProfileUpdatePayload {
  display_name?: string | null;
  headline?: string | null;
  bio?: string | null;
  job_title?: string | null;
  company_name?: string | null;
  industry?: string | null;
  emirate?: string | null;
  website_url?: string | null;
  linkedin_url?: string | null;
}

export interface PublicUser {
  id: number;
  name: string;
  profile: UserProfile;
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

export type ProfileResponse = { data: UserProfile };
export type PublicUserResponse = { data: PublicUser };
