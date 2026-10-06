import { TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthStateService } from '../../core/auth/auth-state.service';
import { FollowState } from '../../core/follow/follow.models';
import { ProfileService } from '../../core/profile/profile.service';
import { PublicUser } from '../../core/profile/profile.models';
import { PostService } from '../../core/post/post.service';
import { FollowControlComponent } from '../../shared/components/follow-control.component';
import { PostCardComponent } from '../../shared/components/post-card.component';
import { ReportDialogComponent } from '../../shared/components/report-dialog.component';
import { ReportTargetType } from '../../core/report/report.models';

@Component({
  selector: 'app-public-profile',
  imports: [RouterLink, TitleCasePipe, FollowControlComponent, PostCardComponent, ReportDialogComponent],
  template: `
    <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8">
      <div class="mx-auto max-w-5xl">
        <a routerLink="/" class="text-sm font-medium text-brand-strong">← Home</a>
        @if (loading()) {
          <div class="mt-8 h-80 animate-pulse rounded-3xl bg-surface-muted"></div>
        } @else if (error()) {
          <section class="mt-8 rounded-3xl bg-surface-card p-8 text-center shadow-card"><h1 class="text-2xl font-bold">Profile not found</h1><p class="mt-2 text-content-secondary">This professional profile is unavailable.</p></section>
        } @else if (user(); as value) {
          <section class="mt-6 overflow-hidden rounded-3xl bg-surface-card shadow-card">
            <div class="h-56 bg-brand-soft">@if (value.profile.cover_image_url) { <img [src]="value.profile.cover_image_url" alt="" class="h-full w-full object-cover" /> }</div>
            <div class="px-6 pb-8 pt-6 sm:px-10">
              <div class="-mt-20 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-surface-card bg-brand-primary text-2xl font-bold text-white">@if (value.profile.avatar_url) { <img [src]="value.profile.avatar_url" [alt]="(value.profile.display_name || value.name) + ' profile photo'" class="h-full w-full object-cover" /> } @else { {{ initials(value.profile.display_name || value.name) }} }</div>
              <div class="mt-5 flex flex-wrap items-start justify-between gap-4">
                <div><h1 class="flex flex-wrap items-center gap-2 text-3xl font-bold">{{ value.profile.display_name || value.name }} @if (value.is_verified) { <span class="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-strong" aria-label="Verified profile"><svg class="h-3 w-3 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg> Verified</span> }</h1><p class="mt-2 text-lg text-content-secondary">{{ value.profile.headline }}</p><p class="mt-2 text-sm text-content-secondary">{{ value.profile.job_title }} @if (value.profile.company_name) { · {{ value.profile.company_name }} } @if (value.profile.emirate || value.profile.industry) { · {{ value.profile.emirate | titlecase }} @if (value.profile.industry) { · {{ value.profile.industry | titlecase }} } }</p></div>
                @if (auth.currentUser()?.id !== value.id) { <div class="flex flex-wrap gap-2"><app-follow-control targetType="user" [targetId]="value.id" [targetLabel]="value.profile.display_name || value.name" [isFollowing]="value.is_following" [followersCount]="value.followers_count" (stateChange)="updateFollow($event)" /><button type="button" class="rounded-xl border border-border-subtle px-4 py-2 text-sm font-medium hover:border-brand-primary" (click)="openReport('user', value.id, value.profile.display_name || value.name)">Report</button></div> }
              </div>
              <div class="mt-5 flex flex-wrap gap-4 text-sm"><a [routerLink]="['/users', value.id, 'followers']" class="rounded-xl border border-border-subtle px-3 py-2 hover:border-brand-primary">{{ value.followers_count }} followers</a><a [routerLink]="['/users', value.id, 'following']" class="rounded-xl border border-border-subtle px-3 py-2 hover:border-brand-primary">{{ value.following_count }} following</a></div>
              <div class="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]"><article class="rounded-2xl border border-border-subtle p-5"><h2 class="text-lg font-semibold">About</h2><p class="mt-3 whitespace-pre-line leading-7 text-content-secondary">{{ value.profile.bio || 'No professional introduction added yet.' }}</p></article><article class="rounded-2xl border border-border-subtle p-5"><h2 class="text-lg font-semibold">Professional details</h2><div class="mt-4 space-y-3 text-sm">@if (value.profile.website_url) { <a [href]="value.profile.website_url" target="_blank" rel="noopener noreferrer" class="block break-all text-brand-strong hover:underline">{{ value.profile.website_url }}</a> } @if (value.profile.linkedin_url) { <a [href]="value.profile.linkedin_url" target="_blank" rel="noopener noreferrer" class="block break-all text-brand-strong hover:underline">{{ value.profile.linkedin_url }}</a> } @if (!value.profile.website_url && !value.profile.linkedin_url) { <p class="text-content-secondary">No links added.</p> }</div></article></div>
            </div>
          </section>
          @if (posts.userPosts().length) { <section class="mt-6 space-y-4"><h2 class="text-xl font-bold">Posts</h2>@for (item of posts.userPosts(); track item.id) { <app-post-card [post]="item" /> }</section> }
        }
      </div>
      @if (message()) { <p class="mt-4 rounded-xl bg-status-success/10 p-3 text-sm text-status-success" role="status">{{ message() }}</p> }
    </main>
    @if (reportTarget(); as target) { <app-report-dialog [targetType]="target.type" [targetId]="target.id" [targetLabel]="target.label" (closed)="closeReport($event)" /> }
  `,
})
export class PublicProfileComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly profileService = inject(ProfileService);
  readonly auth = inject(AuthStateService);
  readonly user = signal<PublicUser | null>(null);
  readonly posts = inject(PostService);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly reportTarget = signal<{ type: ReportTargetType; id: number; label: string } | null>(null);
  readonly message = signal('');

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id < 1) {
      this.loading.set(false);
      this.error.set(true);
      return;
    }
    this.profileService.getPublicProfile(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
        this.posts.getUserPosts(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  updateFollow(state: FollowState): void {
    this.user.update((user) => user ? { ...user, is_following: state.isFollowing, followers_count: state.followersCount } : user);
  }

  initials(name: string): string {
    return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }

  openReport(type: ReportTargetType, id: number, label: string): void { this.reportTarget.set({ type, id, label }); }
  closeReport(result: 'submitted' | 'cancelled'): void { this.reportTarget.set(null); if (result === 'submitted') this.message.set('Report submitted.'); }
}
