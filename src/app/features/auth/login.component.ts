import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { AuthShellComponent } from '../../shared/components/auth-shell.component';

@Component({
  selector: 'app-login',
  imports: [AuthShellComponent, ReactiveFormsModule, RouterLink],
  template: `
    <app-auth-shell title="Welcome back" description="Sign in to continue building meaningful business connections.">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="space-y-5">
        @if (errorMessage()) {
          <div role="alert" aria-live="polite" class="rounded-2xl border border-status-danger/25 bg-status-danger/10 px-4 py-3 text-sm text-status-danger">{{ errorMessage() }}</div>
        }
        <label class="block text-sm font-medium" for="login-email">Email
          <input id="login-email" formControlName="email" type="email" autocomplete="email" class="auth-input" />
        </label>
        @if (form.controls.email.touched && form.controls.email.invalid) { <p class="field-error">Enter a valid email address.</p> }
        <label class="block text-sm font-medium" for="login-password">Password
          <span class="relative mt-2 block">
            <input id="login-password" formControlName="password" [type]="showPassword() ? 'text' : 'password'" autocomplete="current-password" class="auth-input pr-20" />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-brand-strong" (click)="showPassword.update((value) => !value)" [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">{{ showPassword() ? 'Hide' : 'Show' }}</button>
          </span>
        </label>
        @if (form.controls.password.touched && form.controls.password.invalid) { <p class="field-error">Enter your password.</p> }
        <button class="auth-button" type="submit" [disabled]="form.invalid || submitting()">{{ submitting() ? 'Signing in…' : 'Sign in' }}</button>
        <div class="flex items-center justify-between gap-4 text-sm">
          <a routerLink="/forgot-password" class="font-medium text-brand-strong hover:text-brand-hover">Forgot password?</a>
          <a routerLink="/register" class="font-medium text-brand-strong hover:text-brand-hover">Create account</a>
        </div>
      </form>
    </app-auth-shell>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly showPassword = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.maxLength(255)]],
  });

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (error: unknown) => {
        this.errorMessage.set(this.auth.errorMessage(error));
        this.submitting.set(false);
      },
    });
  }
}
