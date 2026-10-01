import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Post } from '../../core/post/post.models';

@Component({
  selector: 'app-post-card',
  imports: [DatePipe, RouterLink],
  template: `
    <article class="rounded-3xl bg-surface-card p-5 shadow-card sm:p-6">
      <header class="flex items-start gap-3">
        @if (isUser()) { <a [routerLink]="['/users', post().author.id]" class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft font-bold text-brand-strong">@if (userAvatar()) { <img [src]="userAvatar()" [alt]="authorName() + ' profile photo'" class="h-full w-full object-cover" /> } @else { {{ initials(authorName()) }} }</a> } @else { <a [routerLink]="['/businesses', businessSlug()]" class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft font-bold text-brand-strong">@if (businessLogo()) { <img [src]="businessLogo()" [alt]="authorName() + ' logo'" class="h-full w-full object-cover" /> } @else { {{ initials(authorName()) }} }</a> }
        <div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2"><h2 class="font-semibold">{{ authorName() }}</h2>@if (post().author.type === 'business') { <span class="rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand-strong">Business</span> } @if (post().status === 'draft') { <span class="rounded-full bg-status-warning/15 px-2 py-0.5 text-xs text-status-warning">Draft</span> }</div><p class="text-sm text-content-muted">{{ post().published_at || post().created_at | date:'medium' }}</p></div>
        @if (management()) { <div class="flex gap-2"><button type="button" class="rounded-xl border border-border-subtle px-3 py-2 text-sm" (click)="edit.emit()">Edit</button><button type="button" class="rounded-xl border border-status-danger/40 px-3 py-2 text-sm text-status-danger" (click)="remove.emit()">Delete</button></div> }
      </header>
      @if (post().body) { <p class="mt-5 whitespace-pre-line leading-7 text-content-secondary">{{ post().body }}</p> }
      @if (post().media.length) { <div class="mt-5 grid gap-2 overflow-hidden rounded-2xl" [class.grid-cols-2]="post().media.length > 1">@for (media of post().media; track media.id; let index = $index) { <img [src]="media.url" [alt]="'Post image ' + (index + 1)" class="max-h-[30rem] w-full object-cover" /> }</div> }
    </article>
  `,
})
export class PostCardComponent {
  readonly post = input.required<Post>();
  readonly management = input(false);
  readonly edit = output<void>();
  readonly remove = output<void>();
  isUser(): boolean { return this.post().author.type === 'user'; }
  userAvatar(): string | null { const author = this.post().author; return author.type === 'user' ? author.avatar_url : null; }
  businessSlug(): string { const author = this.post().author; return author.type === 'business' ? author.slug : ''; }
  businessLogo(): string | null { const author = this.post().author; return author.type === 'business' ? author.logo_url : null; }
  authorName(): string { const author = this.post().author; return author.type === 'user' ? (author.display_name || author.name) : author.name; }
  initials(name: string): string { return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }
}
