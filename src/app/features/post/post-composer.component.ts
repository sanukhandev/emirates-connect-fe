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
    <section class="rounded-3xl bg-surface-card p-5 shadow-card sm:p-6">
      <h2 class="text-xl font-bold">Create a post</h2>
      <p class="mt-1 text-sm text-content-secondary">Posting as {{ authorLabel() }}</p>
      <form class="mt-5 space-y-4" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label class="block text-sm font-medium" for="post-author">Posting identity<select id="post-author" formControlName="author" class="auth-input mt-2"><option value="user">My Profile</option>@for (business of businesses(); track business.id) { <option [value]="'business:' + business.id">{{ business.name }} ({{ business.current_user_role }})</option> }</select></label>
        <label class="block text-sm font-medium" for="post-body">Post text <span class="font-normal text-content-muted">Optional when images are attached</span><textarea id="post-body" formControlName="body" rows="5" maxlength="5000" class="auth-input mt-2 resize-y" placeholder="Share an update..."></textarea><span class="mt-1 block text-right text-xs text-content-muted">{{ form.controls.body.value.length }}/5000</span></label>
        <label class="block text-sm font-medium" for="post-images">Images <span class="font-normal text-content-muted">JPEG, PNG, or WebP · up to 4 files, 8 MB each</span><input id="post-images" class="mt-2 block w-full text-xs" type="file" accept="image/jpeg,image/png,image/webp" multiple (change)="selectFiles($event)" /></label>
        @if (files().length) { <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">@for (file of files(); track file.name + file.lastModified; let index = $index) { <div class="relative overflow-hidden rounded-2xl border border-border-subtle"><img [src]="previews()[index]" [alt]="'Selected image ' + (index + 1)" class="h-28 w-full object-cover" /><button type="button" class="absolute right-2 top-2 rounded-full bg-content-primary/80 px-2 py-1 text-xs text-white" (click)="removeFile(index)">Remove</button></div> }</div> }
        @if (message()) { <p role="alert" aria-live="polite" class="rounded-2xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger">{{ message() }}</p> }
        <div class="flex flex-wrap gap-3"><button type="button" class="rounded-xl border border-border-subtle px-4 py-3 text-sm font-medium" [disabled]="post.isSaving()" (click)="submit('draft')">Save draft</button><button type="submit" class="auth-button max-w-xs" [disabled]="post.isSaving()">{{ post.isSaving() ? 'Publishing…' : 'Publish' }}</button></div>
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
  readonly form = inject(FormBuilder).nonNullable.group({ author: ['user', Validators.required], body: ['', Validators.maxLength(5000)] });
  private readonly destroyRef = inject(DestroyRef);

  constructor() { this.business.getMyBusinesses().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (response) => this.businesses.set(response.data) }); }

  authorLabel(): string {
    const value = this.form.controls.author.value;
    if (value === 'user') return this.auth.currentUser()?.profile?.display_name || this.auth.currentUser()?.name || 'My Profile';
    const id = Number(value.split(':')[1]);
    return this.businesses().find((business) => business.id === id)?.name || 'Selected business';
  }

  selectFiles(event: Event): void {
    const selected = Array.from((event.target as HTMLInputElement).files ?? []);
    if (selected.length > 4 || selected.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024)) { this.message.set('Choose up to 4 JPEG, PNG, or WebP images no larger than 8 MB each.'); return; }
    this.clearPreviews(); this.files.set(selected); this.previews.set(selected.map((file) => URL.createObjectURL(file))); this.message.set('');
  }

  removeFile(index: number): void { const files = this.files().filter((_, position) => position !== index); this.clearPreviews(); this.files.set(files); this.previews.set(files.map((file) => URL.createObjectURL(file))); }

  submit(status: PostStatus = 'published'): void {
    const body = this.form.controls.body.value.trim();
    if (!body && !this.files().length) { this.message.set('Add text or at least one image.'); return; }
    const author = this.form.controls.author.value as PostAuthorType | `business:${number}`;
    const payload: CreatePostPayload = author === 'user' ? { author_type: 'user', body: body || null, status } : { author_type: 'business', business_id: Number(author.split(':')[1]), body: body || null, status };
    this.message.set('');
    this.post.createPost(payload, this.files()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (post) => { this.clearPreviews(); this.files.set([]); this.form.reset({ author, body: '' }); this.saved.emit(post); }, error: (error: unknown) => this.message.set(this.post.errorMessage(error)) });
  }

  ngOnDestroy(): void { this.clearPreviews(); }

  private clearPreviews(): void { this.previews().forEach((preview) => URL.revokeObjectURL(preview)); this.previews.set([]); }
}
