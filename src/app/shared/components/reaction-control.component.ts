import { Component, DestroyRef, OnChanges, SimpleChanges, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, Observable } from 'rxjs';

import { AuthStateService } from '../../core/auth/auth-state.service';
import { ReactionService } from '../../core/reaction/reaction.service';
import { EMPTY_REACTION_SUMMARY, REACTION_TYPES, ReactionSummary, ReactionType, applyOptimisticReaction } from '../../core/reaction/reaction.models';

@Component({
  selector: 'app-reaction-control',
  template: `
    <div class="mt-3 flex flex-wrap items-center gap-2">
      <button type="button" class="rounded-xl border border-border-subtle px-3 py-2 text-xs font-medium transition hover:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary" [class.bg-brand-soft]="summary().current_user" [attr.aria-pressed]="!!summary().current_user" [attr.aria-label]="primaryLabel()" [disabled]="pending()" (click)="togglePrimary()">{{ primaryLabel() }}</button>
      <button type="button" class="rounded-xl border border-border-subtle px-2 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary" aria-label="Choose reaction" aria-haspopup="menu" [attr.aria-expanded]="pickerOpen()" [disabled]="pending()" (click)="pickerOpen.set(!pickerOpen())">＋</button>
      @if (summary().total > 0) { <span class="text-xs text-content-muted" aria-live="polite">{{ summary().total }} {{ summary().total === 1 ? 'reaction' : 'reactions' }}</span> }
      @if (pickerOpen()) { <div class="relative basis-full"><div class="absolute left-0 z-10 mt-1 flex flex-wrap gap-1 rounded-2xl border border-border-subtle bg-surface-card p-2 shadow-card" role="menu" tabindex="0" aria-label="Reaction options" (keydown.escape)="pickerOpen.set(false)">@for (type of reactionTypes; track type) { <button type="button" role="menuitem" class="rounded-xl px-3 py-2 text-xs font-medium hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary" [attr.aria-label]="'React with ' + label(type)" (click)="choose(type)">{{ label(type) }}</button> }</div></div> }
      @if (message()) { <span class="basis-full text-xs text-status-danger" role="alert">{{ message() }}</span> }
    </div>
  `,
})
export class ReactionControlComponent implements OnChanges {
  readonly targetId = input.required<number>();
  readonly targetType = input.required<'post' | 'comment'>();
  readonly reactionSummary = input<ReactionSummary | null>(null);
  readonly summaryChange = output<ReactionSummary>();
  readonly summary = signal<ReactionSummary>(EMPTY_REACTION_SUMMARY);
  readonly pickerOpen = signal(false);
  readonly pending = signal(false);
  readonly message = signal('');
  readonly reactionTypes = REACTION_TYPES;
  private readonly auth = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly service = inject(ReactionService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reactionSummary'] && !changes['reactionSummary'].firstChange) this.summary.set(this.clone(this.reactionSummary() ?? EMPTY_REACTION_SUMMARY));
    if (changes['reactionSummary']?.firstChange) this.summary.set(this.clone(this.reactionSummary() ?? EMPTY_REACTION_SUMMARY));
  }

  label(type: ReactionType): string { return type[0].toUpperCase() + type.slice(1); }
  primaryLabel(): string { const current = this.summary().current_user; return current ? `Remove ${this.label(current)} reaction` : this.auth.currentUser() ? 'Like' : 'Sign in to react'; }

  togglePrimary(): void {
    if (!this.auth.currentUser()) { void this.router.navigate(['/login']); return; }
    const current = this.summary().current_user;
    if (current) this.mutate(null); else this.mutate('like');
  }

  choose(type: ReactionType): void {
    this.pickerOpen.set(false);
    if (!this.auth.currentUser()) { void this.router.navigate(['/login']); return; }
    this.mutate(this.summary().current_user === type ? null : type);
  }

  private mutate(next: ReactionType | null): void {
    if (this.pending()) return;
    const previous = this.clone(this.summary());
    this.summary.set(applyOptimisticReaction(previous, next));
    this.summaryChange.emit(this.summary());
    this.pending.set(true); this.message.set('');
    const request: Observable<ReactionSummary> = next
      ? (this.targetType() === 'post' ? this.service.setPostReaction(this.targetId(), next) : this.service.setCommentReaction(this.targetId(), next))
      : (this.targetType() === 'post' ? this.service.removePostReaction(this.targetId()) : this.service.removeCommentReaction(this.targetId())).pipe(map(() => this.summary()));
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (authoritative: ReactionSummary) => { if (next) { this.summary.set(this.clone(authoritative)); this.summaryChange.emit(this.summary()); } this.pending.set(false); },
      error: (error: unknown) => { this.summary.set(previous); this.summaryChange.emit(previous); this.pending.set(false); this.message.set(this.service.errorMessage(error)); },
    });
  }

  private clone(summary: ReactionSummary): ReactionSummary { return { total: summary.total, counts: { ...summary.counts }, current_user: summary.current_user }; }
}
