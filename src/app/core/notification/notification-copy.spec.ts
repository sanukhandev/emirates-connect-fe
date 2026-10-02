import { notificationMessage, notificationRoute } from './notification-copy';
import { Notification } from './notification.models';

const base = (type: string, actor: Notification['actor'], subject: Notification['subject'] = null): Notification => ({ id: 1, type, actor, subject, data: {}, read_at: null, created_at: '2026-01-01T00:00:00Z' });

describe('notification copy and navigation', () => {
  it('maps supported types to safe copy', () => {
    const actor = { type: 'user' as const, id: 3, display_name: 'Ava', avatar_url: null, headline: null, is_verified: false };
    expect(notificationMessage(base('followed', actor))).toBe('Ava followed you');
    expect(notificationMessage(base('post_commented', actor))).toBe('Ava commented on your post');
    expect(notificationMessage(base('comment_replied', actor))).toBe('Ava replied to your comment');
    expect(notificationMessage(base('post_reacted', actor))).toBe('Ava reacted to your post');
    expect(notificationMessage(base('comment_reacted', actor))).toBe('Ava reacted to your comment');
    expect(notificationMessage(base('verification_approved', null))).toBe('Your verification was approved');
    expect(notificationMessage(base('verification_rejected', null))).toBe('Your verification was not approved');
    expect(notificationMessage(base('future_type', null))).toBe('You have a new notification.');
  });

  it('maps trusted subjects to existing routes and safely omits unavailable destinations', () => {
    const actor = { type: 'user' as const, id: 3, display_name: 'Ava', avatar_url: null, headline: null, is_verified: false };
    expect(notificationRoute(base('followed', actor))).toEqual(['/users', 3]);
    expect(notificationRoute(base('post_commented', actor, { type: 'post', id: 8 }))).toEqual(['/posts', 8]);
    expect(notificationRoute(base('verification_approved', null, { type: 'business', id: 4 }))).toBeNull();
    expect(notificationRoute(base('future_type', null))).toBeNull();
  });
});
