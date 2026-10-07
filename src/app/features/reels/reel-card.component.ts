import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable, map } from 'rxjs';

import { Reel } from '../../core/reel/reel.models';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { ReactionService } from '../../core/reaction/reaction.service';
import {
  ReactionSummary,
  applyOptimisticReaction,
} from '../../core/reaction/reaction.models';
import { ReportTargetType } from '../../core/report/report.models';
import { ReportDialogComponent } from '../../shared/components/report-dialog.component';
import { CommentSectionComponent } from '../../shared/components/comment-section.component';

@Component({
  selector: 'app-reel-card',
  imports: [
    DatePipe,
    RouterLink,
    ReportDialogComponent,
    CommentSectionComponent,
  ],
  template: `
    <article
      #cardRoot
      class="relative flex w-full justify-center transition-all duration-300"
      [attr.aria-label]="'Reel by ' + authorName()"
    >
      <!-- Main Content Stage: Video + Side Rail / Comments -->
      <div class="relative flex flex-col items-center lg:flex-row lg:items-end lg:justify-center gap-3 sm:gap-4 w-full">
        <!-- 1. The 9:16 Video Player Surface -->
        <div
          class="relative aspect-[9/16] w-full max-w-[420px] max-h-[760px] min-h-[500px] overflow-hidden rounded-3xl bg-[#111114] shadow-card ring-1 ring-border-subtle/80 flex flex-col justify-between select-none"
        >
          <!-- Video Element (or Processing / Error fallback) -->
          @if (reel().status === 'published' && reel().playback_url && !videoError()) {
            <video
              #videoEl
              class="absolute inset-0 h-full w-full object-contain cursor-pointer bg-[#111114]"
              [poster]="reel().thumbnail_url || undefined"
              playsinline
              preload="metadata"
              [loop]="true"
              [muted]="isMuted()"
              (click)="togglePlay()"
              (error)="onVideoError()"
              (timeupdate)="onTimeUpdate()"
              (play)="isPlaying.set(true)"
              (pause)="isPlaying.set(false)"
              [attr.aria-label]="'Reel video by ' + authorName()"
            >
              <source [src]="reel().playback_url" type="video/mp4" />
            </video>

            <!-- Centered Play/Pause Tap Flash Overlay -->
            @if (!isPlaying()) {
              <button
                type="button"
                (click)="togglePlay()"
                class="absolute inset-0 z-10 flex items-center justify-center bg-black/25 backdrop-blur-[1px] transition-all hover:bg-black/35 focus-visible:outline-none"
                aria-label="Play reel"
              >
                <div
                  class="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white shadow-xl ring-1 ring-white/20 transition-transform hover:scale-110 active:scale-95"
                >
                  <svg class="h-8 w-8 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              </button>
            }

            <!-- Floating Top Controls Bar -->
            <div class="relative z-20 flex items-center justify-between p-3.5 sm:p-4 pointer-events-none">
              <!-- Category / UAE Emblem Pill -->
              <span class="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md ring-1 ring-white/15">
                <span class="h-1.5 w-1.5 rounded-full bg-brand-primary"></span>
                Reel
              </span>

              <!-- Sound Toggle Button -->
              <button
                type="button"
                (click)="toggleMute($event)"
                class="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md ring-1 ring-white/15 shadow-md transition hover:bg-black/75 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                [title]="isMuted() ? 'Unmute video' : 'Mute video'"
                [attr.aria-label]="isMuted() ? 'Unmute audio' : 'Mute audio'"
              >
                @if (isMuted()) {
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                } @else {
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                }
              </button>
            </div>

            <!-- Bottom Gradient Overlay with Author & Caption -->
            <div
              class="relative z-20 mt-auto bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 sm:p-5 pt-16 text-white"
            >
              <!-- Author Row -->
              <div class="flex items-center justify-between gap-3">
                <a
                  [routerLink]="authorLink()"
                  class="group flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  (click)="$event.stopPropagation()"
                >
                  <div
                    class="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-white/20 bg-brand-primary/20 text-xs font-bold text-white shadow-xs"
                  >
                    @if (avatarUrl() && !avatarError()) {
                      <img
                        [src]="avatarUrl()!"
                        [alt]="authorName() + ' avatar'"
                        class="h-full w-full object-cover"
                        (error)="avatarError.set(true)"
                      />
                    } @else {
                      <span>{{ initials() }}</span>
                    }
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <p class="truncate text-sm font-bold text-white group-hover:underline">
                        {{ authorName() }}
                      </p>
                      @if (reel().author.is_verified) {
                        <span class="inline-flex shrink-0 items-center text-brand-primary" title="Verified Profile">
                          <svg class="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <polyline points="9 12 11 14 15 10" fill="none" stroke="currentColor" stroke-width="2.5" />
                          </svg>
                        </span>
                      }
                    </div>
                    <p class="truncate text-xs text-white/70">{{ authorSubtitle() }}</p>
                  </div>
                </a>

                @if (reel().published_at) {
                  <span class="shrink-0 text-[11px] text-white/60">
                    {{ reel().published_at | date:'mediumDate' }}
                  </span>
                }
              </div>

              <!-- Reel Caption with subtle hashtag coloring and expandable "more" -->
              @if (reel().caption) {
                <div class="mt-3">
                  <p class="text-xs sm:text-sm text-white/90 leading-relaxed break-words">
                    @for (token of captionTokens(); track $index) {
                      @if (token.isHashtag) {
                        <span class="font-medium text-brand-300 hover:text-white transition-colors">{{ token.text }}</span>
                      } @else {
                        <span>{{ token.text }}</span>
                      }
                    }
                    @if (isCaptionTruncated()) {
                      <button
                        type="button"
                        (click)="captionExpanded.set(!captionExpanded()); $event.stopPropagation()"
                        class="ml-1 inline-block text-xs font-semibold text-brand-300 underline hover:text-white"
                      >
                        {{ captionExpanded() ? 'less' : 'more' }}
                      </button>
                    }
                  </p>
                </div>
              }
            </div>

            <!-- Video Progress Bar -->
            <div class="absolute bottom-0 inset-x-0 z-30 h-1 bg-white/20">
              <div
                class="h-full bg-brand-primary transition-all duration-150 ease-linear"
                [style.width.%]="videoProgress()"
              ></div>
            </div>

            <!-- Mobile Inside-Right Floating Engagement Action Rail -->
            <div
              class="sm:hidden absolute right-2.5 bottom-16 z-30 flex flex-col items-center gap-3 pointer-events-auto"
              aria-label="Reel mobile actions"
            >
              <!-- Like -->
              <button
                type="button"
                (click)="toggleLike(); $event.stopPropagation()"
                [disabled]="reactionPending()"
                class="flex flex-col items-center gap-1 focus-visible:outline-none"
                [attr.aria-label]="hasLiked() ? 'Unlike reel' : 'Like reel'"
              >
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md ring-1 ring-white/20 shadow-md transition active:scale-95"
                  [class.text-brand-primary]="hasLiked()"
                  [class.bg-brand-soft/20]="hasLiked()"
                >
                  <svg
                    class="h-5 w-5"
                    viewBox="0 0 24 24"
                    [attr.fill]="hasLiked() ? '#9470F8' : 'none'"
                    [attr.stroke]="hasLiked() ? '#9470F8' : 'currentColor'"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <span class="text-[11px] font-semibold text-white drop-shadow-md">
                  {{ likeCount() }}
                </span>
              </button>

              <!-- Comments -->
              <button
                type="button"
                (click)="toggleComments(); $event.stopPropagation()"
                class="flex flex-col items-center gap-1 focus-visible:outline-none"
                [attr.aria-label]="commentsOpen() ? 'Close comments' : 'Open comments'"
              >
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md ring-1 ring-white/20 shadow-md transition active:scale-95"
                  [class.text-brand-primary]="commentsOpen()"
                >
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </div>
                <span class="text-[10px] font-semibold text-white drop-shadow-md">Reply</span>
              </button>

              <!-- Share -->
              <button
                type="button"
                (click)="shareReel(); $event.stopPropagation()"
                class="flex flex-col items-center gap-1 focus-visible:outline-none"
                aria-label="Share reel"
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md ring-1 ring-white/20 shadow-md transition active:scale-95">
                  <svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </div>
                <span class="text-[10px] font-semibold text-white drop-shadow-md">Share</span>
              </button>

              <!-- Save -->
              <button
                type="button"
                (click)="toggleSave(); $event.stopPropagation()"
                class="flex flex-col items-center gap-1 focus-visible:outline-none"
                [attr.aria-label]="isSaved() ? 'Unsave reel' : 'Save reel'"
              >
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md ring-1 ring-white/20 shadow-md transition active:scale-95"
                  [class.text-brand-primary]="isSaved()"
                >
                  <svg
                    class="h-4.5 w-4.5"
                    viewBox="0 0 24 24"
                    [attr.fill]="isSaved() ? '#9470F8' : 'none'"
                    [attr.stroke]="isSaved() ? '#9470F8' : 'currentColor'"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <span class="text-[10px] font-semibold text-white drop-shadow-md">Save</span>
              </button>

              <!-- 3-Dot More Menu Mobile Trigger -->
              <button
                type="button"
                (click)="moreMenuOpen.set(!moreMenuOpen()); $event.stopPropagation()"
                class="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md ring-1 ring-white/20 shadow-md transition active:scale-95"
                aria-label="More options"
              >
                <svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
            </div>
          } @else if (videoError()) {
            <!-- Video Playback Error Recovery State -->
            <div class="flex h-full w-full flex-col items-center justify-center bg-[#111114] p-6 text-center text-white">
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-status-danger mb-3 ring-1 ring-white/10">
                <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </div>
              <h3 class="text-base font-bold">Video unavailable</h3>
              <p class="mt-1 text-xs text-white/60 max-w-xs">We encountered an issue loading this video stream.</p>
              <button
                type="button"
                (click)="retryVideo()"
                class="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-hover active:scale-95"
              >
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                <span>Retry</span>
              </button>
            </div>
          } @else {
            <!-- Status Card: Processing or Failed -->
            <div
              class="flex h-full w-full flex-col items-center justify-center bg-[#18181C] p-6 text-center text-white"
              [attr.aria-label]="statusLabel()"
            >
              @if (reel().status === 'processing') {
                <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/20 text-brand-primary mb-3">
                  <svg class="h-7 w-7 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                </div>
                <h3 class="text-base font-bold">Processing video…</h3>
                <p class="mt-1 text-xs text-white/60 max-w-xs">Our media pipeline is encoding your reel. It will be published shortly.</p>
              } @else if (reel().status === 'failed') {
                <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-status-danger/15 text-status-danger mb-3">
                  <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 class="text-base font-bold text-status-danger">Processing failed</h3>
                <p class="mt-1 text-xs text-white/60 max-w-xs">The video could not be converted.</p>
                @if (management()) {
                  <button
                    type="button"
                    (click)="remove.emit(reel())"
                    class="mt-4 rounded-xl border border-status-danger/40 px-3.5 py-1.5 text-xs font-semibold text-status-danger hover:bg-status-danger/10"
                  >
                    Delete and retry
                  </button>
                }
              } @else {
                <h3 class="text-base font-bold">Video unavailable</h3>
              }
            </div>
          }

          <!-- Floating Toast Notification on Video Surface -->
          @if (toastMessage()) {
            <div
              class="absolute top-4 inset-x-4 z-40 mx-auto max-w-xs rounded-xl bg-black/85 px-3.5 py-2 text-center text-xs font-medium text-white shadow-xl backdrop-blur-md ring-1 ring-white/10"
              role="status"
            >
              {{ toastMessage() }}
            </div>
          }
        </div>

        <!-- 2. Desktop Vertical Action Rail (Placed on right side of video) -->
        <aside
          class="hidden sm:flex flex-col items-center gap-3.5 pb-2 shrink-0 select-none"
          aria-label="Reel engagement actions"
        >
          <!-- Like Button -->
          <button
            type="button"
            (click)="toggleLike()"
            [disabled]="reactionPending()"
            class="group flex flex-col items-center gap-1 focus-visible:outline-none"
            [attr.aria-label]="hasLiked() ? 'Unlike reel' : 'Like reel'"
          >
            <div
              class="flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-150 shadow-xs group-hover:scale-105 active:scale-95"
              [class.bg-brand-soft]="hasLiked()"
              [class.border-brand-primary]="hasLiked()"
              [class.text-brand-primary]="hasLiked()"
              [class.bg-surface-card]="!hasLiked()"
              [class.border-border-subtle]="!hasLiked()"
              [class.text-content-secondary]="!hasLiked()"
              [class.hover:border-brand-primary]="!hasLiked()"
              [class.hover:text-brand-primary]="!hasLiked()"
            >
              <svg
                class="h-5 w-5 transition-colors"
                viewBox="0 0 24 24"
                [attr.fill]="hasLiked() ? '#9470F8' : 'none'"
                [attr.stroke]="hasLiked() ? '#9470F8' : 'currentColor'"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <span
              class="text-xs font-semibold"
              [class.text-brand-primary]="hasLiked()"
              [class.text-content-secondary]="!hasLiked()"
            >
              {{ likeCount() }}
            </span>
          </button>

          <!-- Comments Drawer Button -->
          <button
            type="button"
            (click)="toggleComments()"
            class="group flex flex-col items-center gap-1 focus-visible:outline-none"
            [attr.aria-label]="commentsOpen() ? 'Close comments' : 'Open comments'"
          >
            <div
              class="flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-150 shadow-xs group-hover:scale-105 active:scale-95"
              [class.bg-brand-soft]="commentsOpen()"
              [class.border-brand-primary]="commentsOpen()"
              [class.text-brand-primary]="commentsOpen()"
              [class.bg-surface-card]="!commentsOpen()"
              [class.border-border-subtle]="!commentsOpen()"
              [class.text-content-secondary]="!commentsOpen()"
              [class.hover:border-brand-primary]="!commentsOpen()"
              [class.hover:text-brand-primary]="!commentsOpen()"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <span class="text-xs font-semibold text-content-secondary">
              Comments
            </span>
          </button>

          <!-- Share Button -->
          <button
            type="button"
            (click)="shareReel()"
            class="group flex flex-col items-center gap-1 focus-visible:outline-none"
            aria-label="Share reel"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-border-subtle bg-surface-card text-content-secondary transition-all duration-150 shadow-xs group-hover:scale-105 group-hover:border-brand-primary group-hover:text-brand-primary active:scale-95">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
            <span class="text-xs font-semibold text-content-secondary">
              Share
            </span>
          </button>

          <!-- Save Button -->
          <button
            type="button"
            (click)="toggleSave()"
            class="group flex flex-col items-center gap-1 focus-visible:outline-none"
            [attr.aria-label]="isSaved() ? 'Unsave reel' : 'Save reel'"
          >
            <div
              class="flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-150 shadow-xs group-hover:scale-105 active:scale-95"
              [class.bg-brand-soft]="isSaved()"
              [class.border-brand-primary]="isSaved()"
              [class.text-brand-primary]="isSaved()"
              [class.bg-surface-card]="!isSaved()"
              [class.border-border-subtle]="!isSaved()"
              [class.text-content-secondary]="!isSaved()"
              [class.hover:border-brand-primary]="!isSaved()"
              [class.hover:text-brand-primary]="!isSaved()"
            >
              <svg
                class="h-5 w-5"
                viewBox="0 0 24 24"
                [attr.fill]="isSaved() ? '#9470F8' : 'none'"
                [attr.stroke]="isSaved() ? '#9470F8' : 'currentColor'"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span class="text-xs font-semibold" [class.text-brand-primary]="isSaved()" [class.text-content-secondary]="!isSaved()">
              Save
            </span>
          </button>

          <!-- 3-Dot More Menu Desktop Trigger -->
          <div class="relative">
            <button
              type="button"
              (click)="moreMenuOpen.set(!moreMenuOpen())"
              class="flex h-12 w-12 items-center justify-center rounded-2xl border border-border-subtle bg-surface-card text-content-secondary transition-all duration-150 shadow-xs hover:border-brand-primary hover:text-brand-primary active:scale-95"
              aria-label="More options"
              [attr.aria-expanded]="moreMenuOpen()"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            <!-- Dropdown Menu -->
            @if (moreMenuOpen()) {
              <div
                class="absolute right-0 bottom-full mb-2 w-48 rounded-2xl border border-border-subtle bg-surface-card p-1.5 shadow-xl z-50 text-content-primary"
              >
                <button
                  type="button"
                  (click)="shareReel(); moreMenuOpen.set(false)"
                  class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium hover:bg-surface-secondary text-left"
                >
                  <svg class="h-4 w-4 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  <span>Copy reel link</span>
                </button>

                @if (management() || isOwner()) {
                  <button
                    type="button"
                    (click)="edit.emit(reel()); moreMenuOpen.set(false)"
                    class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium hover:bg-surface-secondary text-left"
                  >
                    <svg class="h-4 w-4 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    <span>Edit caption</span>
                  </button>
                  <button
                    type="button"
                    (click)="remove.emit(reel()); moreMenuOpen.set(false)"
                    class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-status-danger hover:bg-status-danger/10 text-left"
                  >
                    <svg class="h-4 w-4 text-status-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    <span>Delete reel</span>
                  </button>
                } @else if (canReport()) {
                  <button
                    type="button"
                    (click)="openReport(); moreMenuOpen.set(false)"
                    class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-content-primary hover:bg-surface-secondary text-left"
                  >
                    <svg class="h-4 w-4 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                    <span>Report reel</span>
                  </button>
                }
              </div>
            }
          </div>
        </aside>

        <!-- 3. Desktop Comments Slide-Out Drawer (when open on screens >= 1024px) -->
        @if (commentsOpen()) {
          <div
            class="hidden lg:flex flex-col w-[380px] shrink-0 h-[640px] max-h-[740px] rounded-3xl border border-border-subtle bg-surface-card p-5 shadow-card transition-all"
          >
            <div class="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div class="flex items-center gap-2">
                <svg class="h-4.5 w-4.5 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                <h3 class="font-bold text-sm text-content-primary">Comments</h3>
              </div>
              <button
                type="button"
                (click)="commentsOpen.set(false)"
                class="rounded-xl p-1.5 text-content-secondary hover:bg-surface-secondary transition"
                aria-label="Close comments"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="overflow-y-auto flex-1 pr-1">
              <app-comment-section [postId]="reel().id" targetType="reel" />
            </div>
          </div>
        }
      </div>

      <!-- Mobile / Tablet Bottom Sheet Comments Modal (when screen < 1024px) -->
      @if (commentsOpen()) {
        <div
          class="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs"
          role="presentation"
        >
          <button
            type="button"
            class="fixed inset-0 h-full w-full bg-transparent cursor-default border-0 p-0 focus:outline-none"
            aria-label="Close comments overlay"
            (click)="commentsOpen.set(false)"
          ></button>
          <div
            class="relative z-10 w-full max-h-[82vh] rounded-t-3xl bg-surface-card p-5 shadow-2xl overflow-y-auto flex flex-col"
          >
            <div class="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div class="flex items-center gap-2">
                <div class="h-1 w-10 rounded-full bg-border-subtle mx-auto mb-2"></div>
                <h3 class="font-bold text-base text-content-primary">Reel Comments</h3>
              </div>
              <button
                type="button"
                (click)="commentsOpen.set(false)"
                class="rounded-xl p-1.5 text-content-secondary hover:bg-surface-secondary transition"
                aria-label="Close comments"
              >
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="overflow-y-auto flex-1 mt-2">
              <app-comment-section [postId]="reel().id" targetType="reel" />
            </div>
          </div>
        </div>
      }

      <!-- Mobile More Menu Bottom Sheet -->
      @if (moreMenuOpen() && isMobileViewport()) {
        <div
          class="sm:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs"
          role="presentation"
        >
          <button
            type="button"
            class="fixed inset-0 h-full w-full bg-transparent cursor-default border-0 p-0 focus:outline-none"
            aria-label="Close menu overlay"
            (click)="moreMenuOpen.set(false)"
          ></button>
          <div
            class="relative z-10 w-full rounded-t-3xl bg-surface-card p-5 shadow-2xl flex flex-col gap-2"
          >
            <div class="h-1 w-10 rounded-full bg-border-subtle mx-auto mb-2"></div>
            <button
              type="button"
              (click)="shareReel(); moreMenuOpen.set(false)"
              class="flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-content-primary hover:bg-surface-secondary"
            >
              <svg class="h-5 w-5 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              <span>Copy reel link</span>
            </button>
            @if (management() || isOwner()) {
              <button
                type="button"
                (click)="edit.emit(reel()); moreMenuOpen.set(false)"
                class="flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-content-primary hover:bg-surface-secondary"
              >
                <svg class="h-5 w-5 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span>Edit caption</span>
              </button>
              <button
                type="button"
                (click)="remove.emit(reel()); moreMenuOpen.set(false)"
                class="flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-status-danger hover:bg-status-danger/10"
              >
                <svg class="h-5 w-5 text-status-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span>Delete reel</span>
              </button>
            } @else if (canReport()) {
              <button
                type="button"
                (click)="openReport(); moreMenuOpen.set(false)"
                class="flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-content-primary hover:bg-surface-secondary"
              >
                <svg class="h-5 w-5 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                <span>Report reel</span>
              </button>
            }
          </div>
        </div>
      }

      <!-- Report Dialog Modal -->
      @if (reportTarget(); as target) {
        <app-report-dialog
          [targetType]="target.type"
          [targetId]="target.id"
          [targetLabel]="target.label"
          (closed)="closeReport($event)"
        />
      }
    </article>
  `,
})
export class ReelCardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cardRoot') private readonly cardRoot?: ElementRef<HTMLElement>;
  @ViewChild('videoEl') private readonly videoEl?: ElementRef<HTMLVideoElement>;

  readonly reel = input.required<Reel>();
  readonly management = input(false);
  readonly isActive = input(false);

  readonly becameVisible = output<number>();
  readonly edit = output<Reel>();
  readonly remove = output<Reel>();

  readonly isPlaying = signal(false);
  readonly isMuted = signal(true);
  readonly videoProgress = signal(0);
  readonly videoDuration = signal(0);
  readonly videoError = signal(false);
  readonly avatarError = signal(false);
  readonly commentsOpen = signal(false);
  readonly moreMenuOpen = signal(false);
  readonly captionExpanded = signal(false);
  readonly isSaved = signal(false);
  readonly toastMessage = signal('');
  readonly reportTarget = signal<{ type: ReportTargetType; id: number; label: string } | null>(null);

  readonly reactions = signal<ReactionSummary | null>(null);
  readonly reactionPending = signal(false);

  private readonly auth = inject(AuthStateService);
  private readonly reactionService = inject(ReactionService);
  private readonly destroyRef = inject(DestroyRef);
  private observer?: IntersectionObserver;
  private toastTimer?: ReturnType<typeof setTimeout>;

  readonly hasLiked = computed(() => this.reactions()?.current_user === 'like');
  readonly likeCount = computed(() => this.reactions()?.total ?? 0);

  constructor() {
    // Synchronize reactions from input
    effect(() => {
      const summary = this.reel().reactions ?? null;
      this.reactions.set(summary);
    });

    // Control video playback based on isActive input
    effect(() => {
      const active = this.isActive();
      const video = this.videoEl?.nativeElement;
      if (!video) return;

      if (active && this.reel().status === 'published' && this.reel().playback_url && !this.videoError()) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Browser autoplay restrictions: mute and retry
            video.muted = true;
            this.isMuted.set(true);
            void video.play().catch(() => undefined);
          });
        }
      } else {
        video.pause();
      }
    });
  }

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined' || !this.cardRoot) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            this.becameVisible.emit(this.reel().id);
          } else if (entry.intersectionRatio < 0.2) {
            const video = this.videoEl?.nativeElement;
            if (video && !video.paused) {
              video.pause();
            }
          }
        }
      },
      { threshold: [0.2, 0.5, 0.8] }
    );

    this.observer.observe(this.cardRoot.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.toastTimer) clearTimeout(this.toastTimer);
    const video = this.videoEl?.nativeElement;
    if (video) video.pause();
  }

  authorName(): string {
    const author = this.reel().author;
    return author.type === 'user' ? (author.display_name || 'Professional profile') : author.name;
  }

  authorSubtitle(): string {
    const author = this.reel().author;
    return author.type === 'user' ? (author.headline || 'Professional') : 'Business';
  }

  avatarUrl(): string | null {
    const author = this.reel().author;
    return author.type === 'user' ? author.avatar_url : author.logo_url;
  }

  authorLink(): string[] {
    const author = this.reel().author;
    return author.type === 'user' ? ['/users', String(author.id)] : ['/businesses', author.slug];
  }

  initials(): string {
    return this.authorName().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'EC';
  }

  statusLabel(): string {
    return this.reel().status === 'processing'
      ? 'Processing video…'
      : this.reel().status === 'failed'
        ? 'Processing failed'
        : 'Video unavailable';
  }

  isOwner(): boolean {
    const user = this.auth.currentUser();
    const author = this.reel().author;
    return !!user && author.type === 'user' && author.id === user.id;
  }

  canReport(): boolean {
    const user = this.auth.currentUser();
    const author = this.reel().author;
    return !!user && !(author.type === 'user' && author.id === user.id);
  }

  isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 640;
  }

  togglePlay(): void {
    const video = this.videoEl?.nativeElement;
    if (!video) return;
    if (video.paused) {
      const playPromise = video.play?.();
      if (playPromise && typeof playPromise.catch === 'function') {
        void playPromise.catch(() => undefined);
      }
    } else {
      video.pause?.();
    }
  }

  toggleMute(event: Event): void {
    event.stopPropagation();
    const video = this.videoEl?.nativeElement;
    if (!video) return;
    const next = !this.isMuted();
    video.muted = next;
    this.isMuted.set(next);
  }

  onTimeUpdate(): void {
    const video = this.videoEl?.nativeElement;
    if (!video || !video.duration) return;
    this.videoProgress.set((video.currentTime / video.duration) * 100);
    this.videoDuration.set(video.duration);
  }

  onVideoError(): void {
    this.videoError.set(true);
  }

  retryVideo(): void {
    this.videoError.set(false);
    const video = this.videoEl?.nativeElement;
    if (!video) return;
    video.load?.();
    const playPromise = video.play?.();
    if (playPromise && typeof playPromise.catch === 'function') {
      void playPromise.catch(() => undefined);
    }
  }

  toggleLike(): void {
    if (!this.auth.currentUser()) {
      this.showToast('Please sign in to react');
      return;
    }
    if (this.reactionPending()) return;

    const current = this.reactions();
    const hasLiked = current?.current_user === 'like';
    const nextType = hasLiked ? null : 'like';

    if (current) {
      this.reactions.set(applyOptimisticReaction(current, nextType));
    }
    this.reactionPending.set(true);

    const request$: Observable<ReactionSummary> = hasLiked
      ? this.reactionService
          .removeReelReaction(this.reel().id)
          .pipe(map(() => this.reactions() ?? { total: 0, counts: { like: 0, celebrate: 0, support: 0, insightful: 0 }, current_user: null }))
      : this.reactionService.setReelReaction(this.reel().id, 'like');

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (summary: ReactionSummary) => {
        if (summary) this.reactions.set(summary);
        this.reactionPending.set(false);
      },
      error: (err: unknown) => {
        this.reactions.set(current);
        this.reactionPending.set(false);
        this.showToast(this.reactionService.errorMessage(err));
      },
    });
  }

  toggleComments(): void {
    this.commentsOpen.set(!this.commentsOpen());
  }

  toggleSave(): void {
    const next = !this.isSaved();
    this.isSaved.set(next);
    this.showToast(next ? 'Reel saved to collection' : 'Reel removed from saved');
  }

  shareReel(): void {
    const url = `${window.location.origin}/reels/${this.reel().id}`;
    if (navigator.share) {
      void navigator.share({ title: 'Emirates Connect Reel', url }).catch(() => undefined);
    } else if (navigator.clipboard) {
      void navigator.clipboard.writeText(url).then(() => {
        this.showToast('Reel link copied to clipboard');
      });
    } else {
      this.showToast(url);
    }
  }

  openReport(): void {
    this.reportTarget.set({ type: 'reel', id: this.reel().id, label: 'reel' });
  }

  closeReport(result: 'submitted' | 'cancelled'): void {
    this.reportTarget.set(null);
    if (result === 'submitted') {
      this.showToast('Report submitted. Thank you for keeping our community safe.');
    }
  }

  showToast(message: string): void {
    this.toastMessage.set(message);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set('');
    }, 2600);
  }

  captionTokens(): { text: string; isHashtag: boolean }[] {
    const caption = this.reel().caption || '';
    const text = this.captionExpanded() ? caption : caption.slice(0, 140);
    return text.split(/(\s+)/).map((part) => ({
      text: part,
      isHashtag: part.startsWith('#') && part.length > 1,
    }));
  }

  isCaptionTruncated(): boolean {
    const caption = this.reel().caption || '';
    return caption.length > 140;
  }
}
