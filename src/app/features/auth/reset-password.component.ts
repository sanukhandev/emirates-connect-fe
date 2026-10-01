import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { AuthShellComponent } from '../../shared/components/auth-shell.component';

@Component({
  selector: 'app-reset-password',
  imports: [AuthShellComponent, ReactiveFormsModule, RouterLink],
  template: `
    <app-auth-shell eyebrow="Account recovery" title="Set a new password" description="Choose a strong password to secure your Emirates Connect account.">
      @if (completed()) {
        <div role="status" class="rounded-2xl border border-status-success/25 bg-status-success/10 px-4 py-4 text-sm text-status-success">Your password has been reset successfully.</div>
        <a routerLink="/login" class="mt-6 block text-center text-sm font-medium text-brand-strong">Continue to sign in</a>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="space-y-5">
          @if (errorMessage()) { <div role="alert" class="rounded-2xl border border-status-danger/25 bg-status-danger/10 px-4 py-3 text-sm text-status-danger">{{ errorMessage() }}</div> }
          <label class="block text-sm font-medium" for="reset-email">Email<input id="reset-email" formControlName="email" type="email" autocomplete="email" class="auth-input" /></label>
          <label class="block text-sm font-medium" for="reset-password">New password<input id="reset-password" formControlName="password" [type]="showPassword() ? 'text' : 'password'" autocomplete="new-password" class="auth-input" /></label>
          <p class="text-xs text-content-muted">Use at least 8 characters with upper and lower case letters, a number and a symbol.</p>
          <label class="block text-sm font-medium" for="reset-password-confirmation">Confirm password<input id="reset-password-confirmation" formControlName="password_confirmation" [type]="showPassword() ? 'text' : 'password'" autocomplete="new-password" class="auth-input" /></label>
          <button type="button" class="text-sm font-medium text-brand-strong" (click)="showPassword.update((value) => !value)">{{ showPassword() ? 'Hide passwords' : 'Show passwords' }}</button>
          <button class="auth-button" type="submit" [disabled]="form.invalid || submitting()">{{ submitting() ? 'Resetting…' : 'Reset password' }}</button>
          <a routerLink="/login" class="block text-center text-sm font-medium text-brand-strong">Back to sign in</a>
        </form>
      }
    </app-auth-shell>
  `,
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly submitting = signal(false);
  readonly completed = signal(false);
  readonly errorMessage = signal('');
  readonly showPassword = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: [this.route.snapshot.queryParamMap.get('email') ?? '', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
    password_confirmation: ['', [Validators.required]],
  });
  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  submit(): void {
    if (this.form.invalid || this.form.controls.password.value !== this.form.controls.password_confirmation.value || !this.token || this.submitting()) {
      this.form.markAllAsTouched();
      if (!this.token) this.errorMessage.set('This reset link is missing or invalid.');
      return;
    }

    this.submitting.set(true);
    this.auth.resetPassword({ ...this.form.getRawValue(), token: this.token }).subscribe({
      next: () => this.completed.set(true),
      error: (error: unknown) => {
        this.errorMessage.set(this.auth.errorMessage(error));
        this.submitting.set(false);
      },
    });
  }
}
