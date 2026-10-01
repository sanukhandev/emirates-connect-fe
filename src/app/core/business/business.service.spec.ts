import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BusinessService } from './business.service';

const business = {
  id: 1, name: 'Example', slug: 'example', tagline: null, description: null,
  industry: 'technology', emirate: 'dubai', website_url: null, email: null, phone: null,
  logo_url: null, cover_image_url: null, status: 'active' as const, current_user_role: 'owner' as const,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
};

describe('BusinessService', () => {
  let service: BusinessService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [BusinessService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(BusinessService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the typed business and member endpoints', async () => {
    const read = firstValueFrom(service.getBusiness('example-company'));
    http.expectOne(`${environment.apiBaseUrl}/businesses/example-company`).flush({ data: business });
    await expect(read).resolves.toEqual(business);

    const create = firstValueFrom(service.createBusiness({ name: 'Example', tagline: null, description: null, industry: 'technology', emirate: 'dubai', website_url: null, email: null, phone: null }));
    const createRequest = http.expectOne(`${environment.apiBaseUrl}/businesses`);
    expect(createRequest.request.method).toBe('POST');
    createRequest.flush({ data: business });
    await expect(create).resolves.toEqual(business);

    const update = firstValueFrom(service.updateBusiness('example-company', { tagline: 'New' }));
    const updateRequest = http.expectOne(`${environment.apiBaseUrl}/businesses/example-company`);
    expect(updateRequest.request.method).toBe('PATCH');
    updateRequest.flush({ data: business });
    await expect(update).resolves.toEqual(business);

    const members = firstValueFrom(service.getMembers('example-company'));
    http.expectOne(`${environment.apiBaseUrl}/businesses/example-company/members?page=1`).flush({ data: [], links: {}, meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } });
    await expect(members).resolves.toMatchObject({ data: [] });
  });

  it('uses FormData for logo and cover media and supports deletes', async () => {
    const logo = firstValueFrom(service.uploadLogo('example-company', new File(['logo'], 'logo.png', { type: 'image/png' })));
    const logoRequest = http.expectOne(`${environment.apiBaseUrl}/businesses/example-company/logo`);
    expect(logoRequest.request.body).toBeInstanceOf(FormData);
    logoRequest.flush({ data: business });
    await expect(logo).resolves.toEqual(business);

    const cover = firstValueFrom(service.uploadCover('example-company', new File(['cover'], 'cover.webp', { type: 'image/webp' })));
    const coverRequest = http.expectOne(`${environment.apiBaseUrl}/businesses/example-company/cover-image`);
    expect(coverRequest.request.body).toBeInstanceOf(FormData);
    coverRequest.flush({ data: business });
    await expect(cover).resolves.toEqual(business);

    const removeLogo = firstValueFrom(service.deleteLogo('example-company'));
    http.expectOne({ url: `${environment.apiBaseUrl}/businesses/example-company/logo`, method: 'DELETE' }).flush(null);
    await expect(removeLogo).resolves.toBeUndefined();
    const removeCover = firstValueFrom(service.deleteCover('example-company'));
    http.expectOne({ url: `${environment.apiBaseUrl}/businesses/example-company/cover-image`, method: 'DELETE' }).flush(null);
    await expect(removeCover).resolves.toBeUndefined();
  });

  it('loads businesses, metadata and member mutations', async () => {
    const mine = firstValueFrom(service.getMyBusinesses());
    http.expectOne(`${environment.apiBaseUrl}/me/businesses?page=1`).flush({ data: [business], links: {}, meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 } });
    await expect(mine).resolves.toMatchObject({ data: [business] });

    const industries = firstValueFrom(service.getIndustries());
    http.expectOne(`${environment.apiBaseUrl}/meta/industries`).flush({ data: [{ value: 'technology', label: 'Technology' }] });
    await expect(industries).resolves.toEqual([{ value: 'technology', label: 'Technology' }]);

    const add = firstValueFrom(service.addMember('example-company', { user_id: 7, role: 'editor' }));
    const addRequest = http.expectOne(`${environment.apiBaseUrl}/businesses/example-company/members`);
    expect(addRequest.request.body).toEqual({ user_id: 7, role: 'editor' });
    addRequest.flush({ data: { id: 2, role: 'editor', created_at: '', user: { id: 7, name: 'Member', profile: null } } });
    await expect(add).resolves.toMatchObject({ id: 2 });

    const update = firstValueFrom(service.updateMemberRole('example-company', 2, 'admin'));
    http.expectOne(`${environment.apiBaseUrl}/businesses/example-company/members/2`).flush({ data: { id: 2, role: 'admin', created_at: '', user: { id: 7, name: 'Member', profile: null } } });
    await expect(update).resolves.toMatchObject({ role: 'admin' });

    const remove = firstValueFrom(service.removeMember('example-company', 2));
    http.expectOne({ url: `${environment.apiBaseUrl}/businesses/example-company/members/2`, method: 'DELETE' }).flush(null);
    await expect(remove).resolves.toBeUndefined();
  });
});
