import { applyOptimisticReaction, EMPTY_REACTION_SUMMARY } from './reaction.models';

describe('applyOptimisticReaction', () => {
  it('adds a reaction', () => {
    const result = applyOptimisticReaction(EMPTY_REACTION_SUMMARY, 'like');
    expect(result).toEqual({ total: 1, counts: { like: 1, celebrate: 0, support: 0, insightful: 0 }, current_user: 'like' });
  });

  it('switches without changing total', () => {
    const result = applyOptimisticReaction({ total: 1, counts: { like: 1, celebrate: 0, support: 0, insightful: 0 }, current_user: 'like' }, 'celebrate');
    expect(result).toEqual({ total: 1, counts: { like: 0, celebrate: 1, support: 0, insightful: 0 }, current_user: 'celebrate' });
  });

  it('removes without going below zero', () => {
    const result = applyOptimisticReaction({ total: 0, counts: { like: 0, celebrate: 0, support: 0, insightful: 0 }, current_user: 'like' }, null);
    expect(result.total).toBe(0);
    expect(result.counts.like).toBe(0);
  });
});
