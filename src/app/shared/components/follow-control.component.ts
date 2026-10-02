import { Component, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthStateService } from '../../core/auth/auth-state.service';
import { Business } from '../../core/business/business.models';
import { FollowService } from '../../core/follow/follow.service';
import { FollowState } from '../../core/follow/follow.models';
import { applyFollowState } from '../../core/follow/follow-state';
import { PublicUser } from '../../core/profile/profile.models';

@Component({
  selector: 'app-follow-control',
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="rounded-xl bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:cursor-wait disabled:opacity-60"
        [disabled]="pending()"
        [attr.aria-label]="(isFollowing() ? 'Unfollow ' : 'Follow ') + targetLabel()"
        (click)="toggle()"
      >
        {{ pending() ? 'Updating…' : isFollowing() ? 'Following' : 'Follow' }}
      </button>
      @if (error()) { <p role="alert" class="text-sm text-status-danger">{{ error() }}</p> }
    </div>
  `,
})
export class FollowControlComponent {
  readonly targetType = input.required<'user' | 'business'>();
  readonly targetId = input.required<number>();
  readonly targetSlug = input<string | null>(null);
  readonly targetLabel = input.required<string>();
  readonly isFollowing = input(false);
  readonly followersCount = input(0);
  readonly stateChange = output<FollowState>();
  readonly pending = signal(false);
  readonly error = signal('');

  private readonly auth = inject(AuthStateService);
  private readonly follow = inject(FollowService);
  private readonly router = inject(Router);

  toggle(): void {
    if (this.pending()) return;
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const previous: FollowState = { isFollowing: this.isFollowing(), followersCount: this.followersCount() };
    const next = applyFollowState(previous, !previous.isFollowing);
    this.error.set('');
    this.pending.set(true);
    this.stateChange.emit(next);

    const request: Observable<PublicUser | Business | void> = this.targetType() === 'user'
      ? (next.isFollowing ? this.follow.followUser(this.targetId()) : this.follow.unfollowUser(this.targetId()))
      : (next.isFollowing
        ? this.follow.followBusiness(this.targetSlug() ?? '')
        : this.follow.unfollowBusiness(this.targetSlug() ?? ''));

    request.subscribe({
      next: (resource) => {
        if (resource && typeof resource === 'object' && 'is_following' in resource) {
          const value = resource as { is_following?: boolean; followers_count?: number };
          this.stateChange.emit({
            isFollowing: value.is_following ?? next.isFollowing,
            followersCount: value.followers_count ?? next.followersCount,
          });
        }
      },
      error: () => {
        this.stateChange.emit(previous);
        this.error.set('Couldn’t update follow status. Try again.');
        this.pending.set(false);
      },
      complete: () => this.pending.set(false),
    });
  }
}
