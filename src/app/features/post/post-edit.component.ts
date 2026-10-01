import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { PostStatus } from '../../core/post/post.models';
import { PostService } from '../../core/post/post.service';

@Component({
  selector: 'app-post-edit',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8">
      <div class="mx-auto max-w-3xl">
        <a routerLink="/my-posts" class="text-sm font-medium text-brand-strong">← My posts</a>
        @if (error()) {
          <section class="mt-8 rounded-3xl bg-surface-card p-8 text-center"><h1 class="text-2xl font-bold">Post unavailable</h1><p class="mt-2 text-content-secondary">{{ error() }}</p></section>
        } @else if (post.currentPost(); as value) {
          <section class="mt-6 rounded-3xl bg-surface-card p-6 shadow-card">
            <h1 class="text-2xl font-bold">Edit post</h1>
            <p class="mt-2 text-sm text-content-secondary">Author: {{ authorName(value) }}. Author identity cannot be changed.</p>
            <form class="mt-6 space-y-5" [formGroup]="form" (ngSubmit)="save()">
              <label class="block text-sm font-medium" for="edit-post-body">Post text<textarea id="edit-post-body" formControlName="body" rows="6" maxlength="5000" class="auth-input mt-2 resize-y"></textarea></label>
              <label class="block text-sm font-medium" for="edit-post-status">Status<select id="edit-post-status" formControlName="status" class="auth-input mt-2"><option value="published">Published</option><option value="draft">Draft</option></select></label>
              @if (value.media.length) { <div class="grid grid-cols-2 gap-3">@for (media of value.media; track media.id; let index = $index) { <div><img [src]="media.url" [alt]="'Post image ' + (index + 1)" class="h-40 w-full rounded-2xl object-cover" /><button type="button" class="mt-2 rounded-xl border border-status-danger/40 px-3 py-2 text-sm text-status-danger" (click)="removeMedia(media.id)" [disabled]="post.isSaving() || (!value.body && value.media.length === 1)">Remove image</button></div> }</div> }
              <label class="block text-sm font-medium" for="add-post-media">Add image <span class="font-normal text-content-muted">{{ value.media.length }}/4</span><input id="add-post-media" type="file" accept="image/jpeg,image/png,image/webp" class="mt-2 block w-full text-xs" (change)="addMedia($event)" [disabled]="value.media.length >= 4 || post.isSaving()" /></label>
              <p class="text-sm text-content-muted">A post must contain text or at least one image.</p>
              @if (message()) { <p role="alert" class="text-sm text-status-danger">{{ message() }}</p> }
              <button type="submit" class="auth-button max-w-xs" [disabled]="post.isSaving()">{{ post.isSaving() ? 'Saving…' : 'Save changes' }}</button>
            </form>
          </section>
        }
      </div>
    </main>
  `,
})
export class PostEditComponent {
  readonly post = inject(PostService);
  readonly error = signal('');
  readonly message = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({ body: ['', Validators.maxLength(5000)], status: ['published' as PostStatus, Validators.required] });
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id < 1) { this.error.set('Post not found.'); return; }
    this.post.getPost(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (value) => this.form.patchValue({ body: value.body ?? '', status: value.status }), error: (error: unknown) => this.error.set(this.post.errorMessage(error)) });
  }

  authorName(post: NonNullable<ReturnType<PostService['currentPost']>>): string { return post.author.type === 'user' ? post.author.display_name || post.author.name : post.author.name; }
  save(): void { const value = this.post.currentPost(); const body = this.form.controls.body.value.trim(); if (!value || (!body && !value.media.length)) { this.message.set('Add text or keep at least one image.'); return; } this.post.updatePost(value.id, { body: body || null, status: this.form.controls.status.value }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => void this.router.navigate(['/posts', value.id]), error: (error: unknown) => this.message.set(this.post.errorMessage(error)) }); }
  addMedia(event: Event): void { const value = this.post.currentPost(); const file = (event.target as HTMLInputElement).files?.[0]; if (!value || !file) return; if (value.media.length >= 4) { this.message.set('A post may contain no more than 4 images.'); return; } if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) { this.message.set('Use a JPEG, PNG, or WebP image up to 8 MB.'); return; } this.post.addMedia(value.id, file).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: (error: unknown) => this.message.set(this.post.errorMessage(error)) }); }
  removeMedia(id: number): void { const value = this.post.currentPost(); if (!value) return; this.post.deleteMedia(value.id, id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: (error: unknown) => this.message.set(this.post.errorMessage(error)) }); }
}
