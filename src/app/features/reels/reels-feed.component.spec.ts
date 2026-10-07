import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { Reel } from '../../core/reel/reel.models';
import { ReelService } from '../../core/reel/reel.service';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { ProfileService } from '../../core/profile/profile.service';
import { ReactionService } from '../../core/reaction/reaction.service';
import { NotificationService } from '../../core/notification/notification.service';
import { ReelsFeedComponent } from './reels-feed.component';

const mockReel: Reel = {
  id: 101,
  caption: 'Building next generation logistics in #Dubai #Innovation',
  status: 'published',
  author: {
    type: 'user',
    id: 1,
    display_name: 'Sanu Khan',
    headline: 'Founder & Tech Lead',
    avatar_url: null,
    is_verified: true,
  },
  playback_url: 'https://example.com/video.mp4',
  thumbnail_url: 'https://example.com/thumb.jpg',
  duration_seconds: 45,
  width: 720,
  height: 1280,
  processing_error: null,
  published_at: '2026-10-06T12:00:00Z',
  created_at: '2026-10-06T12:00:00Z',
  updated_at: '2026-10-06T12:00:00Z',
  reactions: {
    total: 12,
    counts: { like: 12, celebrate: 0, support: 0, insightful: 0 },
    current_user: null,
  },
};

describe('ReelsFeedComponent', () => {
  it('loads and renders reels on initialization', () => {
    const fixture = createFixture({
      getFeed: vi.fn().mockReturnValue(
        of({
          data: [mockReel],
          links: { first: null, last: null, prev: null, next: null },
          meta: { per_page: 10, next_cursor: 'cursor-2', prev_cursor: null },
        })
      ),
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.reels().length).toBe(1);
    expect(fixture.componentInstance.reels()[0].id).toBe(101);
    expect(fixture.componentInstance.activeReelId()).toBe(101);
    expect(fixture.componentInstance.hasMore()).toBe(true);
  });

  it('updates active reel when onReelVisible is emitted', () => {
    const fixture = createFixture({
      getFeed: vi.fn().mockReturnValue(
        of({
          data: [mockReel, { ...mockReel, id: 102 }],
          links: { first: null, last: null, prev: null, next: null },
          meta: { per_page: 10, next_cursor: null, prev_cursor: null },
        })
      ),
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.activeReelId()).toBe(101);
    fixture.componentInstance.onReelVisible(102);
    expect(fixture.componentInstance.activeReelId()).toBe(102);
  });

  it('displays empty state when feed has no reels', () => {
    const fixture = createFixture({
      getFeed: vi.fn().mockReturnValue(
        of({
          data: [],
          links: { first: null, last: null, prev: null, next: null },
          meta: { per_page: 10, next_cursor: null, prev_cursor: null },
        })
      ),
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.reels().length).toBe(0);
    expect(fixture.componentInstance.error()).toBeNull();
  });

  it('handles feed error and supports retry', () => {
    const reelServiceMock = {
      getFeed: vi
        .fn()
        .mockReturnValueOnce(throwError(() => new Error('Network error')))
        .mockReturnValueOnce(
          of({
            data: [mockReel],
            links: { first: null, last: null, prev: null, next: null },
            meta: { per_page: 10, next_cursor: null, prev_cursor: null },
          })
        ),
      errorMessage: vi.fn().mockReturnValue('Failed to load reels'),
    };

    const fixture = createFixture(reelServiceMock);
    fixture.detectChanges();

    expect(fixture.componentInstance.error()).toBe('Failed to load reels');
    expect(fixture.componentInstance.reels().length).toBe(0);

    fixture.componentInstance.refresh();
    expect(fixture.componentInstance.error()).toBeNull();
    expect(fixture.componentInstance.reels().length).toBe(1);
  });
});

function createFixture(customReelService: Partial<ReelService> = {}) {
  const reelServiceMock = {
    getFeed: vi.fn().mockReturnValue(
      of({
        data: [mockReel],
        links: { first: null, last: null, prev: null, next: null },
        meta: { per_page: 10, next_cursor: null, prev_cursor: null },
      })
    ),
    errorMessage: vi.fn().mockReturnValue('Error'),
    ...customReelService,
  };

  const authServiceMock = {
    isAuthenticated: signal(true),
    logout: vi.fn().mockReturnValue(of(null)),
  };

  const authStateMock = {
    currentUser: signal({ id: 1, name: 'Sanu Khan', email: 'sanu@example.com' }),
    isAuthenticated: signal(true),
  };

  const notificationServiceMock = {
    unreadCount: signal(0),
    refreshUnreadCount: vi.fn(),
  };

  const profileServiceMock = {
    profile: signal(null),
  };

  const reactionServiceMock = {
    setReelReaction: vi.fn().mockReturnValue(of({ total: 13, counts: { like: 13, celebrate: 0, support: 0, insightful: 0 }, current_user: 'like' })),
    removeReelReaction: vi.fn().mockReturnValue(of(undefined)),
    errorMessage: vi.fn().mockReturnValue('Error updating reaction'),
  };

  TestBed.configureTestingModule({
    imports: [ReelsFeedComponent],
    providers: [
      { provide: ReelService, useValue: reelServiceMock },
      { provide: AuthService, useValue: authServiceMock },
      { provide: AuthStateService, useValue: authStateMock },
      { provide: NotificationService, useValue: notificationServiceMock },
      { provide: ProfileService, useValue: profileServiceMock },
      { provide: ReactionService, useValue: reactionServiceMock },
      provideRouter([]),
    ],
  });

  return TestBed.createComponent(ReelsFeedComponent);
}
