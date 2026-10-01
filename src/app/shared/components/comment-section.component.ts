import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, Input, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthStateService } from '../../core/auth/auth-state.service';
import { AuthService } from '../../core/auth/auth.service';
import { BusinessService } from '../../core/business/business.service';
import { Comment, CommentReply, CreateCommentPayload } from '../../core/comment/comment.models';
import { CommentService } from '../../core/comment/comment.service';
import { PostAuthor } from '../../core/post/post.models';

@Component({
  selector: 'app-comment-section',
  imports: [DatePipe, NgTemplateOutlet, ReactiveFormsModule, RouterLink],
  template: `
      <section class="mt-5 border-t border-border-subtle pt-5" [attr.data-post-comments]="postId" aria-label="Comments">
      <h3 class="text-lg font-semibold">Comments</h3>
      @if (loading()) { <p class="mt-4 text-sm text-content-secondary" role="status">Loading comments…</p> }
      @else if (error()) { <div class="mt-4 rounded-2xl bg-status-danger/10 p-4 text-sm text-status-danger" role="alert"><p>{{ error() }}</p><button type="button" class="mt-3 rounded-xl border border-status-danger/30 px-3 py-2 font-medium" (click)="loadInitial()">Retry</button></div> }
      @else if (!comments().length) { <p class="mt-4 text-sm text-content-secondary">Be the first to comment.</p> }
      @else { <ol class="mt-4 space-y-5" aria-label="Comment thread">@for (comment of comments(); track comment.id) { <li class="space-y-3" [attr.data-comment-id]="comment.id"><ng-container *ngTemplateOutlet="commentTemplate; context: { item: comment, reply: false }" /><ol class="ml-4 space-y-3 border-l-2 border-border-subtle pl-4 sm:ml-8">@for (reply of comment.replies; track reply.id) { <li [attr.data-comment-id]="reply.id"><ng-container *ngTemplateOutlet="commentTemplate; context: { item: reply, reply: true }" /></li> }</ol>@if (replyTo() === comment.id) { <form class="ml-4 rounded-2xl bg-surface-muted p-4 sm:ml-8" [formGroup]="form" (ngSubmit)="submit()" novalidate><p class="text-sm font-medium">Replying to {{ authorName(comment.author) }}</p><ng-container *ngTemplateOutlet="composerFields; context: { reply: true }" /></form> }</li> }</ol> }
      @if (!loading() && !error() && hasMore()) { @if (loadMoreError()) { <div class="mt-4 text-sm text-status-danger" role="alert"><span>{{ loadMoreError() }}</span> <button type="button" class="ml-2 underline" (click)="loadMore()">Retry</button></div> } @else { <button type="button" class="mt-5 rounded-xl border border-border-subtle px-4 py-3 text-sm font-medium" (click)="loadMore()" [disabled]="loadingMore()">{{ loadingMore() ? 'Loading…' : 'Load more comments' }}</button> } }
      @if (canComment()) { @if (!replyTo()) { <form class="mt-5 rounded-2xl bg-surface-muted p-4" [formGroup]="form" (ngSubmit)="submit()" novalidate><ng-container *ngTemplateOutlet="composerFields; context: { reply: false }" /></form> } } @else if (auth.currentUser()) { <p class="mt-5 text-sm text-content-secondary">Comments are unavailable for this post.</p> }
      @if (pendingDelete(); as pending) { <div class="fixed inset-0 z-20 flex items-center justify-center bg-content-primary/40 px-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="delete-comment-title-{{ postId }}" class="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-card"><h4 id="delete-comment-title-{{ postId }}" class="text-xl font-bold">Delete {{ pending.reply ? 'reply' : 'comment' }}?</h4><p class="mt-2 text-sm text-content-secondary">This cannot be undone.</p><div class="mt-6 flex justify-end gap-3"><button type="button" class="rounded-xl border border-border-subtle px-4 py-3 text-sm" (click)="cancelDelete()">Cancel</button><button type="button" class="rounded-xl bg-status-danger px-4 py-3 text-sm font-medium text-white" (click)="confirmDelete()" [disabled]="saving()">{{ saving() ? 'Deleting…' : 'Delete' }}</button></div></section></div> }
    </section>
    <ng-template #composerFields let-reply="reply">
      <label class="block text-sm font-medium" for="comment-author-{{ postId }}-{{ reply ? 'reply' : 'top' }}">Commenting as<select [id]="'comment-author-' + postId + '-' + (reply ? 'reply' : 'top')" formControlName="author" (change)="updateAuthor($event)" class="auth-input mt-2"><option value="user">My Profile</option>@for (business of businesses(); track business.id) { <option [value]="'business:' + business.id">{{ business.name }} ({{ business.current_user_role }})</option> }</select></label>
      <label class="mt-3 block text-sm font-medium" for="comment-body-{{ postId }}-{{ reply ? 'reply' : 'top' }}">{{ reply ? 'Reply' : 'Comment' }}<textarea [id]="'comment-body-' + postId + '-' + (reply ? 'reply' : 'top')" formControlName="body" (input)="updateBody($event)" maxlength="2000" rows="3" class="auth-input mt-2 resize-y" placeholder="Write something thoughtful…"></textarea><span class="mt-1 block text-right text-xs text-content-muted">{{ form.controls.body.value.length }}/2000</span></label>
      @if (message()) { <p class="mt-3 text-sm text-status-danger" role="alert" aria-live="polite">{{ message() }}</p> }
      <div class="mt-3 flex flex-wrap gap-2"><button type="submit" class="auth-button max-w-xs" [disabled]="saving()">{{ saving() ? (reply ? 'Replying…' : 'Posting…') : (reply ? 'Reply' : 'Comment') }}</button>@if (reply) { <button type="button" class="rounded-xl border border-border-subtle px-4 py-3 text-sm" (click)="cancelReply()">Cancel</button> }</div>
    </ng-template>
    <ng-template #commentTemplate let-item="item" let-reply="reply">
      <article class="flex gap-3" [class.opacity-80]="editingId() === item.id"><div class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-soft text-sm font-bold text-brand-strong">@if (authorAvatar(item.author); as avatar) { <img [src]="avatar" [alt]="authorName(item.author) + ' profile photo'" class="h-full w-full object-cover" /> } @else { {{ initials(authorName(item.author)) }} }</div><div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2"><a [routerLink]="authorLink(item.author)" class="font-medium hover:text-brand-strong">{{ authorName(item.author) }}</a>@if (item.author.type === 'business') { <span class="rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand-strong">Business</span> }<time class="text-xs text-content-muted" [attr.datetime]="item.created_at">{{ item.created_at | date:'medium' }}</time></div>@if (editingId() === item.id) { <form class="mt-2" [formGroup]="editForm" (ngSubmit)="saveEdit(item.id)" novalidate><label class="sr-only" [for]="'edit-comment-' + item.id">Edit comment</label><textarea [id]="'edit-comment-' + item.id" formControlName="body" maxlength="2000" rows="3" class="auth-input resize-y"></textarea><div class="mt-2 flex gap-2"><button type="submit" class="rounded-xl bg-brand-primary px-3 py-2 text-sm font-medium text-white" [disabled]="saving()">Save</button><button type="button" class="rounded-xl border border-border-subtle px-3 py-2 text-sm" (click)="cancelEdit()">Cancel</button></div></form> } @else { <p class="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-content-secondary">{{ item.body }}</p> }<div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-content-muted">@if (!reply) { <button type="button" class="font-medium text-brand-strong" (click)="startReply(item.id)">Reply</button> } @if (canManage(item.author)) { <button type="button" class="font-medium text-brand-strong" (click)="startEdit(item)">Edit</button><button type="button" class="font-medium text-status-danger" (click)="askDelete(item.id, reply)">Delete</button> } @if (!reply && item.replies_count) { <span>{{ item.replies_count }} {{ item.replies_count === 1 ? 'reply' : 'replies' }}</span> }</div></div></article>
    </ng-template>
  `,
})
export class CommentSectionComponent implements OnInit {
  @Input({ required: true }) postId!: number;
  @Input() autoLoad = true;

