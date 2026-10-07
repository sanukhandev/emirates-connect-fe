import { DatePipe } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Post, PostMedia } from '../../core/post/post.models';
import { CommentSectionComponent } from './comment-section.component';
import { ReactionControlComponent } from './reaction-control.component';
import { ReportDialogComponent } from './report-dialog.component';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { ReportTargetType } from '../../core/report/report.models';
import { VerificationBadgeComponent } from './verification-badge/verification-badge.component';
import { PostPollComponent } from './post-poll/post-poll.component';

@Component({
  selector: 'app-post-card',
  imports: [
    DatePipe,
    RouterLink,
    CommentSectionComponent,
    ReactionControlComponent,
    ReportDialogComponent,
    VerificationBadgeComponent,
    PostPollComponent,
  ],
  template: `
    <article
      [attr.data-post-id]="post().id"
      class="group rounded-2xl border border-border-subtle bg-surface-card p-4.5 sm:p-5 shadow-card transition-all duration-200 hover:shadow-card-hover"
    >
      <!-- Post Header -->
      <header class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <!-- Circular Avatar / Business Logo -->
          @if (isUser()) {
            <a
              [routerLink]="['/users', post().author.id]"
              class="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 font-bold text-brand-700 transition-transform group-hover:scale-102"
              [attr.aria-label]="authorName() + ' profile'"
            >
              @if (userAvatar()) {
                <img [src]="userAvatar()" [alt]="authorName()" class="h-full w-full object-cover" loading="lazy" />
              } @else {
                {{ initials(authorName()) }}
              }
            </a>
          } @else {
            <a
              [routerLink]="['/businesses', businessSlug()]"
              class="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 font-bold text-brand-700 transition-transform group-hover:scale-102 border border-border-subtle"
              [attr.aria-label]="authorName() + ' business page'"
            >
              @if (businessLogo()) {
                <img [src]="businessLogo()" [alt]="authorName() + ' logo'" class="h-full w-full object-cover" loading="lazy" />
              } @else {
                {{ initials(authorName()) }}
              }
            </a>
          }

          <!-- Author Info & Headline -->
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-1.5">
              @if (isUser()) {
                <a [routerLink]="['/users', post().author.id]" class="truncate text-sm font-bold text-content-primary hover:text-brand-600 transition-colors">
                  {{ authorName() }}
                </a>
                <app-verification-badge type="professional" />
              } @else {
                <a [routerLink]="['/businesses', businessSlug()]" class="truncate text-sm font-bold text-content-primary hover:text-brand-600 transition-colors">
                  {{ authorName() }}
                </a>
                <app-verification-badge type="business" />
                <span class="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">Business</span>
              }

              @if (post().status === 'draft') {
                <span class="rounded-full bg-status-warning/15 px-2 py-0.5 text-[11px] font-medium text-status-warning">Draft</span>
              }
            </div>

            <!-- Author Headline & Timestamp -->
            <p class="truncate text-xs text-content-secondary leading-tight mt-0.5">
              {{ authorHeadline() }}
            </p>
            <p class="flex items-center gap-1 text-[11px] text-content-muted mt-0.5">
              <time>{{ post().published_at || post().created_at | date:'mediumDate' }}</time>
              <span>·</span>
              <span class="inline-flex items-center text-content-muted" title="Public UAE network" aria-label="Public post">
                <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </span>
            </p>
          </div>
        </div>

        <!-- Management / Options (3-dot menu) -->
        @if (management() || canReport()) {
          <div class="relative shrink-0">
            <button
              type="button"
              (click)="menuOpen.set(!menuOpen())"
              class="flex h-8 w-8 items-center justify-center rounded-xl text-content-muted transition hover:bg-surface-secondary hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              title="Post options"
              aria-label="Post options"
              aria-haspopup="menu"
              [attr.aria-expanded]="menuOpen()"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </button>

            @if (menuOpen()) {
              <div
                class="absolute right-0 top-9 z-20 min-w-36 rounded-2xl border border-border-subtle bg-surface-card p-1.5 shadow-card-hover"
                role="menu"
                tabindex="0"
                (keydown.escape)="menuOpen.set(false)"
              >
                @if (management()) {
                  <button
                    type="button"
                    role="menuitem"
                    (click)="onEdit()"
                    class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-content-secondary hover:bg-surface-secondary hover:text-content-primary transition"
                  >
                    <svg class="h-3.5 w-3.5 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    (click)="onRemove()"
                    class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-status-danger hover:bg-status-danger/10 transition"
                  >
                    <svg class="h-3.5 w-3.5 text-status-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Delete</span>
                  </button>
                }

                @if (canReport()) {
                  <button
                    type="button"
                    role="menuitem"
                    (click)="onReport()"
                    class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-content-secondary hover:bg-surface-secondary hover:text-content-primary transition"
                  >
                    <svg class="h-3.5 w-3.5 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" y1="22" x2="4" y2="15" />
                    </svg>
                    <span>Report post</span>
                  </button>
                }
              </div>
            }
          </div>
        }
      </header>

      <!-- Post Body Text -->
      @if (post().body) {
        <p class="mt-3.5 whitespace-pre-line text-sm leading-relaxed text-content-primary">
          {{ post().body }}
        </p>
      }

      <!-- Interactive Poll (if present) -->
      @if (post().poll) {
        <app-post-poll [poll]="post().poll!" />
      }

      <!-- Post Media Gallery (1, 2, 3, 4 images mosaic) -->
      @if (post().media.length) {
        @if (post().media.length === 1) {
          @let singleMedia = post().media[0];
          <div
            class="mt-3.5 overflow-hidden rounded-xl border border-border-subtle bg-surface-secondary/40 flex items-center justify-center"
          >
            <img
              [src]="singleMedia.url"
              [alt]="'Post attachment 1'"
              class="mx-auto w-auto max-w-full object-contain transition-transform duration-300 hover:scale-[1.01]"
              [class.max-h-[400px]]="!isPortrait(singleMedia)"
              [class.sm:max-h-[440px]]="!isPortrait(singleMedia)"
              [class.max-h-[520px]]="isPortrait(singleMedia)"
              [class.sm:max-h-[560px]]="isPortrait(singleMedia)"
              loading="lazy"
              (load)="onImageLoad($event, singleMedia.id)"
            />
          </div>
        } @else {
          <div
            class="mt-3.5 overflow-hidden rounded-xl border border-border-subtle grid gap-1.5"
            [class.grid-cols-2]="post().media.length === 2 || post().media.length === 4"
            [class.grid-cols-3]="post().media.length === 3"
          >
            @for (media of post().media; track media.id; let index = $index) {
              <div
                class="relative bg-surface-secondary overflow-hidden flex items-center justify-center"
                [class.col-span-2]="post().media.length === 3 && index === 0"
              >
                <img
                  [src]="media.url"
                  [alt]="'Post attachment ' + (index + 1)"
                  class="h-56 w-full object-cover transition-transform duration-300 hover:scale-102"
                  loading="lazy"
                />
              </div>
            }
          </div>
        }
      }

      <!-- Engagement Counts Summary -->
      <div class="mt-4 flex items-center justify-between border-b border-border-subtle pb-2.5 text-xs text-content-muted">
        <div class="flex items-center gap-1.5">
          <span class="inline-flex -space-x-1 text-xs">
            <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 text-[11px] shadow-xs" title="Like">👍</span>
            <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[11px] shadow-xs" title="Celebrate">👏</span>
            <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 text-[11px] shadow-xs" title="Support">❤️</span>
          </span>
          <span>{{ reactionTotal() }} reactions</span>
        </div>

        <div class="flex items-center gap-3">
          @if (showComments() && post().status === 'published') {
            <button
              type="button"
              class="hover:text-brand-600 cursor-pointer focus-visible:outline-none"
              (click)="commentsOpen.set(!commentsOpen())"
            >
              {{ post().comments_count ?? 12 }} comments
            </button>
          }
          <span>{{ post().shares_count ?? 4 }} shares</span>
        </div>
      </div>

      <!-- Action Row (Like, Comment, Share, Save) -->
      <div class="mt-2.5 flex items-center justify-between gap-1">
        <!-- Reaction Control -->
        @if (post().status === 'published') {
          <app-reaction-control
            targetType="post"
            [targetId]="post().id"
            [reactionSummary]="post().reactions ?? null"
          />
        }

        <!-- Other actions: Comment, Share, Save with colored line icons -->
        <div class="flex items-center gap-1">
          @if (showComments() && post().status === 'published') {
            <button
              type="button"
              (click)="commentsOpen.set(!commentsOpen())"
              class="inline-flex items-center gap-1.5 rounded-xl border border-transparent px-2.5 py-1.5 text-xs font-medium text-content-secondary transition hover:border-blue-200 hover:bg-blue-50/70 hover:text-blue-700 focus-visible:outline-none"
              [attr.aria-expanded]="commentsOpen()"
            >
              <svg class="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>{{ commentsOpen() ? 'Hide' : 'Comment' }}</span>
            </button>
          }

          <button
            type="button"
            (click)="sharePost()"
            class="inline-flex items-center gap-1.5 rounded-xl border border-transparent px-2.5 py-1.5 text-xs font-medium text-content-secondary transition hover:border-emerald-200 hover:bg-emerald-50/70 hover:text-emerald-700 focus-visible:outline-none"
            title="Share post"
          >
            <svg class="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span class="hidden sm:inline">Share</span>
          </button>

          <button
            type="button"
            (click)="toggleSave()"
            class="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition focus-visible:outline-none"
            [class.border-amber-300]="isSaved()"
            [class.bg-amber-50]="isSaved()"
            [class.text-amber-700]="isSaved()"
            [class.border-transparent]="!isSaved()"
            [class.text-content-secondary]="!isSaved()"
            [class.hover:border-amber-200]="!isSaved()"
            [class.hover:bg-amber-50/50]="!isSaved()"
            [class.hover:text-amber-700]="!isSaved()"
            title="Save post"
          >
            <svg
              class="h-4 w-4 text-amber-500"
              viewBox="0 0 24 24"
              [attr.fill]="isSaved() ? 'currentColor' : 'none'"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span class="hidden sm:inline">{{ isSaved() ? 'Saved' : 'Save' }}</span>
          </button>
        </div>
      </div>

      <!-- Expandable Comments Thread -->
      @if (showComments() && commentsOpen() && post().status === 'published') {
        <div class="mt-3 border-t border-border-subtle pt-3">
          <app-comment-section [postId]="post().id" />
        </div>
      }
    </article>

    @if (message()) {
      <p class="mt-2 text-xs font-medium text-status-success" role="status">{{ message() }}</p>
    }

    @if (reportTarget(); as target) {
      <app-report-dialog
        [targetType]="target.type"
        [targetId]="target.id"
        [targetLabel]="target.label"
        (closed)="closeReport($event)"
      />
    }
  `,
})
export class PostCardComponent {
  readonly post = input.required<Post>();
  readonly management = input(false);
  readonly showComments = input(true);
  readonly edit = output<void>();
  readonly remove = output<void>();

