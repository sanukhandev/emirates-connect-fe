import { Post } from '../post/post.models';

export interface FeedPage {
  data: Post[];
  meta: {
    per_page: number;
    next_cursor: string | null;
    prev_cursor: string | null;
  };
}
