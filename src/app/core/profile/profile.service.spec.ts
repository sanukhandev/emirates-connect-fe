import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthStateService } from '../auth/auth-state.service';
import { ProfileService } from './profile.service';

const profile = { display_name: 'Sanu', headline: 'Founder', bio: null, job_title: 'CEO', company_name: null, industry: 'technology', emirate: 'dubai', website_url: null, linkedin_url: null, avatar_url: null, cover_image_url: null, onboarding_completed: false };

describe('ProfileService', () => {
  let service: ProfileService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ProfileService, AuthStateService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProfileService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads current profile and metadata from the backend', async () => {
    const current = firstValueFrom(service.getCurrentProfile());
    http.expectOne(`${environment.apiBaseUrl}/me/profile`).flush({ data: profile });
    await expect(current).resolves.toEqual(profile);

    const industries = firstValueFrom(service.getIndustries());
    http.expectOne(`${environment.apiBaseUrl}/meta/industries`).flush({ data: [{ value: 'technology', label: 'Technology' }] });
    await expect(industries).resolves.toEqual([{ value: 'technology', label: 'Technology' }]);

    const emirates = firstValueFrom(service.getEmirates());
    http.expectOne(`${environment.apiBaseUrl}/meta/emirates`).flush({ data: [{ value: 'dubai', label: 'Dubai' }] });
    await expect(emirates).resolves.toEqual([{ value: 'dubai', label: 'Dubai' }]);
  });

  it('updates and completes onboarding with typed JSON payloads', async () => {
    const update = firstValueFrom(service.updateProfile({ display_name: 'Updated' }));
    const updateRequest = http.expectOne(`${environment.apiBaseUrl}/me/profile`);
    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({ display_name: 'Updated' });
    updateRequest.flush({ data: profile });
    await expect(update).resolves.toEqual(profile);

    const complete = firstValueFrom(service.completeOnboarding({ display_name: 'Sanu', industry: 'technology', emirate: 'dubai' }));
    const completeRequest = http.expectOne(`${environment.apiBaseUrl}/me/onboarding/complete`);
    expect(completeRequest.request.method).toBe('POST');
    completeRequest.flush({ data: { ...profile, onboarding_completed: true } });
    await expect(complete).resolves.toMatchObject({ onboarding_completed: true });
  });

  it('uses multipart requests for media and supports deletion', async () => {
    const upload = firstValueFrom(service.uploadAvatar(new File(['avatar'], 'avatar.png', { type: 'image/png' })));
    const avatar = http.expectOne(`${environment.apiBaseUrl}/me/profile/avatar`);
    expect(avatar.request.body).toBeInstanceOf(FormData);
    avatar.flush({ data: profile });
    await expect(upload).resolves.toEqual(profile);

    const cover = firstValueFrom(service.uploadCoverImage(new File(['cover'], 'cover.webp', { type: 'image/webp' })));
    const coverRequest = http.expectOne(`${environment.apiBaseUrl}/me/profile/cover-image`);
    expect(coverRequest.request.body).toBeInstanceOf(FormData);
    coverRequest.flush({ data: profile });
    await expect(cover).resolves.toEqual(profile);

    const removeAvatar = firstValueFrom(service.deleteAvatar());
    http.expectOne({ url: `${environment.apiBaseUrl}/me/profile/avatar`, method: 'DELETE' }).flush(null);
    await expect(removeAvatar).resolves.toBeUndefined();
  });

  it('loads a public profile without requiring account fields', async () => {
    const request = firstValueFrom(service.getPublicProfile(42));
    http.expectOne(`${environment.apiBaseUrl}/users/42`).flush({ data: { id: 42, name: 'Public User', profile } });
    await expect(request).resolves.toMatchObject({ id: 42, profile });
  });
});