  readonly comments = signal<Comment[]>([]);
  private readonly business = inject(BusinessService);
  readonly businesses = this.business.myBusinesses;
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly loadMoreError = signal('');
  readonly message = signal('');
  readonly replyTo = signal<number | null>(null);
  readonly editingId = signal<number | null>(null);
  readonly pendingDelete = signal<{ id: number; reply: boolean } | null>(null);
  readonly hasMore = signal(false);
  readonly form = inject(FormBuilder).nonNullable.group({ author: ['user', Validators.required], body: ['', [Validators.required, Validators.maxLength(2000)]] });
  readonly editForm = inject(FormBuilder).nonNullable.group({ body: ['', [Validators.required, Validators.maxLength(2000)]] });
  readonly auth = inject(AuthStateService);
  private readonly authService = inject(AuthService);
  private readonly service = inject(CommentService);
  private readonly destroyRef = inject(DestroyRef);
  private currentPage = 0;

  ngOnInit(): void {
    this.authService.initialize().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { if (this.auth.currentUser()) this.business.getMyBusinesses().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: () => undefined }); } });
    if (this.autoLoad) this.loadInitial();
  }

  loadInitial(): void {
    if (this.loading()) return;
    this.loading.set(true); this.error.set(''); this.loadMoreError.set(''); this.currentPage = 0; this.comments.set([]);
    this.service.getComments(this.postId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (response) => { this.currentPage = response.meta.current_page; this.hasMore.set(response.meta.current_page < response.meta.last_page); this.comments.set(response.data); this.loading.set(false); }, error: (error: unknown) => { this.error.set('Unable to load comments.'); this.loading.set(false); this.hasMore.set(false); this.message.set(this.service.errorMessage(error)); } });
  }

  loadMore(): void {
    if (this.loadingMore() || !this.hasMore()) return;
    this.loadingMore.set(true); this.loadMoreError.set('');
    this.service.getComments(this.postId, this.currentPage + 1).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (response) => { const ids = new Set(this.comments().map((item) => item.id)); this.comments.update((items) => [...items, ...response.data.filter((item) => !ids.has(item.id))]); this.currentPage = response.meta.current_page; this.hasMore.set(response.meta.current_page < response.meta.last_page); this.loadingMore.set(false); }, error: (error: unknown) => { this.loadMoreError.set(this.service.errorMessage(error)); this.loadingMore.set(false); } });
  }

  canComment(): boolean { return this.auth.currentUser() !== null; }
  updateAuthor(event: Event): void { if (event.target instanceof HTMLSelectElement) this.form.controls.author.setValue(event.target.value); }
  updateBody(event: Event): void { if (event.target instanceof HTMLTextAreaElement) this.form.controls.body.setValue(event.target.value); }
  startReply(id: number): void { this.replyTo.set(id); this.message.set(''); this.form.reset({ author: 'user', body: '' }); }
  cancelReply(): void { this.replyTo.set(null); this.form.reset({ author: 'user', body: '' }); }
  startEdit(comment: Comment | CommentReply): void { this.editingId.set(comment.id); this.editForm.setValue({ body: comment.body }); this.message.set(''); }
  cancelEdit(): void { this.editingId.set(null); }

  submit(): void {
    const body = this.form.controls.body.value.trim();
    if (!body || this.saving()) { this.message.set('Write a comment before submitting.'); return; }
    const payload = this.authorPayload(body); const replyId = this.replyTo(); this.saving.set(true); this.message.set('');
    const request = replyId ? this.service.createReply(replyId, payload) : this.service.createComment(this.postId, payload);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (comment) => { if (replyId) this.appendReply(replyId, comment); else this.appendComment(comment); this.saving.set(false); this.form.reset({ author: this.form.controls.author.value, body: '' }); this.replyTo.set(null); }, error: (error: unknown) => { this.saving.set(false); this.message.set(this.service.errorMessage(error)); } });
  }

  saveEdit(id: number): void { const body = this.editForm.controls.body.value.trim(); if (!body || this.saving()) { this.message.set('Comment text is required.'); return; } this.saving.set(true); this.service.updateComment(id, { body }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (updated) => { this.replaceComment(updated); this.saving.set(false); this.editingId.set(null); }, error: (error: unknown) => { this.saving.set(false); this.message.set(this.service.errorMessage(error)); } }); }
  askDelete(id: number, reply: boolean): void { this.pendingDelete.set({ id, reply }); }
  cancelDelete(): void { this.pendingDelete.set(null); }
  confirmDelete(): void { const pending = this.pendingDelete(); if (!pending || this.saving()) return; this.saving.set(true); this.service.deleteComment(pending.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { if (pending.reply) this.removeReply(pending.id); else this.comments.update((items) => items.filter((item) => item.id !== pending.id)); this.saving.set(false); this.pendingDelete.set(null); }, error: (error: unknown) => { this.saving.set(false); this.pendingDelete.set(null); this.message.set(this.service.errorMessage(error)); } }); }

  authorName(author: PostAuthor): string { return author.type === 'user' ? author.display_name || author.name : author.name; }
  authorAvatar(author: PostAuthor): string | null { return author.type === 'user' ? author.avatar_url : author.logo_url; }
  authorLink(author: PostAuthor): string[] { return author.type === 'user' ? ['/users', String(author.id)] : ['/businesses', author.slug]; }
  initials(name: string): string { return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }
  canManage(author: PostAuthor): boolean { if (!this.auth.currentUser()) return false; if (author.type === 'user') return author.id === this.auth.currentUser()?.id; const business = this.businesses().find((item) => item.id === author.id); return business?.status === 'active' && ['owner', 'admin', 'editor'].includes(business.current_user_role ?? ''); }

  private authorPayload(body: string): CreateCommentPayload { const value = this.form.controls.author.value; return value === 'user' ? { author_type: 'user', body } : { author_type: 'business', business_id: Number(value.split(':')[1]), body }; }
  private appendComment(comment: Comment): void { const normalized = this.normalize(comment); if (!this.comments().some((item) => item.id === normalized.id)) this.comments.update((items) => [...items, normalized]); }
  private appendReply(parentId: number, reply: CommentReply): void { this.comments.update((items) => items.map((item) => item.id === parentId ? { ...item, replies: item.replies.some((existing) => existing.id === reply.id) ? item.replies : [...item.replies, reply], replies_count: (item.replies_count ?? 0) + 1 } : item)); }
  private replaceComment(updated: Comment): void { const normalized = this.normalize(updated); const reply = this.toReply(normalized); this.comments.update((items) => items.map((item) => item.id === normalized.id ? { ...normalized, replies_count: normalized.replies_count || item.replies_count, replies: normalized.replies.length ? normalized.replies : item.replies } : { ...item, replies: item.replies.map((existing) => existing.id === normalized.id ? reply : existing) })); }
  private removeReply(id: number): void { this.comments.update((items) => items.map((item) => item.replies.some((reply) => reply.id === id) ? { ...item, replies: item.replies.filter((reply) => reply.id !== id), replies_count: Math.max(0, item.replies_count - 1) } : item)); }
  private toReply(comment: Comment): CommentReply { return { id: comment.id, body: comment.body, author: comment.author, created_at: comment.created_at, updated_at: comment.updated_at }; }
  private normalize(comment: Comment): Comment { return { ...comment, replies_count: comment.replies_count ?? 0, replies: comment.replies ?? [] }; }
}
