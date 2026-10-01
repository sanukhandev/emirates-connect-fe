import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { Post } from '../../core/post/post.models';
import { PostService } from '../../core/post/post.service';
import { PostCardComponent } from '../../shared/components/post-card.component';
import { PostComposerComponent } from './post-composer.component';

@Component({
  selector: 'app-my-posts',
  imports: [RouterLink, PostCardComponent, PostComposerComponent],
  template: `
    <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8"><div class="mx-auto max-w-5xl"><a routerLink="/profile" class="text-sm font-medium text-brand-strong">← Profile</a><header class="mt-4 border-b border-border-subtle pb-5"><h1 class="text-3xl font-bold">My posts</h1><p class="mt-2 text-content-secondary">Manage your published updates and drafts.</p></header><div class="mt-6"><app-post-composer (saved)="saved($event)" /></div>@if (message()) { <p role="alert" class="mt-4 text-sm text-status-danger">{{ message() }}</p> }<section class="mt-6 space-y-4">@if (post.isLoading()) { <div class="h-40 animate-pulse rounded-3xl bg-surface-muted"></div> } @else if (!post.myPosts().length) { <div class="rounded-3xl bg-surface-card p-8 text-center text-content-secondary">Your posts will appear here.</div> } @else { @for (item of post.myPosts(); track item.id) { <app-post-card [post]="item" [management]="true" (edit)="edit(item)" (remove)="remove(item)" /> } }</section>@if (post.myPostsMeta(); as meta) { <nav class="mt-6 flex items-center justify-between text-sm" aria-label="Post pages"><button type="button" class="rounded-xl border border-border-subtle px-4 py-2 disabled:opacity-50" (click)="load(meta.current_page - 1)" [disabled]="meta.current_page <= 1 || post.isLoading()">Previous</button><span>Page {{ meta.current_page }} of {{ meta.last_page }}</span><button type="button" class="rounded-xl border border-border-subtle px-4 py-2 disabled:opacity-50" (click)="load(meta.current_page + 1)" [disabled]="meta.current_page >= meta.last_page || post.isLoading()">Next</button></nav> }</div></main>
    @if (pending()) { <div class="fixed inset-0 z-10 flex items-center justify-center bg-content-primary/40 px-4"><section role="dialog" aria-modal="true" aria-labelledby="delete-post-title" class="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-card"><h2 id="delete-post-title" class="text-xl font-bold">Delete this post?</h2><p class="mt-2 text-sm text-content-secondary">This post will be removed from public listings.</p><div class="mt-6 flex justify-end gap-3"><button type="button" class="rounded-xl border border-border-subtle px-4 py-3 text-sm" (click)="pending.set(null)">Cancel</button><button type="button" class="rounded-xl bg-status-danger px-4 py-3 text-sm text-white" (click)="confirmRemove()">Delete</button></div></section></div> }
  `,
})
export class MyPostsComponent {
  readonly post = inject(PostService);
  readonly pending = signal<Post | null>(null);
  readonly message = signal('');
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() { this.load(); }
  load(page = 1): void { this.post.getMyPosts(page).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: (error: unknown) => this.message.set(this.post.errorMessage(error)) }); }
  saved(post: Post): void { if (post.author.type === 'business') void this.router.navigate(['/businesses', post.author.slug]); else this.load(); }
  edit(post: Post): void { void this.router.navigate(['/posts', post.id, 'edit']); }
  remove(post: Post): void { this.pending.set(post); }
  confirmRemove(): void { const post = this.pending(); if (!post) return; this.post.deletePost(post.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.pending.set(null); this.load(); }, error: (error: unknown) => { this.pending.set(null); this.message.set(this.post.errorMessage(error)); } }); }
}
