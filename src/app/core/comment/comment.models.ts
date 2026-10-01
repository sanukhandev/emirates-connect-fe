import { PostAuthor } from '../post/post.models';
import { ReactionSummary } from '../reaction/reaction.models';

export interface CommentReply {
  id: number;
  body: string;
  author: PostAuthor;
  created_at: string;
  updated_at: string;
  reactions?: ReactionSummary;
}

export interface Comment {
  id: number;
  body: string;
  author: PostAuthor;
  created_at: string;
  updated_at: string;
  replies_count: number;
  replies: CommentReply[];
  reactions?: ReactionSummary;
}

export interface CommentPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CommentPaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginatedCommentResponse {
  data: Comment[];
  links: CommentPaginationLinks;
  meta: CommentPaginationMeta;
}

export type CommentAuthorType = 'user' | 'business';

export interface CreateCommentPayload {
  author_type: CommentAuthorType;
  business_id?: number;
  body: string;
}

export type CreateReplyPayload = CreateCommentPayload;

export interface UpdateCommentPayload {
  body: string;
}

export interface CommentResponse {
  data: Comment;
}
