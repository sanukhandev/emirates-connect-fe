import { Component, output } from '@angular/core';
import { VerificationBadgeComponent } from '../verification-badge/verification-badge.component';

export interface ConnectUser {
  id: number;
  name: string;
  role: string;
  emirate: string;
  avatar: string;
  isVerified: boolean;
  hasUnreadUpdate?: boolean;
}

@Component({
  selector: 'app-connect-strip',
  imports: [VerificationBadgeComponent],
  template: `
    <section class="rounded-2xl border border-border-subtle bg-surface-card p-3.5 shadow-card" aria-label="Professional Connect Stories">
      <div class="flex items-center justify-between pb-2.5">
        <div class="flex items-center gap-2">
          <span class="inline-block h-2 w-2 rounded-full bg-brand-500"></span>
          <h2 class="text-xs font-bold uppercase tracking-wider text-content-secondary">Connect & Updates</h2>
        </div>
        <span class="text-[11px] font-medium text-brand-600 hover:text-brand-700 cursor-pointer">Explore UAE</span>
      </div>

      <div class="flex items-center gap-3.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
        <!-- Add Update Action -->
        <button
          type="button"
          (click)="addStory.emit()"
          class="group flex flex-col items-center gap-1.5 shrink-0 focus-visible:outline-none"
          aria-label="Add your professional update"
        >
          <div
            class="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-brand-300 bg-brand-50 text-brand-600 transition-all duration-200 group-hover:border-brand-500 group-hover:bg-brand-100 group-hover:scale-105"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
          <span class="text-xs font-medium text-content-primary group-hover:text-brand-600">You</span>
        </button>

        <!-- Professional Profiles -->
        @for (item of connections; track item.id) {
          <button
            type="button"
            class="group flex flex-col items-center gap-1.5 shrink-0 focus-visible:outline-none"
            [attr.aria-label]="item.name + ' - ' + item.role"
          >
            <div
              class="relative rounded-full p-0.5 transition-transform duration-200 group-hover:scale-105"
              [class.bg-gradient-to-tr]="item.hasUnreadUpdate"
              [class.from-brand-500]="item.hasUnreadUpdate"
              [class.to-brand-300]="item.hasUnreadUpdate"
              [class.border]="!item.hasUnreadUpdate"
              [class.border-border-subtle]="!item.hasUnreadUpdate"
            >
              <div class="h-13 w-13 overflow-hidden rounded-full border-2 border-white bg-surface-secondary">
                <img
                  [src]="item.avatar"
                  [alt]="item.name"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              @if (item.isVerified) {
                <span class="absolute -bottom-0.5 -right-0.5 scale-90">
                  <app-verification-badge type="professional" />
                </span>
              }
            </div>
            <span class="max-w-[64px] truncate text-xs font-medium text-content-primary group-hover:text-brand-600">
              {{ item.name }}
            </span>
          </button>
        }
      </div>
    </section>
  `,
  styles: [`
    .scrollbar-none::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-none {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `],
})
export class ConnectStripComponent {
  readonly addStory = output<void>();

  readonly connections: ConnectUser[] = [
    {
      id: 101,
      name: 'Aisha',
      role: 'Founding Partner',
      emirate: 'Dubai',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
      isVerified: true,
      hasUnreadUpdate: true,
    },
    {
      id: 102,
      name: 'Omar',
      role: 'Fintech Director',
      emirate: 'Abu Dhabi',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
      isVerified: true,
      hasUnreadUpdate: true,
    },
    {
      id: 103,
      name: 'Sara',
      role: 'AI Researcher',
      emirate: 'Dubai',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
      isVerified: true,
      hasUnreadUpdate: false,
    },
    {
      id: 104,
      name: 'Mohammed',
      role: 'Logistics Lead',
      emirate: 'Sharjah',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
      isVerified: false,
      hasUnreadUpdate: false,
    },
    {
      id: 105,
      name: 'Layla',
      role: 'VC Analyst',
      emirate: 'Dubai',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      isVerified: true,
      hasUnreadUpdate: true,
    },
    {
      id: 106,
      name: 'Zain',
      role: 'Cloud Architect',
      emirate: 'Abu Dhabi',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=160&q=80',
      isVerified: true,
      hasUnreadUpdate: false,
    },
    {
      id: 107,
      name: 'Fatima',
      role: 'Growth Strategist',
      emirate: 'Dubai',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
      isVerified: true,
      hasUnreadUpdate: false,
    },
  ];
}