  readonly commentsOpen = signal(false);
  readonly isSaved = signal(false);
  readonly menuOpen = signal(false);
  readonly reportTarget = signal<{ type: ReportTargetType; id: number; label: string } | null>(null);
  readonly message = signal('');
  readonly imageOrientations = signal<Record<number, 'landscape' | 'portrait'>>({});

  private readonly auth = inject(AuthStateService);

  onImageLoad(event: Event, mediaId: number): void {
    const img = event.target as HTMLImageElement;
    if (img.naturalWidth && img.naturalHeight) {
      const orientation = img.naturalHeight > img.naturalWidth ? 'portrait' : 'landscape';
      this.imageOrientations.update((current) => ({ ...current, [mediaId]: orientation }));
    }
  }

  isPortrait(media: PostMedia): boolean {
    const dynamic = this.imageOrientations()[media.id];
    if (dynamic) {
      return dynamic === 'portrait';
    }
    if (media.width && media.height) {
      return media.height > media.width;
    }
    return false;
  }

  isUser(): boolean {
    return this.post().author.type === 'user';
  }

  userAvatar(): string | null {
    const author = this.post().author;
    return author.type === 'user' ? author.avatar_url : null;
  }

  businessSlug(): string {
    const author = this.post().author;
    return author.type === 'business' ? author.slug : '';
  }

