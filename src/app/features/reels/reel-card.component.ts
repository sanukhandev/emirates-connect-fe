import { DatePipe } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Reel } from '../../core/reel/reel.models';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { ReportTargetType } from '../../core/report/report.models';
import { ReportDialogComponent } from '../../shared/components/report-dialog.component';

@Component({
  selector: 'app-reel-card',
  imports: [DatePipe, RouterLink, ReportDialogComponent],
  template: `
    <article class="overflow-hidden rounded-3xl border border-border-subtle bg-surface-card shadow-card">
      <div class="grid gap-5 p-4 sm:p-5 md:grid-cols-[minmax(220px,360px)_1fr]">
        @if (reel().status === 'published' && reel().playback_url) {
          <video class="mx-auto aspect-[9/16] max-h-[34rem] w-full rounded-2xl bg-content-primary object-contain" controls playsinline preload="metadata" [poster]="reel().thumbnail_url || undefined" [attr.aria-label]="'Reel by ' + authorName()">
            <source [src]="reel().playback_url" type="video/mp4" />
          </video>
        } @else {
          <div class="flex aspect-[9/16] max-h-[34rem] items-center justify-center rounded-2xl bg-surface-muted p-6 text-center" [attr.aria-label]="statusLabel()">
            <div><p class="font-semibold">{{ statusLabel() }}</p>@if (reel().status === 'failed' && management()) { <p class="mt-2 text-sm text-content-secondary">You can delete this reel and try again.</p> }</div>
          </div>
        }
        <div class="flex min-w-0 flex-col">
          <div class="flex items-start justify-between gap-3">
            <a [routerLink]="authorLink()" class="flex min-w-0 items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-soft font-bold text-brand-strong">
                @if (avatarUrl()) { <img [src]="avatarUrl()!" [alt]="authorName() + ' avatar'" class="h-full w-full object-cover" /> } @else { {{ initials() }} }
              </div>
              <div class="min-w-0"><p class="truncate font-semibold">{{ authorName() }}</p><p class="truncate text-sm text-content-secondary">{{ authorSubtitle() }}</p></div>
            </a>
            @if (reel().author.is_verified) { <span class="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-strong" aria-label="Verified profile">✓ Verified</span> } @if (!management() && canReport()) { <button type="button" class="shrink-0 rounded-xl border border-border-subtle px-3 py-2 text-sm font-medium hover:border-brand-primary" (click)="openReport()">Report reel</button> }
          </div>
          @if (reel().caption) { <p class="mt-5 whitespace-pre-line leading-7 text-content-secondary">{{ reel().caption }}</p> }
          @if (reel().published_at) { <p class="mt-auto pt-6 text-xs text-content-muted">{{ reel().published_at | date:'mediumDate' }}</p> }
          @if (management()) { <div class="mt-5 flex flex-wrap gap-2"><button type="button" class="rounded-xl border border-border-subtle px-3 py-2 text-sm font-medium hover:border-brand-primary" (click)="edit.emit(reel())">Edit caption</button><button type="button" class="rounded-xl border border-status-danger/30 px-3 py-2 text-sm font-medium text-status-danger hover:bg-status-danger/10" (click)="remove.emit(reel())">Delete</button></div> }
        </div>
      </div>
    </article>
    @if (message()) { <p class="mt-3 text-sm text-status-success" role="status">{{ message() }}</p> } @if (reportTarget(); as target) { <app-report-dialog [targetType]="target.type" [targetId]="target.id" [targetLabel]="target.label" (closed)="closeReport($event)" /> }
  `,
})
export class ReelCardComponent {
  readonly reel = input.required<Reel>();
  readonly management = input(false);
  readonly edit = output<Reel>();
  readonly remove = output<Reel>();
  readonly reportTarget = signal<{ type: ReportTargetType; id: number; label: string } | null>(null);
  readonly message = signal('');
  private readonly auth = inject(AuthStateService);

  authorName(): string { const author = this.reel().author; return author.type === 'user' ? (author.display_name || 'Professional profile') : author.name; }
  authorSubtitle(): string { const author = this.reel().author; return author.type === 'user' ? (author.headline || 'Professional') : 'Business'; }
  avatarUrl(): string | null { const author = this.reel().author; return author.type === 'user' ? author.avatar_url : author.logo_url; }
  authorLink(): string[] { const author = this.reel().author; return author.type === 'user' ? ['/users', String(author.id)] : ['/businesses', author.slug]; }
  initials(): string { return this.authorName().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }
  statusLabel(): string { return this.reel().status === 'processing' ? 'Processing video…' : this.reel().status === 'failed' ? 'Processing failed' : 'Video unavailable'; }
  canReport(): boolean { const user = this.auth.currentUser(); const author = this.reel().author; return !!user && !(author.type === 'user' && author.id === user.id); }
  openReport(): void { this.reportTarget.set({ type: 'reel', id: this.reel().id, label: 'reel' }); }
  closeReport(result: 'submitted' | 'cancelled'): void { this.reportTarget.set(null); if (result === 'submitted') this.message.set('Report submitted.'); }
}
