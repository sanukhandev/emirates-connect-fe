import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-home',
  template: `
    <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl">
        <header class="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-5">
          <div>
            <p class="text-sm font-medium uppercase tracking-[0.18em] text-brand-strong">Emirates Connect</p>
            <h1 class="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Your professional network, thoughtfully built.</h1>
          </div>
          <button class="rounded-xl border border-border-subtle bg-surface-card px-4 py-2 text-sm font-medium hover:border-brand-primary" (click)="logout()" [disabled]="loggingOut()">{{ loggingOut() ? 'Signing out…' : 'Sign out' }}</button>
        </header>
        <section class="mt-8 grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
          <article class="rounded-3xl bg-surface-card p-6 shadow-card sm:p-8">
            <p class="text-sm font-medium text-brand-strong">Welcome, {{ auth.currentUser()?.name }}</p>
            <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">A focused foundation for the UAE business network.</h2>
            <p class="mt-4 max-w-2xl text-base leading-7 text-content-secondary">Your session is active. Product features will arrive in later foundation work.</p>
          </article>
          <article class="rounded-3xl bg-surface-card p-6 shadow-card sm:p-8">
            <div class="flex items-center justify-between gap-3"><h2 class="text-lg font-semibold">Account status</h2><span class="h-3 w-3 rounded-full bg-status-success" aria-label="Active"></span></div>
            <dl class="mt-6 space-y-4 text-sm">
              <div class="flex justify-between gap-4 border-b border-border-subtle pb-3"><dt class="text-content-secondary">Email</dt><dd class="max-w-[12rem] truncate font-medium">{{ auth.currentUser()?.email }}</dd></div>
              <div class="flex justify-between gap-4 border-b border-border-subtle pb-3"><dt class="text-content-secondary">Status</dt><dd class="font-medium capitalize">{{ auth.currentUser()?.account_status }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-content-secondary">Email verification</dt><dd class="font-medium">{{ auth.currentUser()?.email_verified_at ? 'Verified' : 'Pending' }}</dd></div>
            </dl>
            @if (auth.currentUser()?.email_verified_at === null) { <button class="mt-6 text-sm font-medium text-brand-strong" (click)="resendVerification()" [disabled]="verificationSent()">{{ verificationSent() ? 'Verification email sent' : 'Resend verification email' }}</button> }
          </article>
        </section>
      </div>
    </main>
  `,
})
export class HomeComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loggingOut = signal(false);
  readonly verificationSent = signal(false);

  logout(): void {
    this.loggingOut.set(true);
    this.auth.logout().subscribe({ next: () => this.router.navigateByUrl('/login'), error: () => this.router.navigateByUrl('/login') });
  }

  resendVerification(): void {
    this.auth.resendVerification().subscribe({ next: () => this.verificationSent.set(true) });
  }
}