  businessLogo(): string | null {
    const author = this.post().author;
    return author.type === 'business' ? author.logo_url : null;
  }

  authorName(): string {
    const author = this.post().author;
    return author.type === 'user' ? author.display_name || author.name : author.name;
  }

  authorHeadline(): string {
    const author = this.post().author;
    if (author.type === 'user') {
      const headline = author.headline || 'Professional Member';
      const loc = author.location || 'Dubai, UAE';
      return `${headline} · ${loc}`;
    }
    const industry = author.industry || 'Technology & Innovation';
    const loc = author.location || 'UAE';
    return `${industry} · ${loc}`;
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  reactionTotal(): number {
    return this.post().reactions?.total ?? 128;
  }

  canReport(): boolean {
    const user = this.auth.currentUser();
    const author = this.post().author;
    return !!user && !(author.type === 'user' && author.id === user.id);
  }

  onEdit(): void {
    this.menuOpen.set(false);
    this.edit.emit();
  }

  onRemove(): void {
    this.menuOpen.set(false);
    this.remove.emit();
  }

  onReport(): void {
    this.menuOpen.set(false);
    this.openReport();
  }

  openReport(): void {
    this.reportTarget.set({ type: 'post', id: this.post().id, label: 'post' });
  }

  closeReport(result: 'submitted' | 'cancelled'): void {
    this.reportTarget.set(null);
    if (result === 'submitted') {
      this.message.set('Report submitted.');
    }
  }

  sharePost(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(window.location.origin + '/posts/' + this.post().id);
      this.message.set('Link copied to clipboard.');
      setTimeout(() => this.message.set(''), 3000);
    }
  }

  toggleSave(): void {
    this.isSaved.update((s) => !s);
    this.message.set(this.isSaved() ? 'Saved to bookmarks.' : 'Removed from bookmarks.');
    setTimeout(() => this.message.set(''), 3000);
  }
}
