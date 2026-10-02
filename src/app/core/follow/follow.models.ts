import { ApiPage } from '../business/business.models';
import { UserProfile } from '../auth/auth.models';

export interface FollowerUser {
  id: number;
  name: string;
  profile: UserProfile;
}

export interface FollowedUser {
  type: 'user';
  id: number;
  name: string;
  display_name: string | null;
  headline: string | null;
  avatar_url: string | null;
}

export interface FollowedBusiness {
  type: 'business';
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
}

export type FollowTarget = FollowedUser | FollowedBusiness;
export type PaginatedFollowers = ApiPage<FollowerUser>;
export type PaginatedFollowing = ApiPage<FollowTarget>;

export interface FollowState {
  isFollowing: boolean;
  followersCount: number;
}
