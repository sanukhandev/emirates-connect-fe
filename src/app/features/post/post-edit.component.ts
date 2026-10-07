import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { PostStatus } from '../../core/post/post.models';
import { PostService } from '../../core/post/post.service';
import { DesktopSidebarComponent } from '../../layout/desktop-sidebar/desktop-sidebar.component';
import { MobileHeaderComponent } from '../../layout/mobile-header/mobile-header.component';
import { MobileBottomNavComponent } from '../../layout/mobile-bottom-nav/mobile-bottom-nav.component';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-post-edit',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DesktopSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
    AppHeaderComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="min-h-screen bg-canvas text-content-primary">
      <!-- Mobile Sticky Header -->
      <app-mobile-header />

      <!-- Main Shell Container -->
      <div class="mx-auto flex max-w-[1440px] justify-center gap-6 px-3.5 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-6">
        <!-- 1. Left Desktop Sidebar -->
        <div class="hidden md:block shrink-0">
          <app-desktop-sidebar (logoutClick)="logout()" />
        </div>

        <!-- 2. Main Content Column -->
        <main class="w-full max-w-[760px] shrink min-w-0 space-y-6 pb-20 md:pb-10">
          <!-- Top Application Header -->
          <app-header />

          <!-- Loading Shimmer -->
          @if (post.isLoading() && !post.currentPost()) {
            <div class="h-80 animate-pulse rounded-3xl bg-surface-muted"></div>
          } @else if (error()) {
            <app-empty-state
              icon="info"
              title="Post unavailable"
              [description]="error()"
              actionLabel="Return to my posts"
              actionRoute="/my-posts"
            />
          } @else if (post.currentPost(); as value) {
            <!-- Edit Post Card -->
            <section class="rounded-3xl border border-border-subtle bg-surface-card p-5 sm:p-8 shadow-card">
              <!-- Header -->
              <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-5">
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Editing Update</p>
                  <h1 class="mt-0.5 text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">
                    Edit Post
                  </h1>
                  <p class="mt-1 text-xs text-content-secondary">
                    Publishing as: <strong class="text-content-primary">{{ authorName(value) }}</strong>
                  </p>
                </div>

                <a
                  routerLink="/my-posts"
                  class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-secondary px-3.5 py-2 text-xs font-semibold text-content-primary transition hover:border-brand-primary/40 hover:text-brand-primary"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  <span>My posts</span>
                </a>
              </div>

              <!-- Form -->
              <form class="mt-6 space-y-5" [formGroup]="form" (ngSubmit)="save()">
                <label class="block text-xs font-semibold text-content-primary" for="edit-post-body">
                  Post Content
                  <textarea
                    id="edit-post-body"
                    formControlName="body"
                    rows="6"
                    maxlength="5000"
                    placeholder="Share insights, announcements or thoughts…"
                    class="ec-input mt-1.5 resize-y text-sm"
                  ></textarea>
                </label>

                <div class="grid gap-4 sm:grid-cols-2">
                  <label class="block text-xs font-semibold text-content-primary" for="edit-post-status">
                    Visibility & Status
                    <select id="edit-post-status" formControlName="status" class="ec-input mt-1.5">
                      <option value="published">Published (Visible to network)</option>
                      <option value="draft">Draft (Private)</option>
                    </select>
                  </label>
                </div>

                <!-- Existing Media Gallery -->
                @if (value.media.length) {
                  <div>
                    <p class="text-xs font-semibold text-content-primary">Attached Media ({{ value.media.length }}/4)</p>
                    <div class="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      @for (media of value.media; track media.id; let index = $index) {
                        <div class="group relative overflow-hidden rounded-xl border border-border-subtle bg-surface-secondary aspect-square">
                          <img [src]="media.url" [alt]="'Post image ' + (index + 1)" class="h-full w-full object-cover" />
                          <button
                            type="button"
                            class="absolute inset-x-2 bottom-2 rounded-lg bg-status-danger/90 px-2 py-1 text-[11px] font-semibold text-white shadow-xs backdrop-blur-xs transition hover:bg-status-danger disabled:opacity-50"
                            (click)="removeMedia(media.id)"
                            [disabled]="post.isSaving() || (!value.body && value.media.length === 1)"
                          >
                            Remove
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Add More Media -->
                @if (value.media.length < 4) {
                  <div>
                    <label class="block text-xs font-semibold text-content-primary" for="add-post-media">
                      Add Media Image <span class="font-normal text-content-muted">({{ value.media.length }}/4 max)</span>
                      <input
                        id="add-post-media"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        class="mt-1.5 block w-full text-xs text-content-secondary file:mr-2.5 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                        (change)="addMedia($event)"
                        [disabled]="value.media.length >= 4 || post.isSaving()"
                      />
                    </label>
                    <p class="mt-1 text-[11px] text-content-muted">Supported: JPEG, PNG, or WebP up to 8MB.</p>
                  </div>
                }

                <!-- Alert Notice -->
                @if (message()) {
                  <p role="alert" class="rounded-xl border border-status-danger/30 bg-status-danger/10 p-3.5 text-xs font-semibold text-status-danger">
                    {{ message() }}
                  </p>
                }

                <!-- Submit Button -->
                <div class="pt-2">
                  <button
                    type="submit"
                    class="ec-btn-primary px-6 py-2.5"
                    [disabled]="post.isSaving()"
                  >
                    {{ post.isSaving() ? 'Saving changes…' : 'Save changes' }}
                  </button>
                </div>
              </form>
            </section>
          }
        </main>
      </div>

      <!-- Mobile Bottom Navigation -->
      <app-mobile-bottom-nav />
    </div>
  `,
})
export class PostEditComponent {
  readonly post = inject(PostService);
  private readonly auth = inject(AuthService);
  readonly error = signal('');
  readonly message = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    body: ['', Validators.maxLength(5000)],
    status: ['published' as PostStatus, Validators.required],
  });
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id < 1) {
      this.error.set('Post not found.');
      return;
    }
    this.post.getPost(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (value) => this.form.patchValue({ body: value.body ?? '', status: value.status }),
      error: (error: unknown) => this.error.set(this.post.errorMessage(error)),
    });
  }

  logout(): void {
    this.auth.logout();
  }

  authorName(post: NonNullable<ReturnType<PostService['currentPost']>>): string {
    return post.author.type === 'user' ? (post.author.display_name || post.author.name) : post.author.name;
  }

  save(): void {
    const value = this.post.currentPost();
    const body = this.form.controls.body.value.trim();
    if (!value || (!body && !value.media.length)) {
      this.message.set('A post must contain text or at least one image.');
      return;
    }
    this.post.updatePost(value.id, { body: body || null, status: this.form.controls.status.value }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => void this.router.navigate(['/posts', value.id]),
      error: (error: unknown) => this.message.set(this.post.errorMessage(error)),
    });
  }

  addMedia(event: Event): void {
    const value = this.post.currentPost();
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!value || !file) return;
    if (value.media.length >= 4) {
      this.message.set('A post may contain no more than 4 images.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      this.message.set('Use a JPEG, PNG, or WebP image up to 8 MB.');
      return;
    }
    this.post.addMedia(value.id, file).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: (error: unknown) => this.message.set(this.post.errorMessage(error)),
    });
  }

  removeMedia(id: number): void {
    const value = this.post.currentPost();
    if (!value) return;
    this.post.deleteMedia(value.id, id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: (error: unknown) => this.message.set(this.post.errorMessage(error)),
    });
  }
}
