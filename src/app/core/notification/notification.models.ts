export type NotificationType =
  | 'followed'
  | 'post_commented'
  | 'comment_replied'
  | 'post_reacted'
  | 'comment_reacted'
  | 'verification_approved'
  | 'verification_rejected';

export interface UserNotificationActor {
  type: 'user';
  id: number;
  display_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  is_verified: boolean;
}

export interface BusinessNotificationActor {
  type: 'business';
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  is_verified: boolean;
}

export type NotificationActor = UserNotificationActor | BusinessNotificationActor | null;

export interface NotificationSubject {
  type: string;
  id: number;
}

export interface Notification {
  id: number;
  type: NotificationType | string;
  actor: NotificationActor;
  subject: NotificationSubject | null;
  data: Record<string, number | string | null>;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  data: Notification[];
  links: { first: string | null; last: string | null; prev: string | null; next: string | null };
  meta: { per_page: number; next_cursor: string | null; prev_cursor: string | null; path: string };
}

export interface UnreadCountResponse {
  count: number;
}
