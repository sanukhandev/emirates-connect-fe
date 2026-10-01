import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { AuthShellComponent } from '../../shared/components/auth-shell.component';

@Component({
  selector: 'app-register',
  imports: [AuthShellComponent, ReactiveFormsModule, RouterLink],
  template: `
    <app-auth-shell eyebrow="Start here" title="Create your account" description="Join a professional network built for the UAE business community.">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="space-y-4">
        @if (errorMessage()) { <div role="alert" aria-live="polite" class="rounded-2xl border border-status-danger/25 bg-status-danger/10 px-4 py-3 text-sm text-status-danger">{{ errorMessage() }}</div> }
        <label class="block text-sm font-medium" for="register-name">Name<input id="register-name" formControlName="name" type="text" autocomplete="name" class="auth-input" /></label>
        @if (form.controls.name.touched && form.controls.name.invalid) { <p class="field-error">Enter your name.</p> }
        <label class="block text-sm font-medium" for="register-email">Email<input id="register-email" formControlName="email" type="email" autocomplete="email" class="auth-input" /></label>
        @if (form.controls.email.touched && form.controls.email.invalid) { <p class="field-error">Enter a valid email address.</p> }
        <label class="block text-sm font-medium" for="register-password">Password<input id="register-password" formControlName="password" [type]="showPassword() ? 'text' : 'password'" autocomplete="new-password" class="auth-input" /></label>
        <p class="text-xs text-content-muted">Use at least 8 characters with upper and lower case letters, a number and a symbol.</p>
        <label class="block text-sm font-medium" for="register-password-confirmation">Confirm password<input id="register-password-confirmation" formControlName="password_confirmation" [type]="showPassword() ? 'text' : 'password'" autocomplete="new-password" class="auth-input" /></label>
        @if (form.controls.password_confirmation.touched && form.controls.password_confirmation.value !== form.controls.password.value) { <p class="field-error">Passwords must match.</p> }
        <button type="button" class="text-sm font-medium text-brand-strong" (click)="showPassword.update((value) => !value)">{{ showPassword() ? 'Hide passwords' : 'Show passwords' }}</button>
        <button class="auth-button" type="submit" [disabled]="form.invalid || submitting()">{{ submitting() ? 'Creating account…' : 'Create account' }}</button>
        <p class="text-center text-sm text-content-secondary">Already have an account? <a routerLink="/login" class="font-medium text-brand-strong hover:text-brand-hover">Sign in</a></p>
      </form>
    </app-auth-shell>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly showPassword = signal(false);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
    password_confirmation: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid || this.form.controls.password.value !== this.form.controls.password_confirmation.value || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (error: unknown) => {
        const errors = this.auth.validationErrors(error);
        this.errorMessage.set(errors['email']?.[0] ?? this.auth.errorMessage(error));
        this.submitting.set(false);
      },
    });
  }
}
