import { applyFollowState } from './follow-state';

describe('applyFollowState', () => {
  it('increments and decrements counts without going below zero', () => {
    expect(applyFollowState({ isFollowing: false, followersCount: 2 }, true)).toEqual({ isFollowing: true, followersCount: 3 });
    expect(applyFollowState({ isFollowing: true, followersCount: 2 }, false)).toEqual({ isFollowing: false, followersCount: 1 });
    expect(applyFollowState({ isFollowing: true, followersCount: 0 }, false)).toEqual({ isFollowing: false, followersCount: 0 });
  });

  it('does not change an already matching state', () => {
    const state = { isFollowing: true, followersCount: 4 };
    expect(applyFollowState(state, true)).toBe(state);
  });
});
