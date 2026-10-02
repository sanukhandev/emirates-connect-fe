import { FollowState } from './follow.models';

export function applyFollowState(previous: FollowState, following: boolean): FollowState {
  if (previous.isFollowing === following) return previous;
  return {
    isFollowing: following,
    followersCount: Math.max(0, previous.followersCount + (following ? 1 : -1)),
  };
}
