import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { Reel } from '../../core/reel/reel.models';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { ReactionService } from '../../core/reaction/reaction.service';
import { ReelCardComponent } from './reel-card.component';

const mockReel: Reel = {
  id: 201,
  caption: 'Innovating financial technology in the #UAE ecosystem #DubaiFintech',
  status: 'published',
  author: {
    type: 'user',
    id: 42,
    display_name: 'Fatima Al Mansoori',
    headline: 'Managing Director',
    avatar_url: null,
    is_verified: true,
  },
  playback_url: 'https://example.com/reel-201.mp4',
  thumbnail_url: 'https://example.com/thumb-201.jpg',
  duration_seconds: 30,
  width: 1080,
  height: 1920,
  processing_error: null,
  published_at: '2026-10-06T10:00:00Z',
  created_at: '2026-10-06T10:00:00Z',
  updated_at: '2026-10-06T10:00:00Z',
  reactions: {
    total: 8,
    counts: { like: 8, celebrate: 0, support: 0, insightful: 0 },
    current_user: null,
  },
};

describe('ReelCardComponent', () => {
  it('correctly parses hashtags from reel caption', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('reel', mockReel);
    fixture.detectChanges();

    const tokens = fixture.componentInstance.captionTokens();
    const hashtags = tokens.filter((t) => t.isHashtag).map((t) => t.text);
    expect(hashtags).toContain('#UAE');
    expect(hashtags).toContain('#DubaiFintech');
  });

  it('toggles audio mute state', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('reel', mockReel);
    fixture.detectChanges();

    expect(fixture.componentInstance.isMuted()).toBe(true);
    const mockEvent = new Event('click');
    fixture.componentInstance.toggleMute(mockEvent);
    expect(fixture.componentInstance.isMuted()).toBe(false);
  });

  it('triggers like reaction when toggling like on unliked reel', () => {
    const setReactionMock = vi.fn().mockReturnValue(
      of({
        total: 9,
        counts: { like: 9, celebrate: 0, support: 0, insightful: 0 },
        current_user: 'like',
      })
    );
    const fixture = createFixture({ setReelReaction: setReactionMock });
    fixture.componentRef.setInput('reel', mockReel);
    fixture.detectChanges();

    expect(fixture.componentInstance.hasLiked()).toBe(false);
    expect(fixture.componentInstance.likeCount()).toBe(8);

    fixture.componentInstance.toggleLike();
    expect(setReactionMock).toHaveBeenCalledWith(201, 'like');
  });

  it('handles video error and supports retry', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('reel', mockReel);
    fixture.detectChanges();

    expect(fixture.componentInstance.videoError()).toBe(false);
    fixture.componentInstance.onVideoError();
    expect(fixture.componentInstance.videoError()).toBe(true);

    fixture.componentInstance.retryVideo();
    expect(fixture.componentInstance.videoError()).toBe(false);
  });

  it('toggles save state and displays toast feedback', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('reel', mockReel);
    fixture.detectChanges();

    expect(fixture.componentInstance.isSaved()).toBe(false);
    fixture.componentInstance.toggleSave();
    expect(fixture.componentInstance.isSaved()).toBe(true);
    expect(fixture.componentInstance.toastMessage()).toBe('Reel saved to collection');
  });
});

function createFixture(customReactionService: Partial<ReactionService> = {}) {
  const reactionServiceMock = {
    setReelReaction: vi.fn().mockReturnValue(
      of({
        total: 9,
        counts: { like: 9, celebrate: 0, support: 0, insightful: 0 },
        current_user: 'like',
      })
    ),
    removeReelReaction: vi.fn().mockReturnValue(of(undefined)),
    errorMessage: vi.fn().mockReturnValue('Reaction failed'),
    ...customReactionService,
  };

  const authStateMock = {
    currentUser: signal({ id: 1, display_name: 'Test User', email: 'test@example.com' }),
  };

  TestBed.configureTestingModule({
    imports: [ReelCardComponent],
    providers: [
      { provide: ReactionService, useValue: reactionServiceMock },
      { provide: AuthStateService, useValue: authStateMock },
      provideRouter([]),
    ],
  });

  return TestBed.createComponent(ReelCardComponent);
}
