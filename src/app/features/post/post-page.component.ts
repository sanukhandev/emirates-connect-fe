import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PostService } from '../../core/post/post.service';
import { PostCardComponent } from '../../shared/components/post-card.component';
import { CommentSectionComponent } from '../../shared/components/comment-section.component';

@Component({ selector: 'app-post-page', imports: [RouterLink, PostCardComponent, CommentSectionComponent], template: `<main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8"><div class="mx-auto max-w-3xl"><a routerLink="/" class="text-sm font-medium text-brand-strong">← Home</a>@if (post.isLoading()) { <div class="mt-8 h-64 animate-pulse rounded-3xl bg-surface-muted"></div> } @else if (error()) { <section class="mt-8 rounded-3xl bg-surface-card p-8 text-center"><h1 class="text-2xl font-bold">Post not found</h1><p class="mt-2 text-content-secondary">This post is unavailable.</p></section> } @else if (post.currentPost(); as value) { <div class="mt-6"><app-post-card [post]="value" [showComments]="false" /><app-comment-section [postId]="value.id" /></div> }</div></main>` })
export class PostPageComponent {
  readonly post = inject(PostService);
  readonly error = signal(false);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  constructor() { const id = Number(this.route.snapshot.paramMap.get('id')); if (!Number.isInteger(id) || id < 1) { this.error.set(true); return; } this.post.getPost(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: () => this.error.set(true) }); }
}
