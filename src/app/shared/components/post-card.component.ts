import { DatePipe } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Post } from '../../core/post/post.models';
import { CommentSectionComponent } from './comment-section.component';
import { ReactionControlComponent } from './reaction-control.component';
import { ReportDialogComponent } from './report-dialog.component';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { ReportTargetType } from '../../core/report/report.models';

@Component({
  selector: 'app-post-card',
  imports: [DatePipe, RouterLink, CommentSectionComponent, ReactionControlComponent, ReportDialogComponent],
  template: `
    <article [attr.data-post-id]="post().id" class="rounded-3xl bg-surface-card p-5 shadow-card sm:p-6">
      <header class="flex items-start gap-3">
        @if (isUser()) { <a [routerLink]="['/users', post().author.id]" class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft font-bold text-brand-strong">@if (userAvatar()) { <img [src]="userAvatar()" [alt]="authorName() + ' profile photo'" class="h-full w-full object-cover" /> } @else { {{ initials(authorName()) }} }</a> } @else { <a [routerLink]="['/businesses', businessSlug()]" class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft font-bold text-brand-strong">@if (businessLogo()) { <img [src]="businessLogo()" [alt]="authorName() + ' logo'" class="h-full w-full object-cover" /> } @else { {{ initials(authorName()) }} }</a> }
        <div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2"><h2 class="font-semibold">{{ authorName() }}</h2>@if (post().author.type === 'business') { <span class="rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand-strong">Business</span> } @if (post().status === 'draft') { <span class="rounded-full bg-status-warning/15 px-2 py-0.5 text-xs text-status-warning">Draft</span> }</div><p class="text-sm text-content-muted">{{ post().published_at || post().created_at | date:'medium' }}</p></div>
        @if (management()) { <div class="flex gap-2"><button type="button" class="rounded-xl border border-border-subtle px-3 py-2 text-sm" (click)="edit.emit()">Edit</button><button type="button" class="rounded-xl border border-status-danger/40 px-3 py-2 text-sm text-status-danger" (click)="remove.emit()">Delete</button></div> } @else if (canReport()) { <button type="button" class="rounded-xl border border-border-subtle px-3 py-2 text-sm font-medium hover:border-brand-primary" (click)="openReport()">Report post</button> }
      </header>
      @if (post().body) { <p class="mt-5 whitespace-pre-line leading-7 text-content-secondary">{{ post().body }}</p> }
      @if (post().media.length) { <div class="mt-5 grid gap-2 overflow-hidden rounded-2xl" [class.grid-cols-2]="post().media.length > 1">@for (media of post().media; track media.id; let index = $index) { <img [src]="media.url" [alt]="'Post image ' + (index + 1)" class="max-h-[30rem] w-full object-cover" /> }</div> }
      @if (post().status === 'published') { <app-reaction-control targetType="post" [targetId]="post().id" [reactionSummary]="post().reactions ?? null" /> }
      @if (showComments() && post().status === 'published') { <button type="button" class="mt-5 text-sm font-medium text-brand-strong" (click)="commentsOpen.set(!commentsOpen())" [attr.aria-expanded]="commentsOpen()">{{ commentsOpen() ? 'Hide comments' : 'View comments' }}</button>@if (commentsOpen()) { <app-comment-section [postId]="post().id" /> } }
    </article>
    @if (message()) { <p class="mt-3 text-sm text-status-success" role="status">{{ message() }}</p> } @if (reportTarget(); as target) { <app-report-dialog [targetType]="target.type" [targetId]="target.id" [targetLabel]="target.label" (closed)="closeReport($event)" /> }
  `,
})
export class PostCardComponent {
  readonly post = input.required<Post>();
  readonly management = input(false);
  readonly showComments = input(true);
  readonly edit = output<void>();
  readonly remove = output<void>();
  readonly commentsOpen = signal(false);
  readonly reportTarget = signal<{ type: ReportTargetType; id: number; label: string } | null>(null);
  readonly message = signal('');
  private readonly auth = inject(AuthStateService);
  isUser(): boolean { return this.post().author.type === 'user'; }
  userAvatar(): string | null { const author = this.post().author; return author.type === 'user' ? author.avatar_url : null; }
  businessSlug(): string { const author = this.post().author; return author.type === 'business' ? author.slug : ''; }
  businessLogo(): string | null { const author = this.post().author; return author.type === 'business' ? author.logo_url : null; }
  authorName(): string { const author = this.post().author; return author.type === 'user' ? (author.display_name || author.name) : author.name; }
  initials(name: string): string { return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }
  canReport(): boolean { const user = this.auth.currentUser(); const author = this.post().author; return !!user && !(author.type === 'user' && author.id === user.id); }
  openReport(): void { this.reportTarget.set({ type: 'post', id: this.post().id, label: 'post' }); }
  closeReport(result: 'submitted' | 'cancelled'): void { this.reportTarget.set(null); if (result === 'submitted') this.message.set('Report submitted.'); }
}
