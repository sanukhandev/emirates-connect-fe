import { Component, OnInit, input, signal } from '@angular/core';
import { PostPoll } from '../../../core/post/post.models';

@Component({
  selector: 'app-post-poll',
  template: `
    <div class="mt-4 rounded-2xl border border-border-subtle bg-surface-secondary/60 p-4">
      <h3 class="text-sm font-semibold text-content-primary">{{ poll().question }}</h3>

      <div class="mt-3 space-y-2.5" role="radiogroup" [attr.aria-label]="poll().question">
        @for (option of poll().options; track option.id) {
          <button
            type="button"
            class="group relative flex w-full items-center justify-between overflow-hidden rounded-xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            [class.border-brand-500]="selectedOptionId() === option.id"
            [class.border-border-subtle]="selectedOptionId() !== option.id"
            [class.bg-white]="!hasVoted()"
            [class.cursor-pointer]="!hasVoted()"
            [class.cursor-default]="hasVoted()"
            (click)="vote(option.id)"
            [disabled]="hasVoted()"
            role="radio"
            [attr.aria-checked]="selectedOptionId() === option.id"
          >
            <!-- Progress Fill Bar -->
            @if (hasVoted()) {
              <div
                class="absolute inset-y-0 left-0 bg-brand-100 transition-all duration-500"
                [style.width.%]="calculatePercentage(option.votes)"
                aria-hidden="true"
              ></div>
            }

            <!-- Option Text -->
            <span
              class="relative z-10 text-sm font-medium transition-colors"
              [class.text-brand-900]="selectedOptionId() === option.id"
              [class.text-content-primary]="selectedOptionId() !== option.id"
            >
              {{ option.text }}
              @if (selectedOptionId() === option.id) {
                <span class="inline-flex items-center text-brand-600 ml-1">
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              }
            </span>

            <!-- Percentage Display -->
            @if (hasVoted()) {
              <span class="relative z-10 text-xs font-semibold text-brand-700">
                {{ calculatePercentage(option.votes) }}%
              </span>
            } @else {
              <span
                class="h-4 w-4 rounded-full border border-border-subtle group-hover:border-brand-500 transition-colors"
                aria-hidden="true"
              ></span>
            }
          </button>
        }
      </div>

      <!-- Footer Info -->
      <div class="mt-3 flex items-center justify-between text-xs text-content-muted">
        <span>{{ totalVotes() }} votes</span>
        <span>{{ poll().days_remaining ?? 2 }} days remaining</span>
      </div>
    </div>
  `,
})
export class PostPollComponent implements OnInit {
  readonly poll = input.required<PostPoll>();

  readonly selectedOptionId = signal<number | null>(null);
  readonly totalVotes = signal<number>(0);
  readonly hasVoted = signal<boolean>(false);

  ngOnInit(): void {
    const p = this.poll();
    this.totalVotes.set(p.total_votes);
    if (p.user_voted_option_id) {
      this.selectedOptionId.set(p.user_voted_option_id);
      this.hasVoted.set(true);
    }
  }

  vote(optionId: number): void {
    if (this.hasVoted()) return;
    this.selectedOptionId.set(optionId);
    this.hasVoted.set(true);
    this.totalVotes.update((v) => v + 1);

    // Optimistically increment the voted option's count
    const option = this.poll().options.find((opt) => opt.id === optionId);
    if (option) {
      option.votes += 1;
    }
  }

  calculatePercentage(votes: number): number {
    const total = this.totalVotes();
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  }
}
