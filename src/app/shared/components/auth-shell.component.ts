import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-shell',
  imports: [RouterLink],
  template: `
    <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8">
      <div class="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-3xl border border-border-subtle bg-surface-card shadow-card lg:grid-cols-[1.05fr_0.95fr]">
        <aside class="hidden bg-brand-primary p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <a routerLink="/" class="text-sm font-medium uppercase tracking-[0.18em]">Emirates Connect</a>
            <div class="mt-24 max-w-md">
              <p class="text-sm font-medium text-white/75">The UAE business network</p>
              <h1 class="mt-4 text-5xl font-bold leading-tight">Build relationships that move business forward.</h1>
              <p class="mt-6 text-lg leading-8 text-white/80">A focused space for founders, entrepreneurs and verified businesses across the Emirates.</p>
            </div>
          </div>
          <p class="text-sm text-white/65">Professional connections, thoughtfully built.</p>
        </aside>
        <section class="flex items-center p-6 sm:p-10 lg:p-14">
          <div class="w-full max-w-md">
            <a routerLink="/" class="text-sm font-medium uppercase tracking-[0.18em] text-brand-strong lg:hidden">Emirates Connect</a>
            <p class="mt-8 text-sm font-medium text-brand-strong lg:mt-0">{{ eyebrow() }}</p>
            <h2 class="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{{ title() }}</h2>
            <p class="mt-3 text-base leading-7 text-content-secondary">{{ description() }}</p>
            <div class="mt-8">
              <ng-content />
            </div>
          </div>
        </section>
      </div>
    </main>
  `,
})
export class AuthShellComponent {
  readonly eyebrow = input('Emirates Connect');
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}
