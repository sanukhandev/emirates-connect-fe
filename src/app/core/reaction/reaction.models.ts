export type ReactionType = 'like' | 'celebrate' | 'support' | 'insightful';

export interface ReactionCounts {
  like: number;
  celebrate: number;
  support: number;
  insightful: number;
}

export interface ReactionSummary {
  total: number;
  counts: ReactionCounts;
  current_user: ReactionType | null;
}

export interface ReactionResponse {
  data: { reactions: ReactionSummary };
}

export const REACTION_TYPES: readonly ReactionType[] = ['like', 'celebrate', 'support', 'insightful'];

export const EMPTY_REACTION_SUMMARY: ReactionSummary = {
  total: 0,
  counts: { like: 0, celebrate: 0, support: 0, insightful: 0 },
  current_user: null,
};

export function applyOptimisticReaction(summary: ReactionSummary, next: ReactionType | null): ReactionSummary {
  const previous = summary.current_user;
  const counts = { ...summary.counts };
  if (previous) counts[previous] = Math.max(0, counts[previous] - 1);
  if (next) counts[next] += 1;
  return {
    total: Math.max(0, summary.total - (previous ? 1 : 0) + (next ? 1 : 0)),
    counts,
    current_user: next,
  };
}
