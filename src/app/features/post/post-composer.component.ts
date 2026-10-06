import { Component, DestroyRef, EventEmitter, OnDestroy, Output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { BusinessService } from '../../core/business/business.service';
import { CreatePostPayload, Post, PostAuthorType, PostStatus } from '../../core/post/post.models';
import { PostService } from '../../core/post/post.service';

@Component({
  selector: 'app-post-composer',
  imports: [ReactiveFormsModule],
  template: `
    <section
      class="rounded-2xl border border-border-subtle bg-surface-card p-4 sm:p-5 shadow-card transition-all duration-200"
      [class.ring-2]="isExpanded()"
      [class.ring-brand-500/20]="isExpanded()"
    >
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <!-- Header / Identity row -->
        <div class="flex items-start justify-between gap-3 pb-3">
          <div class="relative flex items-center gap-3">
            <!-- Clickable DP container: Post as feature triggers when clicked on DP -->
            <label
              for="post-author"
              class="group relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-brand-100 font-bold text-brand-700 transition hover:ring-2 hover:ring-brand-500/50"
              title="Click DP to switch posting identity"
            >
              @if (currentAvatar()) {
                <img [src]="currentAvatar()" [alt]="authorLabel()" class="h-full w-full object-cover" />
              } @else {
                {{ initials(authorLabel()) }}
              }
              <span class="absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-500 text-white shadow-xs transition group-hover:scale-110">
                <svg class="h-2 w-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>

              <select
                id="post-author"
                formControlName="author"
                class="absolute inset-0 h-full w-full cursor-pointer opacity-[0.01]"
                aria-label="Posting identity (click DP to switch)"
              >
                <option value="user">My Profile ({{ userDisplayName() }})</option>
                @for (business of businesses(); track business.id) {
                  <option [value]="'business:' + business.id">{{ business.name }} ({{ business.current_user_role }})</option>
                }
              </select>
            </label>

            <div class="min-w-0">
              <p class="truncate text-sm font-bold text-content-primary leading-tight">{{ authorLabel() }}</p>
              <label
                for="post-author"
                class="cursor-pointer text-[11px] text-content-muted mt-0.5 inline-flex items-center gap-1 hover:text-brand-600 transition-colors"
                title="Click DP to switch posting identity"
              >
                <span>{{ isUserAuthor() ? 'Personal account' : 'Business page' }}</span>
                <span>·</span>
                <span class="font-medium text-brand-600">Click DP to switch</span>
              </label>
            </div>
          </div>

          @if (isExpanded()) {
            <button
              type="button"
              (click)="isExpanded.set(false)"
              class="rounded-lg p-1 text-content-muted hover:bg-surface-secondary hover:text-content-primary"
              aria-label="Collapse composer"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          }
        </div>

        <!-- Main text input area -->
        <div class="mt-1">
          <label class="sr-only" for="post-body">Post text</label>
          <textarea
            id="post-body"
            formControlName="body"
            (focus)="isExpanded.set(true)"
            [rows]="isExpanded() ? 4 : 2"
            maxlength="5000"
            class="w-full resize-none rounded-xl border border-transparent bg-surface-secondary/70 p-3 text-sm text-content-primary placeholder:text-content-muted transition-all focus:border-brand-500/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="Share an update with the UAE community..."
          ></textarea>
        </div>

        <!-- Image Previews -->
        @if (files().length) {
          <div class="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            @for (file of files(); track file.name + file.lastModified; let index = $index) {
              <div class="relative overflow-hidden rounded-xl border border-border-subtle bg-surface-secondary">
                <img [src]="previews()[index]" [alt]="'Selected image ' + (index + 1)" class="h-24 w-full object-cover" />
                <button
                  type="button"
                  class="absolute right-1.5 top-1.5 rounded-full bg-content-primary/75 p-1 text-white hover:bg-content-primary focus-visible:outline-none"
                  (click)="removeFile(index)"
                  aria-label="Remove image"
                >
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            }
          </div>
        }

        <!-- Error feedback -->
        @if (message()) {
          <p role="alert" aria-live="polite" class="mt-3 rounded-xl bg-status-danger/10 px-3.5 py-2 text-xs font-medium text-status-danger">
            {{ message() }}
          </p>
        }

        <!-- Quick Actions & Submit row -->
        <div class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3">
          <!-- Attachment shortcuts -->
          <div class="flex items-center gap-1">
            <label
              for="post-images"
              class="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-secondary hover:text-brand-600"
              title="Add photos"
            >
              <svg class="h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Photo</span>
              <input
                id="post-images"
                class="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                (change)="selectFiles($event)"
              />
            </label>

            <button
              type="button"
              (click)="isExpanded.set(true)"
              class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-secondary hover:text-brand-600"
              title="Add video"
            >
              <svg class="h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <span>Video</span>
            </button>

            <button
              type="button"
              (click)="isExpanded.set(true)"
              class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-secondary hover:text-brand-600"
              title="Add article"
            >
              <svg class="h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>Article</span>
            </button>

            <button
              type="button"
              (click)="isExpanded.set(true)"
              class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-secondary hover:text-brand-600"
              title="Add poll"
            >
              <svg class="h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>Poll</span>
            </button>
          </div>

          <!-- Buttons -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-xl border border-border-subtle bg-white px-3 py-1.5 text-xs font-medium text-content-secondary hover:bg-surface-secondary hover:text-content-primary focus-visible:outline-none"
              [disabled]="post.isSaving()"
              (click)="submit('draft')"
            >
              Save draft
            </button>

            <button
              type="submit"
              class="rounded-xl bg-brand-500 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-600 active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              [disabled]="post.isSaving()"
            >
              {{ post.isSaving() ? 'Publishing…' : 'Publish' }}
            </button>
          </div>
        </div>
      </form>
    </section>
  `,
})
export class PostComposerComponent implements OnDestroy {
  @Output() readonly saved = new EventEmitter<Post>();

  readonly post = inject(PostService);
  readonly auth = inject(AuthService);
  readonly business = inject(BusinessService);

  readonly businesses = signal(this.business.myBusinesses());
  readonly files = signal<File[]>([]);
  readonly previews = signal<string[]>([]);
  readonly message = signal('');
  readonly isExpanded = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group({
    author: ['user', Validators.required],
    body: ['', Validators.maxLength(5000)],
  });

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.business
      .getMyBusinesses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.businesses.set(response.data),
      });
  }

  expand(): void {
    this.isExpanded.set(true);
  }

  userDisplayName(): string {
    return this.auth.currentUser()?.profile?.display_name || this.auth.currentUser()?.name || 'Sanu Khan';
  }

  userAvatar(): string | null {
    return this.auth.currentUser()?.profile?.avatar_url || null;
  }

  isUserAuthor(): boolean {
    return this.form.controls.author.value === 'user';
  }

  currentAvatar(): string | null {
    const value = this.form.controls.author.value;
    if (value === 'user') return this.userAvatar();
    const id = Number(value.split(':')[1]);
    const b = this.businesses().find((item) => item.id === id);
    return b?.logo_url || null;
  }

  authorLabel(): string {
    const value = this.form.controls.author.value;
    if (value === 'user') return this.userDisplayName();
    const id = Number(value.split(':')[1]);
    return this.businesses().find((b) => b.id === id)?.name || 'Selected business';
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  selectFiles(event: Event): void {
    const selected = Array.from((event.target as HTMLInputElement).files ?? []);
    if (
      selected.length > 4 ||
      selected.some(
        (file) =>
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
          file.size > 8 * 1024 * 1024,
      )
    ) {
      this.message.set('Choose up to 4 JPEG, PNG, or WebP images no larger than 8 MB each.');
      return;
    }
    this.clearPreviews();
    this.files.set(selected);
    this.previews.set(selected.map((file) => URL.createObjectURL(file)));
    this.message.set('');
    this.isExpanded.set(true);
  }

  removeFile(index: number): void {
    const nextFiles = this.files().filter((_, i) => i !== index);
    this.clearPreviews();
    this.files.set(nextFiles);
    this.previews.set(nextFiles.map((file) => URL.createObjectURL(file)));
  }

  submit(status: PostStatus = 'published'): void {
    const body = this.form.controls.body.value.trim();
    if (!body && !this.files().length) {
      this.message.set('Add text or at least one image.');
      return;
    }

    const author = this.form.controls.author.value as PostAuthorType | `business:${number}`;
    const payload: CreatePostPayload =
      author === 'user'
        ? { author_type: 'user', body: body || null, status }
        : {
            author_type: 'business',
            business_id: Number(author.split(':')[1]),
            body: body || null,
            status,
          };

    this.message.set('');
    this.post
      .createPost(payload, this.files())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (post) => {
          this.clearPreviews();
          this.files.set([]);
          this.form.reset({ author, body: '' });
          this.isExpanded.set(false);
          this.saved.emit(post);
        },
        error: (error: unknown) => {
          this.message.set(this.post.errorMessage(error));
        },
      });
  }

  ngOnDestroy(): void {
    this.clearPreviews();
  }

  private clearPreviews(): void {
    this.previews().forEach((preview) => URL.revokeObjectURL(preview));
    this.previews.set([]);
  }
}
