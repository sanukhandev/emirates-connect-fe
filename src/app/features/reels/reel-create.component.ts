import { Component, DestroyRef, OnDestroy, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { Business } from '../../core/business/business.models';
import { BusinessService } from '../../core/business/business.service';
import { Reel } from '../../core/reel/reel.models';
import { ReelService } from '../../core/reel/reel.service';
import { AuthService } from '../../core/auth/auth.service';
import { DesktopSidebarComponent } from '../../layout/desktop-sidebar/desktop-sidebar.component';
import { MobileHeaderComponent } from '../../layout/mobile-header/mobile-header.component';
import { MobileBottomNavComponent } from '../../layout/mobile-bottom-nav/mobile-bottom-nav.component';

@Component({
  selector: 'app-reel-create',
  imports: [
    FormsModule,
    RouterLink,
    DesktopSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
  ],
  template: `
    <div class="min-h-screen bg-canvas text-content-primary">
      <app-mobile-header />

      <div class="mx-auto flex max-w-[1440px] justify-center gap-6 px-3 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-6">
        <div class="hidden md:block shrink-0">
          <app-desktop-sidebar (logoutClick)="logout()" />
        </div>

        <main class="w-full max-w-[760px] shrink min-w-0 space-y-6 pb-24 md:pb-10">
          <div class="flex items-center gap-2">
            <a routerLink="/reels" class="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-strong hover:underline">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to Reels</span>
            </a>
          </div>

          <section class="rounded-3xl border border-border-subtle bg-surface-card p-5 sm:p-8 shadow-card">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-brand-primary">Share Short Video</span>
              <h1 class="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">Create a reel</h1>
              <p class="mt-1 text-sm text-content-secondary">
                Publish a 9:16 vertical MP4 video with your Emirates Connect network.
              </p>
            </div>

            @if (error()) {
              <div class="mt-5 rounded-2xl border border-status-danger/25 bg-status-danger/10 p-4 text-sm text-status-danger" role="alert">
                {{ error() }}
              </div>
            }

            <form class="mt-6 space-y-5" (ngSubmit)="submit()">
              <div>
                <label for="author" class="mb-2 block text-xs sm:text-sm font-semibold text-content-primary uppercase tracking-wider">
                  Publish as
                </label>
                <select
                  id="author"
                  name="author"
                  class="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 text-sm text-content-primary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  [(ngModel)]="authorChoice"
                  [disabled]="busy()"
                >
                  <option value="user">My profile</option>
                  @for (business of businesses(); track business.id) {
                    <option [value]="'business:' + business.id">
                      {{ business.name }} ({{ business.current_user_role }})
                    </option>
                  }
                </select>
              </div>

              <div>
                <label for="caption" class="mb-2 block text-xs sm:text-sm font-semibold text-content-primary uppercase tracking-wider">
                  Caption <span class="text-content-muted font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  id="caption"
                  name="caption"
                  rows="4"
                  maxlength="2200"
                  class="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 text-sm text-content-primary placeholder:text-content-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-y"
                  placeholder="What should your professional network know about this video? Use #tags for topics."
                  [(ngModel)]="caption"
                  [disabled]="busy()"
                ></textarea>
                <p class="mt-1 text-right text-xs text-content-muted">{{ caption.length }}/2200</p>
              </div>

              <div>
                <label for="video" class="mb-2 block text-xs sm:text-sm font-semibold text-content-primary uppercase tracking-wider">
                  Video File
                </label>
                <input
                  id="video"
                  name="video"
                  type="file"
                  accept="video/mp4"
                  class="block w-full rounded-xl border border-border-subtle bg-white p-3 text-xs sm:text-sm text-content-primary file:mr-4 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3.5 file:py-2 file:text-xs file:font-semibold file:text-brand-strong hover:file:bg-brand-primary hover:file:text-white transition"
                  (change)="selectFile($event)"
                  [disabled]="busy()"
                />
                <p class="mt-2 text-xs text-content-muted">
                  MP4 format only, maximum 100 MB. 9:16 vertical format recommended.
                </p>

                @if (file(); as selected) {
                  <div class="mt-4 rounded-2xl border border-border-subtle bg-surface-muted p-4 text-sm">
                    <div class="flex items-center justify-between">
                      <p class="truncate font-semibold text-content-primary">{{ selected.name }}</p>
                      <p class="text-xs text-content-secondary shrink-0 ml-2">
                        {{ sizeLabel(selected.size) }}
                      </p>
                    </div>
                    <video
                      class="mt-3 max-h-80 w-full rounded-xl bg-[#111114] object-contain shadow-xs"
                      controls
                      muted
                      playsinline
                      [src]="previewUrl() || undefined"
                      aria-label="Selected video preview"
                    ></video>
                  </div>
                }
              </div>

              @if (createdReel(); as created) {
                <div class="rounded-2xl border border-status-success/25 bg-status-success/10 p-4 text-sm text-content-primary">
                  <p class="font-bold text-status-success">Reel uploaded successfully.</p>
                  <p class="mt-1 text-xs text-content-secondary">
                    {{ created.status === 'published' ? 'Your reel is published and live.' : 'Your reel is currently being encoded.' }}
                  </p>
                </div>
              }

              <div class="flex flex-wrap justify-end gap-3 pt-3 border-t border-border-subtle">
                <a
                  routerLink="/reels"
                  class="rounded-xl border border-border-subtle px-5 py-3 text-xs sm:text-sm font-semibold text-content-secondary hover:border-brand-primary transition"
                >
                  Cancel
                </a>
                <button
                  type="submit"
                  class="rounded-xl bg-brand-primary px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-brand-hover disabled:opacity-50 active:scale-95"
                  [disabled]="busy() || !file()"
                >
                  {{ busy() ? 'Uploading video…' : createdReel() ? 'Retry upload' : 'Publish reel' }}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>

      <app-mobile-bottom-nav />
    </div>
  `,
})
export class ReelCreateComponent implements OnDestroy {
  readonly businesses = signal<Business[]>([]);
  readonly file = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly createdReel = signal<Reel | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);
  authorChoice = 'user';
  caption = '';

  readonly auth = inject(AuthService);
  private readonly businessService = inject(BusinessService);
  private readonly service = inject(ReelService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.businessService
      .getMyBusinesses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (response) => this.businesses.set(response.data) });
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0] ?? null;
    this.error.set('');
    this.revokePreview();
    if (!selected) {
      this.file.set(null);
      return;
    }
    if (selected.type !== 'video/mp4') {
      this.file.set(null);
      this.error.set('Please choose an MP4 video.');
      input.value = '';
      return;
    }
    if (selected.size > 100 * 1024 * 1024) {
      this.file.set(null);
      this.error.set('The video must be 100 MB or smaller.');
      input.value = '';
      return;
    }
    this.file.set(selected);
    this.previewUrl.set(URL.createObjectURL(selected));
  }

  submit(): void {
    const selected = this.file();
    if (!selected || this.busy()) return;
    this.error.set('');
    this.busy.set(true);
    const existing = this.createdReel();
    const create$ = existing
      ? this.service.uploadVideo(existing.id, selected)
      : this.service
          .createReel({
            author_type: this.authorChoice === 'user' ? 'user' : 'business',
            ...(this.authorChoice === 'user'
              ? {}
              : { business_id: Number(this.authorChoice.split(':')[1]) }),
            caption: this.caption.trim() || null,
          })
          .pipe(
            switchMap((reel) => {
              this.createdReel.set(reel);
              return this.service.uploadVideo(reel.id, selected);
            })
          );

    create$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (reel) => {
        this.busy.set(false);
        this.createdReel.set(reel);
        if (reel.status === 'published') void this.router.navigate(['/reels', reel.id]);
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.error.set(this.service.errorMessage(error));
      },
    });
  }

  sizeLabel(bytes: number): string {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/']);
  }

  private revokePreview(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(null);
  }
}
