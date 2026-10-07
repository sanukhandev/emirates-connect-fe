import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Reel } from '../../core/reel/reel.models';
import { ReelService } from '../../core/reel/reel.service';
import { AuthService } from '../../core/auth/auth.service';
import { DesktopSidebarComponent } from '../../layout/desktop-sidebar/desktop-sidebar.component';
import { MobileHeaderComponent } from '../../layout/mobile-header/mobile-header.component';
import { MobileBottomNavComponent } from '../../layout/mobile-bottom-nav/mobile-bottom-nav.component';
import { ReelCardComponent } from './reel-card.component';

@Component({
  selector: 'app-my-reels',
  imports: [
    FormsModule,
    RouterLink,
    DesktopSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
    ReelCardComponent,
  ],
  template: `
    <div class="min-h-screen bg-canvas text-content-primary">
      <!-- Mobile Header (<= 768px) -->
      <app-mobile-header />

      <!-- Main Responsive Shell Container (max 1440px) -->
      <div class="mx-auto flex max-w-[1440px] justify-center gap-6 px-3 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-6">
        <!-- 1. Left Desktop Navigation Rail (sticky, Reels active) -->
        <div class="hidden md:block shrink-0">
          <app-desktop-sidebar (logoutClick)="logout()" />
        </div>

        <!-- 2. Main Content Column -->
        <main class="w-full max-w-[1080px] shrink min-w-0 space-y-6 pb-24 md:pb-10">
          <!-- Compact Page Header -->
          <section
            aria-label="My reels header"
            class="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border-subtle bg-surface-card p-4 sm:p-6 shadow-card"
          >
            <div>
              <div class="flex items-center gap-2">
                <a routerLink="/reels" class="text-xs font-semibold text-brand-strong hover:underline">
                  ← All Reels
                </a>
                <span class="text-content-muted">/</span>
                <span class="text-xs font-bold uppercase tracking-wider text-brand-primary">Management</span>
              </div>
              <h1 class="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
                My Published Reels
              </h1>
              <p class="mt-1 text-xs sm:text-sm text-content-secondary">
                Manage your personal short videos, track processing status, and update captions.
              </p>
            </div>

            <div class="flex items-center gap-2.5">
              <a
                routerLink="/reels"
                class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-content-primary shadow-xs transition hover:border-brand-primary hover:text-brand-primary active:scale-95"
              >
                <span>Back to feed</span>
              </a>
              <a
                routerLink="/reels/create"
                class="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-brand-hover active:scale-95"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Create reel</span>
              </a>
            </div>
          </section>

          <!-- Error Alert Banner -->
          @if (error()) {
            <section
              class="mx-auto max-w-xl rounded-3xl border border-status-danger/25 bg-status-danger/10 p-6 text-center"
              role="alert"
            >
              <p class="text-sm font-medium text-status-danger">{{ error() }}</p>
              <button
                type="button"
                class="mt-3 rounded-xl bg-brand-primary px-4 py-2 text-xs font-semibold text-white hover:bg-brand-hover"
                (click)="load()"
              >
                Retry
              </button>
            </section>
          }

          <!-- Loading State Skeletons -->
          @if (loading()) {
            <div class="flex flex-col items-center gap-8 py-2">
              <div class="h-96 w-full max-w-[420px] rounded-3xl bg-[#18181C] animate-pulse"></div>
            </div>
          }
          <!-- Empty State -->
          @else if (!reels().length) {
            <section
              class="mx-auto max-w-xl rounded-3xl border border-border-subtle bg-surface-card p-10 text-center shadow-card"
            >
              <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand-primary">
                <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                  <line x1="7" y1="2" x2="7" y2="22" />
                  <line x1="17" y1="2" x2="17" y2="22" />
                </svg>
              </div>
              <h2 class="mt-4 text-2xl font-bold tracking-tight text-content-primary">
                You haven't posted any reels yet
              </h2>
              <p class="mt-2 text-sm text-content-secondary leading-relaxed">
                Create a 9:16 short video to share your experience, company updates, or professional insights with the UAE network.
              </p>
              <a
                routerLink="/reels/create"
                class="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-brand-hover active:scale-95 transition"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Create your first reel</span>
              </a>
            </section>
          }
          <!-- Reels List -->
          @else {
            <section class="flex flex-col items-center gap-10 py-2">
              @for (reel of reels(); track reel.id) {
                <div class="w-full flex justify-center">
                  <app-reel-card
                    [reel]="reel"
                    [management]="true"
                    (edit)="startEdit($event)"
                    (remove)="askDelete($event)"
                  />
                </div>
              }
            </section>
          }

          <!-- Edit Caption Modal Dialog -->
          @if (editingReel(); as editing) {
            <div
              class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-caption-title"
            >
              <section
                class="w-full max-w-lg rounded-3xl border border-border-subtle bg-surface-card p-6 shadow-2xl space-y-4"
              >
                <div class="flex items-center justify-between border-b border-border-subtle pb-3">
                  <h2 id="edit-caption-title" class="text-lg font-bold text-content-primary">
                    Edit Reel Caption
                  </h2>
                  <button
                    type="button"
                    (click)="cancelEdit()"
                    class="rounded-xl p-1 text-content-secondary hover:bg-surface-secondary"
                    aria-label="Close edit"
                  >
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                <div>
                  <label for="edit-caption-textarea" class="block text-xs font-semibold text-content-secondary uppercase tracking-wider mb-1.5">
                    Caption
                  </label>
                  <textarea
                    id="edit-caption-textarea"
                    rows="4"
                    maxlength="2200"
                    [(ngModel)]="editCaption"
                    placeholder="Update what your network should know about this reel…"
                    class="w-full rounded-xl border border-border-subtle bg-white p-3.5 text-sm text-content-primary placeholder:text-content-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-y"
                  ></textarea>
                  <p class="mt-1 text-right text-xs text-content-muted">
                    {{ editCaption.length }}/2200
                  </p>
                </div>

                <div class="flex justify-end gap-2.5 pt-2 border-t border-border-subtle">
                  <button
                    type="button"
                    (click)="cancelEdit()"
                    class="rounded-xl border border-border-subtle px-4 py-2.5 text-xs sm:text-sm font-semibold text-content-secondary hover:border-brand-primary transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    (click)="saveCaption(editing)"
                    [disabled]="saving()"
                    class="rounded-xl bg-brand-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-brand-hover disabled:opacity-50 transition"
                  >
                    {{ saving() ? 'Saving…' : 'Save Caption' }}
                  </button>
                </div>
              </section>
            </div>
          }

          <!-- Delete Confirmation Modal Dialog -->
          @if (pendingDelete(); as reel) {
            <div
              class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-reel-title"
            >
              <section
                class="w-full max-w-md rounded-3xl border border-border-subtle bg-surface-card p-6 shadow-2xl"
              >
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-status-danger/15 text-status-danger mb-4">
                  <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </div>
                <h2 id="delete-reel-title" class="text-xl font-bold text-content-primary">
                  Delete this reel?
                </h2>
                <p class="mt-2 text-sm text-content-secondary leading-relaxed">
                  The reel and its uploaded video will be permanently removed from Emirates Connect. This action cannot be undone.
                </p>
                <div class="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    (click)="pendingDelete.set(null)"
                    class="rounded-xl border border-border-subtle px-4 py-2.5 text-xs sm:text-sm font-semibold text-content-secondary hover:border-brand-primary transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    (click)="deletePending()"
                    [disabled]="saving()"
                    class="rounded-xl bg-status-danger px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-status-danger/90 disabled:opacity-50 transition"
                  >
                    {{ saving() ? 'Deleting…' : 'Delete Reel' }}
                  </button>
                </div>
              </section>
            </div>
          }
        </main>
      </div>

      <!-- Mobile Bottom Navigation (fixed bottom, <= 768px) -->
      <app-mobile-bottom-nav />
    </div>
  `,
})
export class MyReelsComponent {
  readonly reels = signal<Reel[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly pendingDelete = signal<Reel | null>(null);
  readonly editingReel = signal<Reel | null>(null);
  editCaption = '';

  readonly auth = inject(AuthService);
  private readonly service = inject(ReelService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.service
      .getMyReels()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.reels.set(response.data);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(this.service.errorMessage(error));
          this.loading.set(false);
        },
      });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/']);
  }

  startEdit(reel: Reel): void {
    this.editingReel.set(reel);
    this.editCaption = reel.caption ?? '';
  }

  cancelEdit(): void {
    this.editingReel.set(null);
    this.editCaption = '';
  }

  saveCaption(reel: Reel): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.service
      .updateReel(reel.id, this.editCaption.trim() || null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.reels.update((items) =>
            items.map((item) => (item.id === updated.id ? updated : item))
          );
          this.cancelEdit();
          this.saving.set(false);
        },
        error: (error: unknown) => {
          this.error.set(this.service.errorMessage(error));
          this.saving.set(false);
        },
      });
  }

  askDelete(reel: Reel): void {
    this.pendingDelete.set(reel);
  }

  deletePending(): void {
    const reel = this.pendingDelete();
    if (!reel || this.saving()) return;
    this.saving.set(true);
    this.service
      .deleteReel(reel.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reels.update((items) => items.filter((item) => item.id !== reel.id));
          this.pendingDelete.set(null);
          this.saving.set(false);
        },
        error: (error: unknown) => {
          this.error.set(this.service.errorMessage(error));
          this.saving.set(false);
        },
      });
  }
}
