import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { AuthShellComponent } from '../../shared/components/auth-shell.component';

@Component({
  selector: 'app-forgot-password',
  imports: [AuthShellComponent, ReactiveFormsModule, RouterLink],
  template: `
    <app-auth-shell eyebrow="Account recovery" title="Forgot your password?" description="Enter your email and we’ll send reset instructions if an account exists.">
      @if (submitted()) {
        <div role="status" class="rounded-2xl border border-status-success/25 bg-status-success/10 px-4 py-4 text-sm text-status-success">If an account exists for that email, reset instructions have been sent.</div>
        <a routerLink="/login" class="mt-6 block text-center text-sm font-medium text-brand-strong">Return to sign in</a>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="space-y-5">
          @if (errorMessage()) { <div role="alert" class="rounded-2xl border border-status-danger/25 bg-status-danger/10 px-4 py-3 text-sm text-status-danger">{{ errorMessage() }}</div> }
          <label class="block text-sm font-medium" for="forgot-email">Email<input id="forgot-email" formControlName="email" type="email" autocomplete="email" class="auth-input" /></label>
          @if (form.controls.email.touched && form.controls.email.invalid) { <p class="field-error">Enter a valid email address.</p> }
          <button class="auth-button" type="submit" [disabled]="form.invalid || submitting()">{{ submitting() ? 'Sending…' : 'Send reset instructions' }}</button>
          <a routerLink="/login" class="block text-center text-sm font-medium text-brand-strong">Back to sign in</a>
        </form>
      }
    </app-auth-shell>
  `,
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal('');
  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]] });

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.auth.forgotPassword(this.form.controls.email.value).subscribe({
      next: () => this.submitted.set(true),
      error: (error: unknown) => {
        this.errorMessage.set(this.auth.errorMessage(error));
        this.submitting.set(false);
      },
    });
  }
}
