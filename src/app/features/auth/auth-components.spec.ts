import { TestBed } from '@angular/core/testing';
import { Type } from '@angular/core';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ForgotPasswordComponent } from './forgot-password.component';
import { RegisterComponent } from './register.component';
import { ResetPasswordComponent } from './reset-password.component';

describe('authentication form components', () => {
  it('requires registration fields before submission', () => {
    const register = create(RegisterComponent);
    const auth = TestBed.inject(AuthService) as unknown as { register: ReturnType<typeof vi.fn> };

    register.submit();

    expect(register.form.invalid).toBe(true);
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('requires an email before requesting a reset', () => {
    const forgot = create(ForgotPasswordComponent);
    const auth = TestBed.inject(AuthService) as unknown as { forgotPassword: ReturnType<typeof vi.fn> };

    forgot.submit();

    expect(forgot.form.invalid).toBe(true);
    expect(auth.forgotPassword).not.toHaveBeenCalled();
  });

  it('does not submit a reset without a link token and valid fields', () => {
    const reset = create(ResetPasswordComponent);
    const auth = TestBed.inject(AuthService) as unknown as { resetPassword: ReturnType<typeof vi.fn> };

    reset.submit();

    expect(reset.form.invalid).toBe(true);
    expect(auth.resetPassword).not.toHaveBeenCalled();
  });
});

function create<T>(component: Type<T>): T {
  const methods = {
    register: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    errorMessage: vi.fn(() => 'error'),
  };
  TestBed.configureTestingModule({
    imports: [component],
    providers: [{ provide: AuthService, useValue: methods }, provideRouter([])],
  });

  return TestBed.createComponent(component).componentInstance;
}
