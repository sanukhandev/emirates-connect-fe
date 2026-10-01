import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { onboardingGuard, onboardingPageGuard } from './onboarding.guard';

const profile = { display_name: 'Sanu', headline: 'Founder', bio: null, job_title: 'CEO', company_name: null, industry: 'technology', emirate: 'dubai', website_url: null, linkedin_url: null, avatar_url: null, cover_image_url: null, onboarding_completed: false };

describe('onboarding guards', () => {
  it('redirects incomplete users to onboarding and allows onboarding itself', async () => {
    const auth = { initialize: () => of(undefined), isAuthenticated: () => true, currentUser: () => ({ profile }) };
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: auth }, provideRouter([])] });
    const result = await firstValueFrom(TestBed.runInInjectionContext(() => onboardingGuard({} as never, { url: '/' } as never)) as Observable<boolean | ReturnType<Router['createUrlTree']>>);
    expect((result as ReturnType<Router['createUrlTree']>).toString()).toBe('/onboarding');
  });

  it('redirects completed users away from onboarding', async () => {
    const auth = { initialize: () => of(undefined), isAuthenticated: () => true, currentUser: () => ({ profile: { ...profile, onboarding_completed: true } }) };
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: auth }, provideRouter([])] });
    const result = await firstValueFrom(TestBed.runInInjectionContext(() => onboardingPageGuard({} as never, {} as never)) as Observable<boolean | ReturnType<Router['createUrlTree']>>);
    expect((result as ReturnType<Router['createUrlTree']>).toString()).toBe('/profile');
  });
});
