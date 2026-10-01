import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/auth/auth.models';
import { LoginComponent } from './login.component';

const user: User = {
  id: 1,
  name: 'Sanu Khan',
  email: 'sanu@example.com',
  email_verified_at: null,
  account_status: 'active',
  created_at: '',
  updated_at: '',
};

describe('LoginComponent', () => {
  it('blocks invalid submission', () => {
    const login = vi.fn();
    const fixture = createFixture(login);

    fixture.componentInstance.submit();

    expect(login).not.toHaveBeenCalled();
  });

  it('submits credentials and navigates after success', () => {
    const login = vi.fn().mockReturnValue(of(user));
    const fixture = createFixture(login);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    fixture.componentInstance.form.setValue({ email: user.email, password: 'StrongPassword123!' });

    fixture.componentInstance.submit();

    expect(login).toHaveBeenCalledWith({ email: user.email, password: 'StrongPassword123!' });
    expect(navigate).toHaveBeenCalledWith('/');
  });
});

function createFixture(login: ReturnType<typeof vi.fn>) {
  TestBed.configureTestingModule({
    imports: [LoginComponent],
    providers: [
      { provide: AuthService, useValue: { login, errorMessage: () => 'error' } },
      provideRouter([]),
    ],
  });

  return TestBed.createComponent(LoginComponent);
}
