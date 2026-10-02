import { Notification } from './notification.models';

export function notificationActorName(notification: Notification): string {
  if (!notification.actor) return 'Someone';
  return notification.actor.type === 'user'
    ? notification.actor.display_name || 'Someone'
    : notification.actor.name;
}

export function notificationMessage(notification: Notification): string {
  const actor = notificationActorName(notification);
  switch (notification.type) {
    case 'followed': return `${actor} followed you`;
    case 'post_commented': return `${actor} commented on your post`;
    case 'comment_replied': return `${actor} replied to your comment`;
    case 'post_reacted': return `${actor} reacted to your post`;
    case 'comment_reacted': return `${actor} reacted to your comment`;
    case 'verification_approved': return 'Your verification was approved';
    case 'verification_rejected': return 'Your verification was not approved';
    default: return 'You have a new notification.';
  }
}

export function notificationRoute(notification: Notification): unknown[] | null {
  if (notification.type === 'followed' && notification.actor) {
    return notification.actor.type === 'user' ? ['/users', notification.actor.id] : ['/businesses', notification.actor.slug];
  }
  if (notification.subject?.type === 'post') return ['/posts', notification.subject.id];
  if (notification.type === 'verification_approved' || notification.type === 'verification_rejected') {
    return notification.subject?.type === 'user' ? ['/verification'] : null;
  }
  return null;
}
